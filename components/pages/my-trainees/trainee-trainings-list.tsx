import { Clock3, MapPin } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import type { TrainingYearGroup } from "@/lib/types"

type TraineeTrainingsListProps = {
  groups: TrainingYearGroup[]
}

export function TraineeTrainingsList({ groups }: TraineeTrainingsListProps) {
  if (groups.length === 0) {
    return (
      <p className="bg-dirty-blue/50 rounded-xl p-4 text-center text-sm text-zinc-400">
        Brak zaplanowanych treningów.
      </p>
    )
  }

  return (
    <div className="custom-scrollbar max-h-[400px] space-y-6 overflow-y-auto pr-2">
      {groups.map((yearGroup) =>
        yearGroup.months.map((monthGroup) => (
          <div
            key={`${yearGroup.year}-${monthGroup.monthLabel}`}
            className="space-y-6"
          >
            <div className="flex items-center gap-4">
              <Separator className="flex-1" />
              <span className="text-gold text-xs font-medium uppercase">{`${monthGroup.monthLabel}, ${yearGroup.year}`}</span>
              <Separator className="flex-1" />
            </div>

            <div className="space-y-3">
              {monthGroup.trainings.map((training) => (
                <div
                  key={training.id}
                  className="bg-dirty-blue space-y-3 rounded-md p-4"
                >
                  <div className="flex items-center gap-2 text-sm text-zinc-300">
                    <Clock3 className="text-baby-blue h-4 w-4 shrink-0" />
                    <span>
                      {training.date} o {training.startTime} (
                      {training.durationLabel})
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-zinc-400">
                    <MapPin className="text-baby-blue h-4 w-4 shrink-0" />
                    <span>{training.workplaceAddress}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
