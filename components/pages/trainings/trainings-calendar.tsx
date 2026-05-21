"use client"

import * as React from "react"
import { format, isSameDay } from "date-fns"
import { pl } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"

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
import { cn } from "@/lib/utils"

type TrainingsCalendarProps = {
  weekAnchor: Date
  onWeekChange: (date: Date) => void
  trainings: TrainingDTO[]
  isTrainer: boolean
  mobileDayIndex: number
  onMobileDayIndexChange: (index: number) => void
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
  isTrainer,
  mobileDayIndex,
  onMobileDayIndexChange,
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
      isSameDay(day, new Date(training.scheduledAt))
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
          "flex min-w-0 flex-1 flex-col justify-center py-2 text-center "
        )}
      >
        <div className={cn("text-[10px] uppercase", today ? "text-baby-blue font-bold" : "text-zinc-400")}>{weekday}</div>
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
        className="relative flex-1 cursor-pointer border-l border-baby-blue first:border-l-0"
        style={{ height: CALENDAR_GRID_HEIGHT }}
        onClick={(mouseEvent) => handleGridClick(day, mouseEvent)}
      >
        {HOURS.map((hour, i) => (
          <div
            key={hour}
            className="pointer-events-none absolute right-0 left-0 border-t border-baby-blue/20"
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
          const startsAt = new Date(training.scheduledAt)
          const position = getTrainingPosition(startsAt, training.duration)
          const timeRange = formatTrainingTimeRange(
            startsAt,
            training.duration
          )
          {/* TRENING / */}
          return (
            <button
              key={training.id}
              type="button"
              className=" flex flex-col bg-baby-blue/85 hover:bg-baby-blue border border-dirty-navy overflow-hidden absolute right-0.5 left-0.5 z-10 rounded p-1 text-left   text-dark-navy  transition-colors "
              style={{
                top: position.top,
                height: position.height,
              }}
              onClick={(mouseEvent) => {
                mouseEvent.stopPropagation()
                onTrainingClick(training)
              }}
            >
              <span className="text-[11px] break-words font-bold text-zinc-800">
                {isTrainer ? training.traineeName : training.trainerName}
              </span>

              <span className="text-[10px] break-words opacity-80">· {training.workplaceAddress.split("-")[0]}</span>
              <span className=" truncate opacity-80 mt-auto text-[10px]">
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
      <aside className="mx-auto flex w-fit  flex-col  mt-0 sm:mt-12">
        <Calendar
          mode="single"
          selected={weekAnchor}
          onSelect={(d) => d && onWeekChange(d)}
          locale={pl}
          className="rounded-xl border border-gold bg-dirty-navy/40 "
        />
        <p className="text-center text-xs text-zinc-400 mt-2">
          Kliknij dzień, aby przejść do danego tygodnia.
        </p>
      </aside>

      <div className="min-w-0 flex-1 min-h-0">
        <div className="mb-2 flex flex-col sm:flex-row items-center justify-between">
          <div className="sm:flex flex-row items-center gap-1 hidden">
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

          <div className="flex items-center gap-4 mt-2 mb-4 sm:my-0">
            <Button
              type="button"
              className="bg-gold hover:bg-gold/60"
              onClick={() => onWeekChange(navigateWeek(weekAnchor, "today"))}
            >
              Pokaż dzisiaj
            </Button>
          {isTrainer && (
            <Button type="button" className="" onClick={onNewClick}>
              <Plus  />
              Dodaj trening
            </Button>
          )}</div>
        </div>

        <div className="mb-3 flex items-center justify-between gap-2 md:hidden">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={mobileDayIndex <= 0}
            onClick={() => onMobileDayIndexChange(mobileDayIndex - 1)}
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
            disabled={mobileDayIndex >= 6}
            onClick={() => onMobileDayIndexChange(mobileDayIndex + 1)}
          >
            <ChevronRight />
          </Button>
        </div>

        <div className="overflow-hidden rounded-md border border-baby-blue bg-dirty-navy/60 min-h-0">
          {/*NAGŁOWEK - DNI*/}
          <div
            className="flex border-b border-baby-blue bg-dark-navy/95 pr-5 sm:pr-2"
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
            className="sm:max-h-[60vh] min-h-0 max-h-[450px] overflow-x-hidden overflow-y-auto custom-scrollbar pt-4 pb-1"
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
                    <span className="absolute -top-2 right-1">
                      {hour}
                    </span>
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
            Kliknij pusty slot lub "Dodaj trening”, aby zaplanować zajęcia.
          </p>
        )}
      </div>
    </div>
  )
}
