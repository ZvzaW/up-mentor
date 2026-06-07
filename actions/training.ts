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
import { combineDateAndTime, formatWorkplaceAddress } from "@/lib/utils"
import { TrainingDTO, WorkplaceAddress } from "@/lib/types"

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
    scheduledAt: t.scheduled_at.toISOString(),
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
  if (isTrainingScheduledInPast(scheduledAt)) {
    return {
      error:
        "Termin treningu nie może być w przeszłości. Popraw datę lub godzinę.",
    }
  }

  return {}
}

export async function createTraining(raw: CreateTrainingFormValues) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== user_role.trainer) {
    return { error: "Brak uprawnień do tej operacji." }
  }

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

    revalidatePath("/dashboard/trainings")
    return { success: true }
  } catch (error) {
    console.error(
      "[CREATE_TRAINING_ERROR]:",
      new Date().toLocaleString("pl-PL"),
      error
    )
    return {
      error: "Wystąpił błąd podczas zapisywania treningu. Spróbuj ponownie.",
    }
  }
}

export async function updateTraining(raw: UpdateTrainingFormValues) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== user_role.trainer) {
    return { error: "Brak uprawnień do tej operacji." }
  }

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
      return { error: "Nie znaleziono treningu." }
    }

    if (isTrainingScheduledInPast(existing.scheduled_at)) {
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

    revalidatePath("/dashboard/trainings")
    return { success: true }
  } catch (error) {
    console.error(
      "[UPDATE_TRAINING_ERROR]:",
      new Date().toLocaleString("pl-PL"),
      error
    )
    return {
      error: "Wystąpił błąd podczas aktualizacji treningu. Spróbuj ponownie.",
    }
  }
}

export async function deleteTraining(id: string) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== user_role.trainer) {
    return { error: "Brak uprawnień do tej operacji." }
  }

  try {
    const existing = await prisma.training.findFirst({
      where: { id, trainer_id: session.user.id },
    })

    if (!existing) {
      return { error: "Nie znaleziono treningu." }
    }

    if (isTrainingScheduledInPast(existing.scheduled_at)) {
      return { error: "Nie można usunąć treningu z przeszłości." }
    }

    await prisma.training.delete({ where: { id } })
    revalidatePath("/dashboard/trainings")
    return { success: true }
  } catch (error) {
    console.error(
      "[DELETE_TRAINING_ERROR]:",
      new Date().toLocaleString("pl-PL"),
      error
    )
    return {
      error: "Wystąpił błąd podczas usuwania treningu. Spróbuj ponownie.",
    }
  }
}

export async function getTrainingsForWeek(weekAnchorIso: string) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }
  const anchor = new Date(weekAnchorIso)
  const weekStart = startOfWeek(anchor, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(anchor, { weekStartsOn: 1 })

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

    return {
      success: true,
      data: trainings.map(mapTraining),
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
    }
  } catch (error) {
    console.error(
      "[GET_TRAININGS_FOR_WEEK_ERROR]:",
      new Date().toLocaleString("pl-PL"),
      error
    )
    return {
      error: "Nie udało się pobrać treningów. Spróbuj odświeżyć stronę.",
    }
  }
}
