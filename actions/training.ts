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
import { Prisma } from "@prisma/client"
import { endOfWeek, startOfDay, isBefore, startOfWeek } from "date-fns"
import { combineDateAndTime } from "@/lib/utils"

export type CalendarTraining = {
  id: string
  trainerId: string
  traineeId: string
  traineeName: string
  trainerName: string
  workplaceName: string
  scheduledAt: string
  duration: number
}

type WorkplaceAddress = {
  name: string
  street: string
  building_number: string
  flat_number: string | null
  city: string
}

function formatWorkplaceAddress(workplace: WorkplaceAddress) {
  const flat = workplace.flat_number ? `/${workplace.flat_number}` : ""
  return `${workplace.name} - ul. ${workplace.street} ${workplace.building_number}${flat}, ${workplace.city}`
}

function mapTraining(
  t: {
    id: string
    trainer_id: string
    trainee_id: string
    scheduled_at: Date
    duration: Prisma.Decimal
    cooperation: {
      trainee: { user: { name: string; surname: string } }
      trainer: { user: { name: string; surname: string } }
      workplace: WorkplaceAddress
    }
  }
): CalendarTraining {
  return {
    id: t.id,
    trainerId: t.trainer_id,
    traineeId: t.trainee_id,
    traineeName: `${t.cooperation.trainee.user.name} ${t.cooperation.trainee.user.surname}`,
    trainerName: `${t.cooperation.trainer.user.name} ${t.cooperation.trainer.user.surname}`,
    workplaceName: formatWorkplaceAddress(t.cooperation.workplace),
    scheduledAt: t.scheduled_at.toISOString(),
    duration: Number(t.duration),
  }
}

function isTrainingScheduledInPast(scheduledAt: Date) {
  const todayStart = startOfDay(new Date())
  const scheduledDay = startOfDay(scheduledAt)
  if (isBefore(scheduledDay, todayStart)) return true
  return scheduledAt.getTime() < Date.now()
}

async function validateTrainerTrainingInput(
  trainerId: string,
  data: CreateTrainingFormValues
): Promise<{ error: string } | Record<string, never>> {
  const cooperation = await prisma.cooperation.findFirst({
    where: {
      trainer_id: trainerId,
      trainee_id: data.trainee_id,
      status: "active",
    },
  })

  if (!cooperation) {
    return { error: "Brak aktywnej współpracy z wybranym podopiecznym." }
  }

  const scheduledAt = combineDateAndTime(data.date, data.start_time)
  if (isTrainingScheduledInPast(scheduledAt)) {
    return { error: "Termin treningu nie może być w przeszłości. Popraw datę lub godzinę." }
  }

  return {}
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
      session.user.role === "trainer"
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
  } catch {
    return { error: "Nie udało się pobrać treningów." }
  }
}

export async function createTraining(raw: CreateTrainingFormValues) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== "trainer") {
    return { error: "Brak uprawnień do tej operacji." }
  }

  const parsed = createTrainingSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane." }
  }

  const data = parsed.data
  const validation = await validateTrainerTrainingInput(session.user.id, data)
  if ("error" in validation) {
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
  } catch {
    return { error: "Nie udało się utworzyć treningu." }
  }
}

export async function updateTraining(raw: UpdateTrainingFormValues) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== "trainer") {
    return { error: "Brak uprawnień do tej operacji." }
  }

  const parsed = updateTrainingSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane." }
  }

  const data = parsed.data
  const validation = await validateTrainerTrainingInput(session.user.id, data)
  if ("error" in validation) {
    return { error: validation.error }
  }

  try {
    const existing = await prisma.training.findFirst({
      where: { id: data.id, trainer_id: session.user.id },
    })

    if (!existing) {
      return { error: "Nie znaleziono treningu." }
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
  } catch {
    return { error: "Nie udało się zaktualizować treningu." }
  }
}

export async function deleteTraining(id: string) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== "trainer") {
    return { error: "Brak uprawnień do tej operacji." }
  }

  try {
    const existing = await prisma.training.findFirst({
      where: { id, trainer_id: session.user.id },
    })

    if (!existing) {
      return { error: "Nie znaleziono treningu." }
    }

    await prisma.training.delete({ where: { id } })
    revalidatePath("/dashboard/trainings")
    return { success: true }
  } catch {
    return { error: "Nie udało się usunąć treningu." }
  }
}
