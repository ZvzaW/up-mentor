import { getWorkoutPlans } from "@/actions/workout-plan"
import { auth } from "@/auth"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { WorkoutPlanList } from "@/components/pages/workout-plans/workout-plan-list" 

export default async function WorkoutPlansPage() {
  const session = await auth()
  const role = session?.user?.role ?? ""

  const result = await getWorkoutPlans()
  const plans = result.data ?? []

  return (
    <div className="space-y-6 p-3">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
        <h1 className="md:ml-1 font-michroma text-2xl text-center sm:text-left">
          Plany treningowe
        </h1>
      
        {role === "trainer" && (
          <Button asChild className="mt-4 sm:mt-0">
            <Link href="/dashboard/workout-plans/create">
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
        <WorkoutPlanList plans={plans} role={role} />
      )}
    </div>
  )
}