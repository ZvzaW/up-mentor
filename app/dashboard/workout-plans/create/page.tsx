import { getExercises } from "@/actions/exercise"
import { WorkoutPlanForm } from "@/components/pages/workout-plans/workout-plan-form"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default async function CreateWorkoutPlanPage() {
  const result = await getExercises()
  const exercises = result.data ?? []

  return (
    <div className="space-y-6 p-3">
      <div className="flex flex-col sm:flex-row sm:justify-between">
        <h1 className="font-michroma text-center text-2xl sm:text-left md:ml-1">
          Kreator planu treningowego
        </h1>
      </div>

      {result.error ? (
        <Alert variant="destructive">
          <AlertDescription>
            Nie udało się załadować słownika ćwiczeń: {result.error}
          </AlertDescription>
        </Alert>
      ) : (
        <WorkoutPlanForm exercises={exercises} />
      )}
    </div>
  )
}
