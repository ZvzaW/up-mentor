"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import {
  createTrainingSchema,
  updateTrainingSchema,
  type CreateTrainingFormValues,
  type UpdateTrainingFormValues,
} from "@/lib/validations"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { cooperation_status, Prisma, user_role } from "@prisma/client"
import { endOfWeek, startOfWeek } from "date-fns"
import { isTrainingScheduledInPast } from "@/lib/training-calendar-functions"
import {
  combineDateAndTime,
  formatWorkplaceAddress,
  parseCalendarDate,
  toTrainingDateTimeString,
  toWallClockDate,
} from "@/lib/utils"
import { TrainingDTO, WorkplaceAddress } from "@/lib/types"
import { getLogger } from "@/lib/server-logger"

function mapTraining(t: {
  id: string
  trainer_id: string
  trainee_id: string
  scheduled_at: Date
  duration: Prisma.Decimal
  cooperation: {
    trainee: { user: { name: string; surname: string } }
    trainer: { user: { name: string; surname: string } }
    workplace: WorkplaceAddress | null
    status: cooperation_status
  }
}): TrainingDTO {
  const isFinished = t.cooperation.status === cooperation_status.finished
  const workplaceAddress = t.cooperation.workplace
    ? formatWorkplaceAddress(t.cooperation.workplace)
    : "Dane niedostępne"

  return {
    id: t.id,
    trainerId: t.trainer_id,
    traineeId: t.trainee_id,
    traineeName: isFinished
      ? "Dane niedostępne"
      : `${t.cooperation.trainee.user.name} ${t.cooperation.trainee.user.surname}`,
    trainerName: isFinished
      ? "Dane niedostępne"
      : `${t.cooperation.trainer.user.name} ${t.cooperation.trainer.user.surname}`,
    workplaceAddress: workplaceAddress,
    scheduledAt: toTrainingDateTimeString(t.scheduled_at),
    duration: Number(t.duration),
  }
}

async function validateTrainerTrainingInput(
  trainerId: string,
  data: CreateTrainingFormValues
) {
  const cooperation = await prisma.cooperation.findFirst({
    where: {
      trainer_id: trainerId,
      trainee_id: data.trainee_id,
      status: cooperation_status.active,
    },
  })

  if (!cooperation) {
    return { error: "Brak aktywnej współpracy z wybranym podopiecznym." }
  }

  const scheduledAt = combineDateAndTime(data.date, data.start_time)
  if (isTrainingScheduledInPast(toWallClockDate(scheduledAt))) {
    return {
      error:
        "Termin treningu nie może być w przeszłości. Popraw datę lub godzinę.",
    }
  }

  return {}
}

export async function createTraining(raw: CreateTrainingFormValues) {
  const logger = await getLogger()

  const session = await auth()
  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== user_role.trainer) {
    return { error: "Brak uprawnień do tej operacji." }
  }

  const userId = session.user.id

  logger.info({ userId }, "Creating training")

  const validated = createTrainingSchema.safeParse(raw)
  if (!validated.success) {
    return { error: "Nieprawidłowe dane wejściowe." }
  }

  const data = validated.data
  const validation = await validateTrainerTrainingInput(session.user.id, data)
  if (validation.error) {
    return { error: validation.error }
  }

  try {
    await prisma.training.create({
      data: {
        trainer_id: session.user.id,
        trainee_id: data.trainee_id,
        scheduled_at: combineDateAndTime(data.date, data.start_time),
        duration: new Prisma.Decimal(data.duration),
      },
    })

    logger.info({ userId }, "Training created successfully")
    revalidatePath("/dashboard/trainings")
    return { success: true }
  } catch {
    logger.error({ userId }, "Error creating training")
    return {
      error: "Wystąpił błąd podczas zapisywania treningu. Spróbuj ponownie.",
    }
  }
}

export async function updateTraining(raw: UpdateTrainingFormValues) {
  const logger = await getLogger()

  const session = await auth()
  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== user_role.trainer) {
    return { error: "Brak uprawnień do tej operacji." }
  }

  const userId = session.user.id

  logger.info({ userId }, "Updating training")

  const validated = updateTrainingSchema.safeParse(raw)
  if (!validated.success) {
    return { error: "Nieprawidłowe dane wejściowe." }
  }

  const data = validated.data
  const validation = await validateTrainerTrainingInput(session.user.id, data)
  if (validation.error) {
    return { error: validation.error }
  }

  try {
    const existing = await prisma.training.findFirst({
      where: { id: data.id, trainer_id: session.user.id },
    })

    if (!existing) {
      logger.warn({ userId, trainingId: data.id }, "Training not found")
      return { error: "Nie znaleziono treningu." }
    }

    if (isTrainingScheduledInPast(toWallClockDate(existing.scheduled_at))) {
      logger.warn(
        { userId, trainingId: data.id },
        "Training cannot be edited because it is in the past"
      )
      return { error: "Nie można edytować treningu z przeszłości." }
    }

    await prisma.training.update({
      where: { id: data.id },
      data: {
        trainee_id: data.trainee_id,
        scheduled_at: combineDateAndTime(data.date, data.start_time),
        duration: new Prisma.Decimal(data.duration),
      },
    })

    logger.info(
      { userId, trainingId: data.id },
      "Training updated successfully"
    )
    revalidatePath("/dashboard/trainings")
    return { success: true }
  } catch {
    logger.error({ userId, trainingId: data.id }, "Error updating training")
    return {
      error: "Wystąpił błąd podczas aktualizacji treningu. Spróbuj ponownie.",
    }
  }
}

export async function deleteTraining(id: string) {
  const logger = await getLogger()

  const session = await auth()
  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== user_role.trainer) {
    return { error: "Brak uprawnień do tej operacji." }
  }

  const userId = session.user.id

  logger.info({ userId, trainingId: id }, "Deleting training")

  try {
    const existing = await prisma.training.findFirst({
      where: { id, trainer_id: session.user.id },
    })

    if (!existing) {
      logger.warn({ userId, trainingId: id }, "Training not found")
      return { error: "Nie znaleziono treningu." }
    }

    if (isTrainingScheduledInPast(toWallClockDate(existing.scheduled_at))) {
      logger.warn(
        { userId, trainingId: id },
        "Training cannot be deleted because it is in the past"
      )
      return { error: "Nie można usunąć treningu z przeszłości." }
    }

    await prisma.training.delete({ where: { id } })
    logger.info({ userId, trainingId: id }, "Training deleted successfully")
    revalidatePath("/dashboard/trainings")
    return { success: true }
  } catch {
    logger.error({ userId, trainingId: id }, "Error deleting training")
    return {
      error: "Wystąpił błąd podczas usuwania treningu. Spróbuj ponownie.",
    }
  }
}

export async function getTrainingsForWeek(weekAnchorDate: string) {
  const logger = await getLogger()

  const session = await auth()
  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  const userId = session.user.id

  logger.info({ userId, weekAnchorDate }, "Fetching trainings for week")

  const anchor = parseCalendarDate(weekAnchorDate)
  const weekStartLocal = startOfWeek(anchor, { weekStartsOn: 1 })
  const weekEndLocal = endOfWeek(anchor, { weekStartsOn: 1 })
  const weekStart = new Date(
    Date.UTC(
      weekStartLocal.getFullYear(),
      weekStartLocal.getMonth(),
      weekStartLocal.getDate(),
      0,
      0,
      0,
      0
    )
  )
  const weekEnd = new Date(
    Date.UTC(
      weekEndLocal.getFullYear(),
      weekEndLocal.getMonth(),
      weekEndLocal.getDate(),
      23,
      59,
      59,
      999
    )
  )

  try {
    const where =
      session.user.role === user_role.trainer
        ? { trainer_id: session.user.id }
        : { trainee_id: session.user.id }

    const trainings = await prisma.training.findMany({
      where: {
        ...where,
        scheduled_at: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
      include: {
        cooperation: {
          include: {
            trainee: {
              include: {
                user: { select: { name: true, surname: true } },
              },
            },
            trainer: {
              include: {
                user: { select: { name: true, surname: true } },
              },
            },
            workplace: {
              select: {
                name: true,
                street: true,
                building_number: true,
                flat_number: true,
                city: true,
              },
            },
          },
        },
      },
      orderBy: { scheduled_at: "asc" },
    })

    logger.info(
      { userId, weekAnchorDate },
      "Trainings for week fetched successfully"
    )
    return {
      success: true,
      data: trainings.map(mapTraining),
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
    }
  } catch {
    logger.error({ userId, weekAnchorDate }, "Error fetching trainings for week")
    return {
      error: "Nie udało się pobrać treningów. Spróbuj odświeżyć stronę.",
    }
  }
}
