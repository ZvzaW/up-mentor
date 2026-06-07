"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { toEmailAttachments } from "@/lib/workout-plan-pdf"
import type { WorkoutPlanFromDb } from "@/lib/types"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import nodemailer from "nodemailer"
import { cooperation_status, user_role } from "@prisma/client"
import { getLogger } from "@/lib/server-logger"

const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST,
  port: Number(process.env.MAILTRAP_PORT),
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS,
  },
})

async function sendAssignedPlansEmail(params: {
  traineeEmail: string
  traineeName: string
  trainerFullName: string
  plans: WorkoutPlanFromDb[]
}) {
  const attachments = await toEmailAttachments(params.plans)

  await transporter.sendMail({
    from: '"Up-Mentor" <no-reply@upmentor.pl>',
    to: params.traineeEmail,
    subject: "Twoje plany treningowe po zakończeniu współpracy",
    html: `
      <p>Cześć ${params.traineeName},</p>
      <p>
        Współpraca z trenerem ${params.trainerFullName} została zakończona.
      </p>
      <p>
        W załącznikach przesyłamy Twoje przypisane plany treningowe w formacie PDF, aby nadal mieć do nich dostęp.
      </p>
      <p>Pozdrawiamy,<br/>Zespół Up-mentor</p>
    `,
    attachments,
  })
}

async function getAssignedPlansToTrainee(trainerId: string, traineeId: string) {
  return prisma.workout_plan.findMany({
    where: {
      trainer_id: trainerId,
      plans_library: {
        some: {
          trainee_id: traineeId,
        },
      },
    },
    include: {
      section: {
        orderBy: {
          order: "asc",
        },
        include: {
          exercise_set: {
            orderBy: {
              order: "asc",
            },
            include: {
              exercise: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  })
}

export async function finishCooperation(partnerId: string) {
  const logger = await getLogger()

  const session = await auth()
  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  const trainerId =
    session.user.role === user_role.trainer ? session.user.id : partnerId
  const traineeId =
    session.user.role === user_role.trainee ? session.user.id : partnerId

  logger.info({ trainerId, traineeId }, "Finishing cooperation")

  try {
    const cooperation = await prisma.cooperation.findUnique({
      where: {
        trainer_id_trainee_id: {
          trainer_id: trainerId,
          trainee_id: traineeId,
        },
      },
      include: {
        trainee: {
          include: {
            user: {
              select: {
                name: true,
                surname: true,
                email: true,
              },
            },
          },
        },
        trainer: {
          include: {
            user: {
              select: {
                name: true,
                surname: true,
              },
            },
          },
        },
      },
    })

    if (!cooperation || cooperation.status !== cooperation_status.active) {
      return { error: "Nie znaleziono aktywnej współpracy do zakończenia." }
    }

    const assignedPlans = await getAssignedPlansToTrainee(trainerId, traineeId)

    if (assignedPlans.length > 0) {
      await sendAssignedPlansEmail({
        traineeEmail: cooperation.trainee.user.email,
        traineeName: cooperation.trainee.user.name,
        trainerFullName: `${cooperation.trainer.user.name} ${cooperation.trainer.user.surname}`,
        plans: assignedPlans,
      })
    }

    const now = new Date()

    await prisma.$transaction([
      prisma.chat_message.deleteMany({
        where: {
          trainer_id: trainerId,
          trainee_id: traineeId,
        },
      }),
      prisma.training.deleteMany({
        where: {
          trainer_id: trainerId,
          trainee_id: traineeId,
          scheduled_at: {
            gt: now,
          },
        },
      }),
      prisma.plans_library.deleteMany({
        where: {
          trainee_id: traineeId,
          workout_plan: {
            trainer_id: trainerId,
          },
        },
      }),
      prisma.cooperation.update({
        where: {
          trainer_id_trainee_id: {
            trainer_id: trainerId,
            trainee_id: traineeId,
          },
        },
        data: {
          status: cooperation_status.finished,
          workplace_id: null,
        },
      }),
    ])

    revalidatePath("/dashboard/trainers")
    revalidatePath("/dashboard/trainees")

    logger.info({ trainerId, traineeId }, "Cooperation finished successfully")
    return { success: true as const }
  } catch (error) {
    logger.error({ trainerId, traineeId }, "Error finishing cooperation")
    return {
      error:
        "Wystąpił błąd podczas rozwiązywania współpracy. Spróbuj ponownie.",
    }
  }
}
