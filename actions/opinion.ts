"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import {
  TrainerOpinionFormValues,
  trainerOpinionSchema,
} from "@/lib/validations"
import { redirect } from "next/navigation"
import { cooperation_status, user_role } from "@prisma/client"
import { getLogger } from "@/lib/server-logger"

export async function getMyOpinion(trainerId: string) {
  const logger = await getLogger()

  const session = await auth()
  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== user_role.trainee) {
    return { error: "Brak uprawnień do tej operacji." }
  }

  const traineeId = session.user.id

  logger.info({ traineeId, trainerId }, "Fetching opinion")

  try {
    const opinion = await prisma.opinion.findUnique({
      where: {
        trainee_id_trainer_id: {
          trainee_id: session.user.id,
          trainer_id: trainerId,
        },
      },
      select: {
        rate: true,
        comment: true,
      },
    })

    if (!opinion) {
      logger.info({ traineeId, trainerId }, "Opinion fetched successfully")
      return { success: true as const, data: null }
    }

    logger.info({ traineeId, trainerId }, "Opinion fetched successfully")
    return {
      success: true as const,
      data: {
        rate: opinion.rate as 1 | 2 | 3 | 4 | 5,
        comment: opinion.comment,
      },
    }
  } catch {
    logger.error({ traineeId, trainerId }, "Error fetching opinion")
    return { error: "Nie udało się pobrać opinii. Spróbuj ponownie" }
  }
}

export async function upsertOpinion(opinion: TrainerOpinionFormValues) {
  const logger = await getLogger()

  const session = await auth()
  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== user_role.trainee) {
    return { error: "Brak uprawnień do tej operacji." }
  }

  const traineeId = session.user.id

  const validated = trainerOpinionSchema.safeParse(opinion)
  if (!validated.success) {
    return { error: "Nieprawidłowe dane formularza." }
  }

  const data = validated.data

  const cooperation = await prisma.cooperation.findUnique({
    where: {
      trainer_id_trainee_id: {
        trainer_id: data.trainer_id,
        trainee_id: session.user.id,
      },
    },
    select: { status: true },
  })

  if (!cooperation || cooperation.status !== cooperation_status.active) {
    logger.warn(
      { traineeId, trainerId: data.trainer_id },
      "Cooperation to upsert opinion not found"
    )
    return {
      error: "Możesz ocenić tylko trenera, z którym masz aktywną współpracę.",
    }
  }

  logger.info({ traineeId, trainerId: data.trainer_id }, "Upserting opinion")

  try {
    await prisma.opinion.upsert({
      where: {
        trainee_id_trainer_id: {
          trainee_id: session.user.id,
          trainer_id: data.trainer_id,
        },
      },
      create: {
        trainee_id: session.user.id,
        trainer_id: data.trainer_id,
        rate: data.rate,
        comment: data.comment,
      },
      update: {
        rate: data.rate,
        comment: data.comment,
      },
    })

    logger.info(
      { traineeId, trainerId: data.trainer_id },
      "Opinion upserted successfully"
    )
  } catch {
    logger.error(
      { traineeId, trainerId: data.trainer_id },
      "Error upserting opinion"
    )
    return {
      error: "Wystąpił błąd podczas zapisywania danych. Spróbuj ponownie.",
    }
  }

  return { success: true as const }
}

export async function deleteOpinion(trainerId: string) {
  const logger = await getLogger()

  const session = await auth()
  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== user_role.trainee) {
    return { error: "Brak uprawnień do tej operacji." }
  }

  const traineeId = session.user.id

  logger.info({ traineeId, trainerId }, "Deleting opinion")

  try {
    await prisma.opinion.deleteMany({
      where: {
        trainee_id: session.user.id,
        trainer_id: trainerId,
      },
    })

    logger.info({ traineeId, trainerId }, "Opinion deleted successfully")
  } catch {
    logger.error({ traineeId, trainerId }, "Error deleting opinion")
    return { error: "Wystąpił błąd podczas usuwania danych. Spróbuj ponownie." }
  }

  return { success: true as const }
}
