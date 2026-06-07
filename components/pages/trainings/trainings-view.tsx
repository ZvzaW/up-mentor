"use client"

import * as React from "react"
import { startOfDay, getDay } from "date-fns"
import { getTrainingsForWeek } from "@/actions/training"
import TrainingDialog from "@/components/dialogs/training-dialog"
import TrainingsCalendar from "@/components/pages/trainings/trainings-calendar"
import {
  getDefaultCreateSlot,
  isTrainingScheduledInPast,
  type TrainingSlot,
} from "@/lib/training-calendar-functions"
import { TraineeDTO, TrainingDTO } from "@/lib/types"

type TrainingsViewProps = {
  role: "trainer" | "trainee" | string
  initialTrainings: TrainingDTO[]
  initialWeekAnchor: string
  initialFetchError?: string | null
  trainees: TraineeDTO[] | null
}

type DialogState = {
  open: boolean
  mode: "create" | "edit" | "view"
  training: TrainingDTO | null
  initialSlot: TrainingSlot | null
}

const CLOSED_DIALOG: DialogState = {
  open: false,
  mode: "create",
  training: null,
  initialSlot: null,
}

export default function TrainingsView({
  role,
  initialTrainings,
  initialWeekAnchor,
  initialFetchError = null,
  trainees,
}: TrainingsViewProps) {
  const isTrainer = role === "trainer"
  const [weekAnchor, setWeekAnchor] = React.useState(
    () => new Date(initialWeekAnchor)
  )
  const [trainings, setTrainings] = React.useState(initialTrainings)
  const [fetchError, setFetchError] = React.useState<string | null>(
    initialFetchError
  )

  const [mobileDayIndex, setMobileDayIndex] = React.useState(() => {
    const today = new Date()
    const day = getDay(today)
    return day === 0 ? 6 : day - 1
  })

  const [dialog, setDialog] = React.useState<DialogState>(CLOSED_DIALOG)

  const refreshTrainings = React.useCallback(async (anchor: Date) => {
    const result = await getTrainingsForWeek(anchor.toISOString())

    if (result?.error) {
      setFetchError(result.error)
      return
    }
    setFetchError(null)
    if (result?.data) {
      setTrainings(result.data)
    }
  }, [])

  const handleWeekChange = (date: Date) => {
    setWeekAnchor(startOfDay(date))
    const day = getDay(date)
    setMobileDayIndex(day === 0 ? 6 : day - 1)
    refreshTrainings(date)
  }

  const openCreate = (slot?: TrainingSlot) => {
    setDialog({
      open: true,
      mode: "create",
      training: null,
      initialSlot: slot ?? getDefaultCreateSlot(),
    })
  }

  const openTraining = (training: TrainingDTO) => {
    const isPast = isTrainingScheduledInPast(new Date(training.scheduledAt))
    setDialog({
      open: true,
      mode: isTrainer && !isPast ? "edit" : "view",
      training,
      initialSlot: null,
    })
  }

  const handleSaved = () => {
    void refreshTrainings(weekAnchor)
  }

  return (
    <div className="relative flex flex-col gap-6">
      <TrainingsCalendar
        weekAnchor={weekAnchor}
        onWeekChange={handleWeekChange}
        trainings={trainings}
        fetchError={fetchError}
        isTrainer={isTrainer}
        mobileDayIndex={mobileDayIndex}
        onMobileDayIndexChange={setMobileDayIndex}
        onSlotClick={(slot) => openCreate(slot)}
        onTrainingClick={openTraining}
        onNewClick={() => openCreate()}
      />

      {isTrainer && trainees && (
        <TrainingDialog
          open={dialog.open}
          onOpenChange={(open) => {
            if (!open) setDialog(CLOSED_DIALOG)
          }}
          mode={dialog.mode}
          training={dialog.training}
          initialSlot={dialog.initialSlot}
          trainees={trainees}
          isTrainer={isTrainer}
          onSaved={handleSaved}
        />
      )}

      {!isTrainer && (
        <TrainingDialog
          open={dialog.open}
          onOpenChange={(open) => {
            if (!open) setDialog(CLOSED_DIALOG)
          }}
          mode="view"
          training={dialog.training}
          initialSlot={null}
          trainees={null}
          isTrainer={false}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
