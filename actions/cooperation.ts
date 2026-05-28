"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import nodemailer from "nodemailer"
import { renderWorkoutPlanPdfBuffer } from "@/lib/workout-plan-pdf"

const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST,
  port: Number(process.env.MAILTRAP_PORT),
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS,
  },
})

function sanitizePdfFilename(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

async function sendAssignedPlansEmail(params: {
  traineeEmail: string
  traineeName: string
  trainerFullName: string
  plans: Array<{
    name: string
    difficulty: string | null
    description: string | null
    section: Array<{
      body_part: string | null
      order: number
      exercise_set: Array<{
        order: number
        series_count: number
        reps_count: number
        weight: number | null
        exercise: {
          name: string
        }
      }>
    }>
  }>
}) {
  const attachments = await Promise.all(
    params.plans.map(async (plan, index) => {
      const buffer = await renderWorkoutPlanPdfBuffer(plan)
      const baseName = sanitizePdfFilename(plan.name) || `plan-treningowy-${index + 1}`

      return {
        filename: `${baseName}.pdf`,
        content: buffer,
        contentType: "application/pdf",
      }
    })
  )

  await transporter.sendMail({
    from: '"Upmentor" <no-reply@upmentor.pl>',
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

async function getAssignedPlansForCooperation(trainerId: string, traineeId: string) {
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

function mapPlanToPdfData(plan: Awaited<ReturnType<typeof getAssignedPlansForCooperation>>[number]) {
  return {
    name: plan.name,
    difficulty: plan.difficulty,
    description: plan.description,
    section: plan.section.map((section) => ({
      body_part: section.body_part,
      order: section.order,
      exercise_set: section.exercise_set.map((set) => ({
        order: set.order,
        series_count: set.series_count,
        reps_count: set.reps_count,
        weight: set.weight == null ? null : Number(set.weight),
        exercise: {
          name: set.exercise.name,
        },
      })),
    })),
  }
}

export async function getAssignedPlansPdfForDownload(partnerId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== "trainer" && session.user.role !== "trainee") {
    return { error: "Brak uprawnień do tej operacji." }
  }

  const trainerId =
    session.user.role === "trainer" ? session.user.id : partnerId
  const traineeId =
    session.user.role === "trainee" ? session.user.id : partnerId

  const cooperation = await prisma.cooperation.findUnique({
    where: {
      trainer_id_trainee_id: {
        trainer_id: trainerId,
        trainee_id: traineeId,
      },
    },
    select: {
      trainer_id: true,
    },
  })

  if (!cooperation) {
    return { error: "Nie znaleziono współpracy." }
  }

  const assignedPlans = await getAssignedPlansForCooperation(trainerId, traineeId)

  const files = await Promise.all(
    assignedPlans.map(async (plan, index) => {
      const pdfData = mapPlanToPdfData(plan)
      const buffer = await renderWorkoutPlanPdfBuffer(pdfData)
      const baseName = sanitizePdfFilename(plan.name) || `plan-treningowy-${index + 1}`

      return {
        filename: `${baseName}.pdf`,
        base64: buffer.toString("base64"),
      }
    })
  )

  return { success: true as const, data: files }
}

export async function finishCooperation(partnerId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== "trainer" && session.user.role !== "trainee") {
    return { error: "Brak uprawnień do tej operacji." }
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

    const assignedPlans = await getAssignedPlansForCooperation(trainerId, traineeId)
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
          plans: assignedPlans.map(mapPlanToPdfData),
        })
      } catch (emailError) {
        console.error("[FINISH_COOPERATION_SEND_PLANS_EMAIL_ERROR]:", emailError)
      }
    }

    revalidatePath("/dashboard/trainers")
    revalidatePath("/dashboard/trainees")

    return { success: true as const }
  } catch {
    return {
      error: "Wystąpił błąd podczas rozwiązywania współpracy. Spróbuj ponownie.",
    }
  }
}
