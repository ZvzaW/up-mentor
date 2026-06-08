"use client"

import * as React from "react"
import { addDays, format, isSameDay } from "date-fns"
import { pl } from "date-fns/locale"
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
} from "lucide-react"

import type { TrainingDTO } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  CALENDAR_END_HOUR,
  CALENDAR_GRID_HEIGHT,
  CALENDAR_START_HOUR,
  formatDayHeader,
  formatWeekRangeLabel,
  getTrainingPosition,
  getWeekDays,
  HOUR_SLOT_HEIGHT,
  formatTrainingTimeRange,
  navigateWeek,
  slotFromClick,
  type TrainingSlot,
} from "@/lib/training-calendar-functions"
import { cn, parseTrainingDateTime } from "@/lib/utils"

type TrainingsCalendarProps = {
  weekAnchor: Date
  onWeekChange: (date: Date) => void
  trainings: TrainingDTO[]
  fetchError?: string | null
  isLoadingTrainings?: boolean
  isTrainer: boolean
  mobileDayIndex: number
  onSlotClick: (slot: TrainingSlot) => void
  onTrainingClick: (training: TrainingDTO) => void
  onNewClick: () => void
}

const HOURS = Array.from(
  { length: CALENDAR_END_HOUR - CALENDAR_START_HOUR },
  (_, i) => CALENDAR_START_HOUR + i
)

export default function TrainingsCalendar({
  weekAnchor,
  onWeekChange,
  trainings,
  fetchError,
  isLoadingTrainings = false,
  isTrainer,
  mobileDayIndex,
  onSlotClick,
  onTrainingClick,
  onNewClick,
}: TrainingsCalendarProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const weekDays = getWeekDays(weekAnchor)
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const gridSpanMinutes = (CALENDAR_END_HOUR - CALENDAR_START_HOUR) * 60

  const showNowLine = weekDays.some((d) => isSameDay(d, now))
  const nowLineTop = showNowLine
    ? ((currentMinutes - CALENDAR_START_HOUR * 60) / gridSpanMinutes) * 100
    : 0

  const mobileDay = weekDays[mobileDayIndex] ?? weekDays[0]

  React.useEffect(() => {
    const element = scrollRef.current
    if (!element) return
    const today = new Date()
    const days = getWeekDays(weekAnchor)
    if (!days.some((day) => isSameDay(day, today))) return
    const hourOffset = Math.max(0, today.getHours() - 2)
    element.scrollTop = hourOffset * HOUR_SLOT_HEIGHT
  }, [weekAnchor])

  const trainingsForDay = (day: Date) =>
    trainings.filter((training) =>
      isSameDay(day, parseTrainingDateTime(training.scheduledAt))
    )

  const handleGridClick = (
    day: Date,
    mouseEvent: React.MouseEvent<HTMLDivElement>
  ) => {
    if (!isTrainer) return
    const rect = mouseEvent.currentTarget.getBoundingClientRect()
    const offsetY = mouseEvent.clientY - rect.top
    const slot = slotFromClick(day, offsetY, rect.height)
    onSlotClick(slot)
  }

  const renderDayHeader = (day: Date) => {
    const { dayNumber, weekday, isToday: today } = formatDayHeader(day)
    return (
      <div
        key={`header-${day.toISOString()}`}
        className={cn(
          "flex min-w-0 flex-1 flex-col justify-center py-2 text-center"
        )}
      >
        <div
          className={cn(
            "text-[10px] uppercase",
            today ? "text-baby-blue font-bold" : "text-zinc-400"
          )}
        >
          {weekday}
        </div>
        <div
          className={cn(
            "text-sm",
            today ? "text-baby-blue font-bold" : "text-zinc-400"
          )}
        >
          {dayNumber}
        </div>
      </div>
    )
  }

  const renderDayGrid = (day: Date) => {
    const dayTrainings = trainingsForDay(day)

    return (
      <div
        key={`grid-${day.toISOString()}`}
        className="border-baby-blue relative flex-1 cursor-pointer border-l first:border-l-0"
        style={{ height: CALENDAR_GRID_HEIGHT }}
        onClick={(mouseEvent) => handleGridClick(day, mouseEvent)}
      >
        {HOURS.map((hour, i) => (
          <div
            key={hour}
            className="border-baby-blue/20 pointer-events-none absolute right-0 left-0 border-t"
            style={{ top: i * HOUR_SLOT_HEIGHT }}
          />
        ))}

        {showNowLine && isSameDay(day, now) && (
          <div
            className="pointer-events-none absolute right-0 left-0 z-20 flex items-center"
            style={{ top: `${nowLineTop}%` }}
          >
            <div className="bg-gold size-2 shrink-0 rounded-full" />
            <div className="border-gold h-0 flex-1 border border-dashed" />
          </div>
        )}

        {dayTrainings.map((training) => {
          const startsAt = parseTrainingDateTime(training.scheduledAt)
          const position = getTrainingPosition(startsAt, training.duration)
          const timeRange = formatTrainingTimeRange(startsAt, training.duration)
          {
            /* TRENING / */
          }
          return (
            <button
              key={training.id}
              type="button"
              className="bg-baby-blue/85 hover:bg-baby-blue border-dirty-navy text-dark-navy absolute right-0.5 left-0.5 z-10 flex flex-col overflow-hidden rounded border p-1 text-left transition-colors"
              style={{
                top: position.top,
                height: position.height,
              }}
              onClick={(mouseEvent) => {
                mouseEvent.stopPropagation()
                onTrainingClick(training)
              }}
            >
              <span className="text-[11px] font-bold break-words text-zinc-800">
                {isTrainer ? training.traineeName : training.trainerName}
              </span>

              <span className="text-[10px] break-words opacity-80">
                · {training.workplaceAddress.split("-")[0]}
              </span>
              <span className="mt-auto truncate text-[10px] opacity-80">
                {timeRange}
              </span>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 lg:flex-row">
      <aside className="mx-auto mt-0 flex w-fit flex-col sm:mt-12">
        <Calendar
          mode="single"
          selected={weekAnchor}
          onSelect={(d) => d && onWeekChange(d)}
          locale={pl}
          className="border-gold bg-dirty-navy/40 rounded-xl border"
        />
        <p className="mt-2 text-center text-xs text-zinc-400">
          Kliknij dzień, aby przejść do danego tygodnia.
        </p>
      </aside>

      <div className="min-h-0 min-w-0 flex-1">
        <div className="mb-2 flex flex-col items-center justify-between sm:flex-row">
          <div className="hidden flex-row items-center gap-1 sm:flex">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onWeekChange(navigateWeek(weekAnchor, "prev"))}
              aria-label="Poprzedni tydzień"
            >
              <ChevronLeft />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onWeekChange(navigateWeek(weekAnchor, "next"))}
              aria-label="Następny tydzień"
            >
              <ChevronRight />
            </Button>

            <span className="font-michroma text-sm text-zinc-200 sm:text-base">
              {formatWeekRangeLabel(weekAnchor)}
            </span>
          </div>

          <div className="mt-2 mb-4 flex items-center gap-4 sm:my-0">
            <Button
              type="button"
              className="bg-gold hover:bg-gold/60"
              onClick={() => onWeekChange(navigateWeek(weekAnchor, "today"))}
            >
              Pokaż dzisiaj
            </Button>
            {isTrainer && (
              <Button type="button" className="" onClick={onNewClick}>
                <Plus />
                Dodaj trening
              </Button>
            )}
          </div>
        </div>

        <div className="mb-3 flex items-center justify-between gap-2 md:hidden">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onWeekChange(addDays(mobileDay, -1))}
            aria-label="Poprzedni dzień"
          >
            <ChevronLeft />
          </Button>
          <span className="text-sm text-zinc-200 capitalize">
            {format(mobileDay, "EEEE, d MMMM", { locale: pl })}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onWeekChange(addDays(mobileDay, 1))}
            aria-label="Następny dzień"
          >
            <ChevronRight />
          </Button>
        </div>

        <div className="border-baby-blue bg-dirty-navy/60 relative min-h-0 overflow-hidden rounded-md border">
          {isLoadingTrainings && (
            <div
              className="bg-dark-navy/70 absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 backdrop-blur-[1px]"
              aria-busy="true"
              aria-live="polite"
            >
              <Loader2 className="text-gold size-8 animate-spin" />
              <span className="text-sm text-zinc-300">Ładowanie treningów…</span>
            </div>
          )}

          {fetchError && !isLoadingTrainings && (
            <div
              className="bg-dark-navy/70 absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 px-6 text-center backdrop-blur-[1px]"
              role="alert"
              aria-live="assertive"
            >
              <AlertCircle className="text-destructive size-8" />
              <span className="text-sm text-destructive">{fetchError}</span>
            </div>
          )}

          {/*NAGŁOWEK - DNI*/}
          <div
            className="border-baby-blue bg-dark-navy/95 flex border-b pr-5 sm:pr-2"
            style={{ height: "50px" }}
          >
            <div className="w-10 shrink-0" />
            <div className="hidden min-w-0 flex-1 md:flex">
              {weekDays.map((day) => renderDayHeader(day))}
            </div>
            <div className="flex min-w-0 flex-1 md:hidden">
              {renderDayHeader(mobileDay)}
            </div>
          </div>

          {/*SIATKA GODZIN*/}
          <div
            ref={scrollRef}
            className="custom-scrollbar max-h-[450px] min-h-0 overflow-x-hidden overflow-y-auto pt-4 pb-1 sm:max-h-[60vh]"
          >
            <div className="flex">
              <div
                className="relative w-10 shrink-0"
                style={{ height: CALENDAR_GRID_HEIGHT }}
              >
                {HOURS.map((hour, i) => (
                  <div
                    key={hour}
                    className="absolute right-0 left-0 mr-2 text-[10px] text-zinc-400"
                    style={{
                      top: i * HOUR_SLOT_HEIGHT,
                      height: HOUR_SLOT_HEIGHT,
                    }}
                  >
                    <span className="absolute -top-2 right-1">{hour}</span>
                  </div>
                ))}
              </div>

              <div className="hidden min-w-0 flex-1 md:flex">
                {weekDays.map((day) => renderDayGrid(day))}
              </div>

              <div className="flex min-w-0 flex-1 md:hidden">
                {renderDayGrid(mobileDay)}
              </div>
            </div>
          </div>
        </div>

        {!isTrainer && (
          <p className="mt-2 text-center text-xs text-zinc-400 lg:text-left">
            Kliknij trening, aby zobaczyć szczegóły.
          </p>
        )}
        {isTrainer && (
          <p className="mt-2 text-center text-xs text-zinc-400 lg:text-left">
            Kliknij pusty slot lub „Dodaj trening”, aby zaplanować zajęcia.
          </p>
        )}
      </div>
    </div>
  )
}
