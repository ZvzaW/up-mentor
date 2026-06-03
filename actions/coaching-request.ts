"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import {
  coachingRequestSchema,
  type CoachingRequestInput,
} from "@/lib/validations"
import { redirect } from "next/navigation"

export async function sendCoachingRequest(data: CoachingRequestInput) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== "trainee") {
    return { error: "Brak uprawnień do tej operacji." }
  }

  const validated = coachingRequestSchema.safeParse(data)
  if (!validated.success) {
    return { error: "Nieprawidłowe dane wejściowe." }
  }

  const traineeId = session.user.id
  const { trainer_id, workplace_id, message } = validated.data

  try {
    const existingRequest = await prisma.coaching_request.findUnique({
      where: {
        trainer_id_trainee_id: { trainer_id, trainee_id: traineeId },
      },
    })

    if (existingRequest) {
      return { error: "Wysłałeś już prośbę o współpracę do tego trenera." }
    }

    const existingCooperation = await prisma.cooperation.findUnique({
      where: {
        trainer_id_trainee_id: { trainer_id, trainee_id: traineeId },
        status: "active",
      },
    })

    if (existingCooperation) {
      return { error: "Posiadasz już aktywną współpracę z tym trenerem." }
    }

    await prisma.coaching_request.create({
      data: {
        trainee_id: traineeId,
        trainer_id: trainer_id,
        workplace_id: workplace_id,
        message: message,
      },
    })

    revalidatePath("/dashboard/trainers/catalog")
    return { success: true }
  } catch (error) {
    console.error(
      "[SEND_COACHING_REQUEST_ERROR]:",
      new Date().toLocaleString("pl-PL"),
      error
    )
    return {
      error: "Wystąpił błąd podczas wysyłania prośby. Spróbuj ponownie.",
    }
  }
}

export async function deleteCoachingRequest(trainerId: string) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== "trainee") {
    return { error: "Brak uprawnień do tej operacji." }
  }

  const traineeId = session.user.id

  try {
    await prisma.coaching_request.delete({
      where: {
        trainer_id_trainee_id: {
          trainer_id: trainerId,
          trainee_id: traineeId,
        },
      },
    })

    revalidatePath("/dashboard/trainers/catalog")
    return { success: true }
  } catch (error) {
    console.error(
      "[DELETE_COACHING_REQUEST_ERROR]:",
      new Date().toLocaleString("pl-PL"),
      error
    )
    return { error: "Wystąpił błąd podczas usuwania danych. Spróbuj ponownie." }
  }
}

export async function acceptRequest(traineeId: string, workplaceId: string) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== "trainer") {
    return { error: "Brak uprawnień do tej operacji." }
  }

  const trainerId = session.user.id

  try {
    await prisma.$transaction(async (tx) => {
      const existingCooperation = await tx.cooperation.findUnique({
        where: {
          trainer_id_trainee_id: {
            trainer_id: trainerId,
            trainee_id: traineeId,
          },
        },
        select: {
          status: true,
        },
      })

      if (existingCooperation) {
        if (existingCooperation.status === "finished") {
          await tx.cooperation.update({
            where: {
              trainer_id_trainee_id: {
                trainer_id: trainerId,
                trainee_id: traineeId,
              },
            },
            data: {
              status: "active",
              workplace_id: workplaceId,
            },
          })
        } else {
          throw new Error("ACTIVE_COOPERATION_EXISTS")
        }
      } else {
        await tx.cooperation.create({
          data: {
            trainer_id: trainerId,
            trainee_id: traineeId,
            workplace_id: workplaceId,
            status: "active",
          },
        })
      }

      await tx.coaching_request.delete({
        where: {
          trainer_id_trainee_id: {
            trainer_id: trainerId,
            trainee_id: traineeId,
          },
        },
      })
    })

    revalidatePath("/dashboard/trainees")
    return { success: true }
  } catch (error) {
    console.error(
      "[ACCEPT_REQUEST_ERROR]:",
      new Date().toLocaleString("pl-PL"),
      error
    )
    if (
      error instanceof Error &&
      error.message === "ACTIVE_COOPERATION_EXISTS"
    ) {
      return { error: "Posiadasz już aktywną współpracę z tym podopiecznym." }
    }

    return {
      error: "Wystąpił błąd podczas akceptacji prośby. Spróbuj ponownie.",
    }
  }
}

export async function rejectRequest(traineeId: string) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== "trainer") {
    return { error: "Brak uprawnień do tej operacji." }
  }

  const trainerId = session.user.id

  try {
    await prisma.coaching_request.delete({
      where: {
        trainer_id_trainee_id: {
          trainer_id: trainerId,
          trainee_id: traineeId,
        },
      },
    })

    revalidatePath("/dashboard/trainees")
    return { success: true }
  } catch (error) {
    console.error(
      "[REJECT_REQUEST_ERROR]:",
      new Date().toLocaleString("pl-PL"),
      error
    )
    return {
      error: "Wystąpił błąd podczas odrzucania prośby. Spróbuj ponownie.",
    }
  }
}
