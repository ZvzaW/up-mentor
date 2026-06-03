import { getExercises } from "@/lib/server-get-functions/exercise"
import { WorkoutPlanForm } from "@/components/pages/workout-plans/workout-plan-form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { auth } from "@/auth"

export default async function CreateWorkoutPlanPage() {
  const session = await auth()

  const userId = session?.user?.id ?? ""
  const role = session?.user?.role ?? ""

  const result = await getExercises(userId, role)
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
