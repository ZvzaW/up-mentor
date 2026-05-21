import { auth } from "@/auth"
import { startOfWeek } from "date-fns"

import { getMyTrainees } from "@/actions/my-trainees"
import TrainingsView from "@/components/pages/trainings/trainings-view"
import { getTrainingsForWeek } from "@/actions/training"

export default async function TrainingsPage() {
  const session = await auth()

  const role = session?.user?.role ?? ""
  const weekAnchor = startOfWeek(new Date(), { weekStartsOn: 1 })

  const [trainingsResult, traineesResult] = await Promise.all([
    getTrainingsForWeek(weekAnchor.toISOString()),
    role === "trainer" ? getMyTrainees() : Promise.resolve(null),
  ])

  const trainings = trainingsResult?.data ?? []
  const trainees = traineesResult?.data ?? []

  return (
    <div>

      <TrainingsView
      role={role}
      initialTrainings={trainings}
      initialWeekAnchor={weekAnchor.toISOString()}
      trainees={trainees}
    />
    </div>
    
  )
}
