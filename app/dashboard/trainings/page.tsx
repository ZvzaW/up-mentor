import { auth } from "@/auth"
import { startOfWeek } from "date-fns"

import { getMyTrainees } from "@/lib/server-get-functions/my-trainees"
import TrainingsView from "@/components/pages/trainings/trainings-view"
import { getTrainingsForWeek } from "@/actions/training"
import { toDateInputValue } from "@/lib/utils"
import { user_role } from "@prisma/client"
import { redirect } from "next/navigation"

export default async function TrainingsPage() {
  const session = await auth()
  if (!session?.user?.id || !session.user.role) {
    redirect("/?unauthorized=true")
  }
  const userId = session.user.id
  const role = session.user.role
  const weekAnchor = startOfWeek(new Date(), { weekStartsOn: 1 })

  const weekAnchorDate = toDateInputValue(weekAnchor)

  const [trainingsResult, traineesResult] = await Promise.all([
    getTrainingsForWeek(weekAnchorDate),
    role === user_role.trainer ? getMyTrainees(userId) : Promise.resolve(null),
  ])

  const trainings = trainingsResult?.data ?? []
  const trainees = traineesResult?.data ?? []
  const initialFetchError = trainingsResult?.error ?? null

  return (
    <div className="md:h-[calc(100dvh-100px)]">
      <TrainingsView
        role={role}
        initialTrainings={trainings}
        initialWeekAnchor={weekAnchorDate}
        initialFetchError={initialFetchError}
        trainees={trainees}
      />
    </div>
  )
}
