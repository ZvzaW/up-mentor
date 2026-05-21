import {
  addDays,
  addWeeks,
  endOfWeek,
  format,
  isToday,
  startOfDay,
  startOfWeek,
  subWeeks,
} from "date-fns"
import { pl } from "date-fns/locale"
import { toDateInputValue, toTimeInputValue } from "@/lib/utils"

export const CALENDAR_START_HOUR = 0
export const CALENDAR_END_HOUR = 24
export const HOUR_SLOT_HEIGHT = 65
export const CALENDAR_GRID_HEIGHT =
  (CALENDAR_END_HOUR - CALENDAR_START_HOUR) * HOUR_SLOT_HEIGHT

export type TrainingSlot = { date: string; start_time: string }

export function getWeekRange(anchor: Date) {
  const start = startOfWeek(anchor, { weekStartsOn: 1 })
  const end = endOfWeek(anchor, { weekStartsOn: 1 })
  return { start, end }
}

export function getWeekDays(anchor: Date) {
  const { start } = getWeekRange(anchor)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export function formatWeekRangeLabel(anchor: Date) {
  const { start, end } = getWeekRange(anchor)
  const sameMonth = start.getMonth() === end.getMonth()
  if (sameMonth) {
    return `${format(start, "d", { locale: pl })}–${format(end, "d MMMM yyyy", { locale: pl })}`
  }
  return `${format(start, "d MMM", { locale: pl })} – ${format(end, "d MMM yyyy", { locale: pl })}`
}

export function formatDayHeader(date: Date) {
  return {
    dayNumber: format(date, "d"),
    weekday: format(date, "EEEE", { locale: pl }),
    isToday: isToday(date),
  }
}

export function navigateWeek(anchor: Date, direction: "prev" | "next" | "today") {
  if (direction === "today") return startOfDay(new Date())
  return direction === "prev" ? subWeeks(anchor, 1) : addWeeks(anchor, 1)
}

function timeToMinutes(time: string) {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

function minutesToTime(totalMinutes: number) {
  const minutesInDay = ((totalMinutes % 1440) + 1440) % 1440
  const h = Math.floor(minutesInDay / 60)
  const m = minutesInDay % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

const MINUTES_PER_DAY = 24 * 60

function getTrainingEndInfo(startsAt: Date, durationHours: number) {
  const startTime = toTimeInputValue(startsAt)
  const totalEndMinutes = timeToMinutes(startTime) + durationHours * 60
  const dayOffset = Math.floor(totalEndMinutes / MINUTES_PER_DAY)
  const endTime = minutesToTime(totalEndMinutes)
  const endDate = addDays(startOfDay(startsAt), dayOffset)

  return { endTime, dayOffset, endDate, startDate: startsAt, startTime }
}

export function formatTrainingTimeRange(
  startsAt: Date,
  durationHours: number,
  style: "compact" | "full" = "compact"
) {
  const { endTime, dayOffset, endDate, startDate, startTime } = getTrainingEndInfo(
    startsAt,
    durationHours
  )

  if (style === "compact") {
    if (dayOffset === 0) return `${startTime} - ${endTime}`
    const dayWord = dayOffset === 1 ? "dzień" : "dni"
    return `${startTime} - ${endTime} (+${dayOffset} ${dayWord})`
  }

  const startLabel = format(startDate, "EEE, d.MM.yyyy", { locale: pl })
  if (dayOffset === 0) {
    return `${startLabel} ${startTime} - ${endTime}`
  }
  const endLabel = format(endDate, "EEE, d.MM.yyyy", { locale: pl })
  return `${startLabel} ${startTime} - ${endLabel} ${endTime}`
}

export function getTrainingPosition(startsAt: Date, durationHours: number) {
  const startMinutes = startsAt.getHours() * 60 + startsAt.getMinutes()
  const gridStartMinutes = CALENDAR_START_HOUR * 60
  const topPx =
    ((startMinutes - gridStartMinutes) / 60) * HOUR_SLOT_HEIGHT
  const heightPx = durationHours * HOUR_SLOT_HEIGHT
  const top = Math.max(0, topPx)
  const maxHeight = CALENDAR_GRID_HEIGHT - top

  return {
    top,
    height: Math.min(maxHeight, heightPx),
  }
}

export function getDefaultCreateSlot(): TrainingSlot {
  const now = new Date()
  const minutes = now.getHours() * 60 + now.getMinutes()
  const nextFullHourMinutes = Math.min(23 * 60, Math.ceil(minutes / 60) * 60)

  return {
    date: toDateInputValue(now),
    start_time: minutesToTime(nextFullHourMinutes),
  }
}

export function slotFromClick(
  day: Date,
  offsetY: number,
  containerHeight: number
): TrainingSlot {
  const gridStart = CALENDAR_START_HOUR * 60
  const gridEnd = CALENDAR_END_HOUR * 60
  const gridSpan = gridEnd - gridStart
  const ratio = Math.min(1, Math.max(0, offsetY / containerHeight))
  const minutes =
    gridStart + Math.round((ratio * gridSpan) / 30) * 30
  const clamped = Math.min(gridEnd - 30, Math.max(gridStart, minutes))

  return {
    date: toDateInputValue(day),
    start_time: minutesToTime(clamped),
  }
}

export function formatTrainingDateTime(startsAt: Date, durationHours: number) {
  return formatTrainingTimeRange(startsAt, durationHours, "full")
}
