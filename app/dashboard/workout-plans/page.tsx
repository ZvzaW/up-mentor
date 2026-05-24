import { getWorkoutPlans } from "@/actions/workout-plan"
import { auth } from "@/auth"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { WorkoutPlanList } from "@/components/pages/workout-plans/workout-plan-list"
import { getMyTrainees } from "@/actions/my-trainees"
import { Plus } from "lucide-react"
import { TraineeDTO } from "@/lib/types"

export default async function WorkoutPlansPage() {
  const session = await auth()
  const role = session?.user?.role ?? ""

  const result = await getWorkoutPlans()
  const plans = result.data ?? []

  let trainees: TraineeDTO[] = []
  if (role === "trainer") {
    const traineesResult = await getMyTrainees()
    trainees = traineesResult.data ?? []
  }

  return (
    <div className="space-y-6 p-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-michroma text-center text-2xl sm:text-left md:ml-1">
          Plany treningowe
        </h1>

        {role === "trainer" && (
          <Button asChild className="mx-auto mt-6 w-fit sm:mx-0 sm:mt-0">
            <Link href="/dashboard/workout-plans/create">
              <Plus />
              Stwórz nowy plan
            </Link>
          </Button>
        )}
      </div>

      {result.error && (
        <Card>
          <CardContent className="mx-auto p-6">
            <Alert variant="destructive">
              <AlertDescription>{result.error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {!result.error && (
        <WorkoutPlanList plans={plans} role={role} trainees={trainees} />
      )}
    </div>
  )
}
