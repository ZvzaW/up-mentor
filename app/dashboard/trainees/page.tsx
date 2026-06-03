import { Card, CardContent } from "@/components/ui/card"
import TraineesList from "@/components/pages/my-trainees/trainees-list"
import { getMyTrainees } from "@/lib/server-get-functions/my-trainees"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getPendingRequests } from "@/lib/server-get-functions/coaching-request"
import { ManageCoachingRequestsDialog } from "@/components/dialogs/trainer/manage-coaching-request"
import { TraineeDTO } from "@/lib/types"
import { auth } from "@/auth"


export default async function TraineesPage() {
  const session = await auth()

  const userId = session?.user?.id ?? ""

  const [traineesResult, requestsResult] = await Promise.all([
    getMyTrainees(userId),
    getPendingRequests(userId),
  ])

  const trainees = traineesResult.data ?? []
  const pendingRequests = requestsResult.data ?? []

  return (
    <div className="min-h-screen p-3">
      <div className="mb-8 flex flex-col items-center justify-between gap-6 sm:mb-5 sm:flex-row">
        <h1 className="font-michroma text-2xl md:ml-1">
          Podopieczni{" "}
          <span className="text-baby-blue">({trainees.length})</span>
        </h1>
        <ManageCoachingRequestsDialog
          requests={pendingRequests}
          error={requestsResult.error}
        />
      </div>

      <Card>
        <CardContent className="md:px-4">
          {traineesResult.error ? (
            <Alert variant="destructive" className="mx-auto my-12">
              <AlertDescription>{traineesResult.error}</AlertDescription>
            </Alert>
          ) : (
            <TraineesList initialTrainees={trainees as TraineeDTO[]} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
