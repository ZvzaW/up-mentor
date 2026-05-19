import { getExercises } from "@/actions/exercise"
import { getWorkoutPlanById } from "@/actions/workout-plan"
import { WorkoutPlanForm } from "@/components/pages/workout-plans/workout-plan-form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card } from "@/components/ui/card"
import { redirect } from "next/navigation"

type EditWorkoutPlanPageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function EditWorkoutPlanPage({
  params,
}: EditWorkoutPlanPageProps) {

  const { id } = await params
  const [planResult, exercisesResult] = await Promise.all([
    getWorkoutPlanById(id),
    getExercises(),
  ])

  if (!planResult.error && !planResult.data) {
    redirect("/dashboard/workout-plans")
  }

  const exercises = exercisesResult.data ?? []

  return (
    <div className="space-y-6 p-3">
      <div className="flex flex-col sm:flex-row sm:justify-between">
        <h1 className="font-michroma text-center text-2xl sm:text-left md:ml-1">
          Edycja planu treningowego
        </h1>
      </div>

      {(planResult.error || exercisesResult.error) && (
        <Card>
           <Alert variant="destructive" className="mx-auto my-6">
          <AlertDescription >
            {planResult.error ?? exercisesResult.error}
          </AlertDescription>
        </Alert> </Card>
        
      )}

      {planResult.data && !exercisesResult.error && (
        <WorkoutPlanForm exercises={exercises} initialPlan={planResult.data} />
      )}
    </div>
  )
}
