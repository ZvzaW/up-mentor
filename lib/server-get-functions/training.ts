import { prisma } from "@/lib/prisma"
import { cooperation_status } from "@prisma/client"
import { format } from "date-fns"
import { pl } from "date-fns/locale"
import {
  formatDate,
  formatWorkplaceAddress,
  toTimeInputValue,
} from "@/lib/utils"
import { WorkplaceAddress } from "@/lib/types"
import { getLogger } from "@/lib/server-logger"

function capitalizeMonthLabel(label: string) {
  if (!label) return label
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function groupTrainingsByYearAndMonth(
  items: {
    id: string
    date: string
    startTime: string
    durationLabel: string
    workplaceAddress: string
  }[],
  scheduledDates: Date[]
) {
  const yearMap = new Map<
    number,
    Map<string, { monthLabel: string; trainings: typeof items }>
  >()

  items.forEach((item, index) => {
    const date = scheduledDates[index]
    const year = date.getFullYear()
    const month = date.getMonth()
    const monthKey = `${year}-${month}`
    const monthLabel = capitalizeMonthLabel(
      format(date, "LLLL", { locale: pl })
    )

    if (!yearMap.has(year)) {
      yearMap.set(year, new Map())
    }
    const months = yearMap.get(year)!
    if (!months.has(monthKey)) {
      months.set(monthKey, { monthLabel, trainings: [] })
    }
    months.get(monthKey)!.trainings.push(item)
  })

  return Array.from(yearMap.entries())
    .sort(([a], [b]) => b - a)
    .map(([year, months]) => ({
      year,
      months: Array.from(months.entries())
        .sort(([a], [b]) => {
          const [, monthA] = a.split("-").map(Number)
          const [, monthB] = b.split("-").map(Number)
          return monthB - monthA
        })
        .map(([, group]) => group),
    }))
}

export async function getTrainingsForTrainee(
  userId: string,
  traineeId: string
) {
  const logger = await getLogger()

  logger.info({ userId, traineeId }, "Fetching trainings for trainee")

  try {
    const cooperation = await prisma.cooperation.findFirst({
      where: {
        trainer_id: userId,
        trainee_id: traineeId,
        status: cooperation_status.active,
      },
      include: {
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
    })

    if (!cooperation) {
      return { error: "Brak aktywnej współpracy z tym podopiecznym." }
    }

    const trainings = await prisma.training.findMany({
      where: {
        trainer_id: userId,
        trainee_id: traineeId,
      },
      orderBy: { scheduled_at: "desc" },
    })

    const listItems = trainings.map((t) => ({
      id: t.id,
      date: formatDate(t.scheduled_at),
      startTime: toTimeInputValue(t.scheduled_at),
      durationLabel: `${Number(t.duration)} h`,
      workplaceAddress: formatWorkplaceAddress(
        cooperation.workplace as WorkplaceAddress
      ),
    }))

    const scheduledDates = trainings.map((t) => t.scheduled_at)

    logger.info({ userId, traineeId }, "Trainings for trainee fetched successfully")

    return {
      success: true,
      data: groupTrainingsByYearAndMonth(listItems, scheduledDates),
    }
  } catch (error) {
    logger.error({ userId, traineeId }, "Error fetching trainings for trainee")
    return {
      error: "Nie udało się pobrać treningów. Spróbuj odświeżyć stronę.",
    }
  }
}
