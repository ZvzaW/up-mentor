import {  getExercises } from "@/actions/exercise"
import { auth } from "@/auth"
import { AddExerciseDialog } from "@/components/dialogs/trainer/add-exercise"
import { ExerciseList } from "@/components/pages/exercises/exercise-list"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"

export default async function ExercisesPage() {
  const session = await auth()
  const role = session?.user?.role ?? ""

  const result = await getExercises()
  const exercises = result.data ?? []

  return (
    <div className="space-y-6 p-3">
      <div className=" flex flex-col sm:flex-row sm:justify-between ">

        <h1 className="md:ml-1 font-michroma text-2xl text-center sm:text-left">
          Katalog ćwiczeń
        </h1>
      

        {role==="trainer" && <AddExerciseDialog />}
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
        <ExerciseList exercises={exercises} role={role} />
      )}
    </div>
  )
}
