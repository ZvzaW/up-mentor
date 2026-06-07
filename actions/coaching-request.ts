"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import {
  coachingRequestSchema,
  type CoachingRequestInput,
} from "@/lib/validations"
import { redirect } from "next/navigation"
import { cooperation_status, user_role } from "@prisma/client"
import { getLogger } from "@/lib/server-logger"

export async function sendCoachingRequest(data: CoachingRequestInput) {
  const logger = await getLogger()

  const session = await auth()

  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== user_role.trainee) {
    return { error: "Brak uprawnień do tej operacji." }
  }

  const validated = coachingRequestSchema.safeParse(data)
  if (!validated.success) {
    return { error: "Nieprawidłowe dane wejściowe." }
  }

  const traineeId = session.user.id
  const { trainer_id, workplace_id, message } = validated.data

  logger.info({ traineeId, trainerId: trainer_id }, "Sending coaching request")

  try {
    const existingRequest = await prisma.coaching_request.findUnique({
      where: {
        trainer_id_trainee_id: { trainer_id, trainee_id: traineeId },
      },
      select: { created_at: true },
    })

    if (existingRequest) {
      logger.info(
        { traineeId, trainerId: trainer_id },
        "Coaching request already sent"
      )
      return { error: "Wysłałeś/aś już prośbę o współpracę do tego trenera." }
    }

    const existingCooperation = await prisma.cooperation.findUnique({
      where: {
        trainer_id_trainee_id: { trainer_id, trainee_id: traineeId },
        status: cooperation_status.active,
      },
      select: { created_at: true },
    })

    if (existingCooperation) {
      logger.info(
        { traineeId, trainerId: trainer_id },
        "Cooperation already exists"
      )
      return { error: "Posiadasz już aktywną współpracę z tym trenerem." }
    }

    const workplace = await prisma.workplace.findFirst({
      where: {
        id: workplace_id,
        trainer_id: trainer_id,
      },
      select: { id: true },
    })

    if (!workplace) {
      return { error: "Wybrane miejsce treningów nie jest dostępne." }
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
    logger.info(
      { traineeId, trainerId: trainer_id },
      "Coaching request sent successfully"
    )
    return { success: true }
  } catch {
    logger.error(
      { traineeId, trainerId: trainer_id },
      "Error sending coaching request"
    )
    return {
      error: "Wystąpił błąd podczas wysyłania prośby. Spróbuj ponownie.",
    }
  }
}

export async function deleteCoachingRequest(trainerId: string) {
  const logger = await getLogger()

  const session = await auth()

  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== user_role.trainee) {
    return { error: "Brak uprawnień do tej operacji." }
  }

  const traineeId = session.user.id

  logger.info({ traineeId, trainerId }, "Deleting coaching request")

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
    logger.info(
      { traineeId, trainerId },
      "Coaching request deleted successfully"
    )
    return { success: true }
  } catch {
    logger.error({ traineeId, trainerId }, "Error deleting coaching request")
    return { error: "Wystąpił błąd podczas usuwania danych. Spróbuj ponownie." }
  }
}

export async function acceptRequest(traineeId: string) {
  const logger = await getLogger()

  const session = await auth()

  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== user_role.trainer) {
    return { error: "Brak uprawnień do tej operacji." }
  }

  const trainerId = session.user.id

  logger.info({ trainerId, traineeId }, "Accepting coaching request")

  try {
    await prisma.$transaction(async (tx) => {
      const request = await tx.coaching_request.findUnique({
        where: {
          trainer_id_trainee_id: {
            trainer_id: trainerId,
            trainee_id: traineeId,
          },
        },
        select: {
          workplace_id: true,
        },
      })

      if (!request) {
        return { error: "Nie znaleziono prośby o współpracę." }
      }

      const workplaceId = request.workplace_id

      const workplace = await tx.workplace.findFirst({
        where: {
          id: workplaceId,
          trainer_id: trainerId,
        },
        select: { id: true },
      })

      if (!workplace) {
        logger.warn(
          { trainerId, traineeId, workplaceId },
          "Workplace not found"
        )
        return { error: "Miejsce treningów z prośby nie jest dostępne." }
      }

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
        if (existingCooperation.status === cooperation_status.finished) {
          await tx.cooperation.update({
            where: {
              trainer_id_trainee_id: {
                trainer_id: trainerId,
                trainee_id: traineeId,
              },
            },
            data: {
              status: cooperation_status.active,
              workplace_id: workplaceId,
            },
          })
        } else {
          logger.warn(
            { trainerId, traineeId, workplaceId },
            "Cooperation already exists"
          )
          return {
            error: "Posiadasz już aktywną współpracę z tym podopiecznym.",
          }
        }
      } else {
        await tx.cooperation.create({
          data: {
            trainer_id: trainerId,
            trainee_id: traineeId,
            workplace_id: workplaceId,
            status: cooperation_status.active,
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
    logger.info(
      { trainerId, traineeId },
      "Coaching request accepted successfully"
    )
    return { success: true }
  } catch {
    logger.error({ trainerId, traineeId }, "Error accepting coaching request")

    return {
      error: "Wystąpił błąd podczas akceptacji prośby. Spróbuj ponownie.",
    }
  }
}

export async function rejectRequest(traineeId: string) {
  const logger = await getLogger()

  const session = await auth()

  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== user_role.trainer) {
    return { error: "Brak uprawnień do tej operacji." }
  }

  const trainerId = session.user.id

  logger.info({ trainerId, traineeId }, "Rejecting coaching request")

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
    logger.info(
      { trainerId, traineeId },
      "Coaching request rejected successfully"
    )
    return { success: true }
  } catch {
    logger.error({ trainerId, traineeId }, "Error rejecting coaching request")
    return {
      error: "Wystąpił błąd podczas odrzucania prośby. Spróbuj ponownie.",
    }
  }
}
