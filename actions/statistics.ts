"use server"

import { auth } from "@/auth"
import { user_role } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { formatDate, toTimeInputValue } from "@/lib/utils"
import {
  addDays,
  endOfDay,
  endOfMonth,
  endOfWeek,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns"
import { redirect } from "next/navigation"
import { getLogger } from "@/lib/server-logger"

const WEEK_DAY_LABELS = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Ndz"] as const

const MONTH_SHORT_NAMES = [
  "Sty",
  "Lut",
  "Mar",
  "Kwi",
  "Maj",
  "Cze",
  "Lip",
  "Sie",
  "Wrz",
  "Paź",
  "Lis",
  "Gru",
] as const

function isTrainingCompleted(scheduledAt: Date) {
  return scheduledAt.getTime() < Date.now()
}

function formatNextTrainingLabel(scheduledAt: Date) {
  return `${formatDate(scheduledAt)}, ${toTimeInputValue(scheduledAt)}`
}

//------------------------------------------------------------------------------------------------
async function getNextTraining(userId: string, role: user_role) {
  const where =
    role === user_role.trainer
      ? { trainer_id: userId, scheduled_at: { gte: new Date() } }
      : { trainee_id: userId, scheduled_at: { gte: new Date() } }

  const next = await prisma.training.findFirst({
    where,
    orderBy: { scheduled_at: "asc" },
    select: { scheduled_at: true },
  })

  if (!next) return null
  return formatNextTrainingLabel(next.scheduled_at)
}

//------------------------------------------------------------------------------------------------
export async function getStatistics() {
  const logger = await getLogger()

  const session = await auth()
  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  const role = session.user.role
  const userId = session.user.id

  logger.info({ userId, role }, "Fetching statistics")

  try {
    const nextTraining = await getNextTraining(userId, role)

    if (role === user_role.trainer) {
      const trainerStats = await getTrainerStatistics(userId)
      logger.info({ userId, role }, "Statistics fetched successfully")
      return {
        success: true,
        nextTraining,
        trainer: trainerStats,
      }
    }

    if (role === user_role.trainee) {
      const traineeStats = await getTraineeStatistics(userId)
      logger.info({ userId, role }, "Statistics fetched successfully")
      return {
        success: true,
        nextTraining,
        trainee: traineeStats,
      }
    }

    return { error: "Brak uprawnień do tej operacji." }
  } catch {
    logger.error({ userId, role }, "Error fetching statistics")
    return {
      error: "Nie udało się pobrać statystyk. Spróbuj odświeżyć stronę.",
    }
  }
}

//------------------------------------------------------------------------------------------------
async function getTrainerStatistics(trainerId: string) {
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })

  const currentMonthStart = startOfMonth(now)
  const previousMonthStart = startOfMonth(subMonths(now, 1))
  const previousMonthEnd = endOfMonth(subMonths(now, 1))

  const [weekTrainings, completedTrainings, trainer] = await Promise.all([
    prisma.training.findMany({
      where: {
        trainer_id: trainerId,
        scheduled_at: { gte: weekStart, lte: weekEnd },
      },
      select: { scheduled_at: true, duration: true },
    }),
    prisma.training.findMany({
      where: {
        trainer_id: trainerId,
        scheduled_at: {
          gte: previousMonthStart,
          lte: now,
        },
      },
      select: { scheduled_at: true, duration: true },
    }),
    prisma.trainer.findUnique({
      where: { id: trainerId },
      select: { price_per_training: true },
    }),
  ])

  const weeklyLoad = WEEK_DAY_LABELS.map((day, index) => {
    const dayStart = startOfDay(addDays(weekStart, index))
    const dayEnd = endOfDay(dayStart)
    const hours = weekTrainings
      .filter((t) => t.scheduled_at >= dayStart && t.scheduled_at <= dayEnd)
      .reduce((sum, t) => sum + Number(t.duration), 0)
    return { day, h: Math.round(hours * 10) / 10 }
  })

  const hourlyRate = trainer?.price_per_training ?? null
  const hasHourlyRate = hourlyRate !== null && hourlyRate > 0

  const countCompletedInMonth = (monthStart: Date, monthEnd: Date) =>
    completedTrainings.filter(
      (t) =>
        isTrainingCompleted(t.scheduled_at) &&
        t.scheduled_at >= monthStart &&
        t.scheduled_at <= monthEnd
    ).length

  const earningsInMonth = (monthStart: Date, monthEnd: Date) => {
    if (!hasHourlyRate) return 0
    return completedTrainings
      .filter(
        (t) =>
          isTrainingCompleted(t.scheduled_at) &&
          t.scheduled_at >= monthStart &&
          t.scheduled_at <= monthEnd
      )
      .reduce((sum, t) => sum + Number(t.duration) * hourlyRate!, 0)
  }

  const monthlyComparison = [
    {
      month: MONTH_SHORT_NAMES[previousMonthStart.getMonth()],
      trainings: countCompletedInMonth(previousMonthStart, previousMonthEnd),
      salary: earningsInMonth(previousMonthStart, previousMonthEnd),
    },
    {
      month: MONTH_SHORT_NAMES[currentMonthStart.getMonth()],
      trainings: countCompletedInMonth(currentMonthStart, now),
      salary: earningsInMonth(currentMonthStart, now),
    },
  ]

  return { weeklyLoad, monthlyComparison, hasHourlyRate }
}

//------------------------------------------------------------------------------------------------
async function getTraineeStatistics(traineeId: string) {
  const now = new Date()
  const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 })
  const currentWeekEnd = endOfWeek(now, { weekStartsOn: 1 })
  const previousWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })
  const previousWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })

  const currentMonthStart = startOfMonth(now)
  const previousMonthStart = startOfMonth(subMonths(now, 1))
  const previousMonthEnd = endOfMonth(subMonths(now, 1))

  const trainings = await prisma.training.findMany({
    where: {
      trainee_id: traineeId,
      scheduled_at: { gte: previousMonthStart, lte: now },
    },
    select: { scheduled_at: true, duration: true },
  })

  const completedHoursInRange = (rangeStart: Date, rangeEnd: Date) =>
    trainings
      .filter(
        (t) =>
          isTrainingCompleted(t.scheduled_at) &&
          t.scheduled_at >= rangeStart &&
          t.scheduled_at <= rangeEnd
      )
      .reduce((sum, t) => sum + Number(t.duration), 0)

  const currentWeekHours = completedHoursInRange(
    currentWeekStart,
    currentWeekEnd
  )
  const previousWeekHours = completedHoursInRange(
    previousWeekStart,
    previousWeekEnd
  )

  const weeklyHours = [
    { period: "Ten tydzień", h: Math.round(currentWeekHours * 10) / 10 },
    { period: "Zeszły tydz.", h: Math.round(previousWeekHours * 10) / 10 },
  ]

  const countCompletedInMonth = (monthStart: Date, monthEnd: Date) =>
    trainings.filter(
      (t) =>
        isTrainingCompleted(t.scheduled_at) &&
        t.scheduled_at >= monthStart &&
        t.scheduled_at <= monthEnd
    ).length

  const monthlyWorkouts = [
    {
      period: "Ten miesiąc",
      trainings: countCompletedInMonth(currentMonthStart, now),
    },
    {
      period: "Zeszły mies.",
      trainings: countCompletedInMonth(previousMonthStart, previousMonthEnd),
    },
  ]

  return { weeklyHours, monthlyWorkouts }
}
