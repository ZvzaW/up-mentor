import { getExercises } from "@/lib/server-get-functions/exercise"
import { auth } from "@/auth"
import { AddExerciseDialog } from "@/components/dialogs/trainer/add-exercise"
import { ExerciseList } from "@/components/pages/exercises/exercise-list"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"

export default async function ExercisesPage() {
  const session = await auth()

  const userId = session?.user?.id ?? ""
  const role = session?.user?.role ?? ""

  const result = await getExercises(userId, role)
  const exercises = result.data ?? []

  return (
    <div className="space-y-6 p-3">
      <div className="flex flex-col sm:flex-row sm:justify-between">
        <h1 className="font-michroma text-center text-2xl sm:text-left md:ml-1">
          Katalog ćwiczeń
        </h1>

        {role === "trainer" && <AddExerciseDialog />}
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

      {!result.error && <ExerciseList exercises={exercises} role={role} />}
    </div>
  )
}
