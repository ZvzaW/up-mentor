"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { toDownloadFiles, toEmailAttachments } from "@/lib/workout-plan-pdf"
import type { WorkoutPlanFromDb } from "@/lib/types"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import nodemailer from "nodemailer"

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
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  const trainerId =
    session.user.role === "trainer" ? session.user.id : partnerId
  const traineeId =
    session.user.role === "trainee" ? session.user.id : partnerId

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

    if (!cooperation || cooperation.status !== "active") {
      return { error: "Nie znaleziono aktywnej współpracy do zakończenia." }
    }

    const assignedPlans = await getAssignedPlansToTrainee(trainerId, traineeId)
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
          status: "finished",
          workplace_id: null,
        },
      }),
    ])

    if (assignedPlans.length > 0) {
      try {
        await sendAssignedPlansEmail({
          traineeEmail: cooperation.trainee.user.email,
          traineeName: cooperation.trainee.user.name,
          trainerFullName: `${cooperation.trainer.user.name} ${cooperation.trainer.user.surname}`,
          plans: assignedPlans,
        })
      } catch (emailError) {
        console.error("[SEND_PLANS_ERROR]:", emailError)
      }
    }

    revalidatePath("/dashboard/trainers")
    revalidatePath("/dashboard/trainees")

    return { success: true as const }
  } catch (error) {
    console.error("[FINISH_COOPERATION_ERROR]:", new Date().toLocaleString("pl-PL"), error)
    return {
      error: "Wystąpił błąd podczas rozwiązywania współpracy. Spróbuj ponownie.",
    }
  }
}
