import { redirect } from "next/navigation"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, NotebookPen, ChevronLeft } from "lucide-react"
import { getMyTraineeBySlug } from "@/lib/server-get-functions/my-trainees"
import { getTrainingsForTrainee } from "@/lib/server-get-functions/training"
import { TraineeQuickActions } from "@/components/pages/my-trainees/trainee-quick-actions"
import { TraineeNoteEditor } from "@/components/pages/my-trainees/trainee-note-editor"
import { TraineeTrainingsList } from "@/components/pages/my-trainees/trainee-trainings-list"
import { ShowTraineeSurveyDialog } from "@/components/dialogs/trainer/show-trainee-survey"
import { WorkplaceAddress } from "@/lib/types"
import { formatWorkplaceAddress } from "@/lib/utils"
import { auth } from "@/auth"

type TraineeDetailsPageProps = {
  params: Promise<{
    slug: string
  }>
}

export default async function TraineeDetailsPage({
  params,
}: TraineeDetailsPageProps) {
  const session = await auth()

  const userId = session?.user?.id ?? ""

  const { slug } = await params
  const result = await getMyTraineeBySlug(userId, slug)

  const cooperation = result.data
  const traineeId = cooperation?.trainee.user.id

  const trainingsResult = traineeId
    ? await getTrainingsForTrainee(userId, traineeId)
    : null

  const trainingsError = trainingsResult?.error
  const trainingGroups = trainingsResult?.data ?? []

  if (!result.error && !cooperation) {
    redirect("/dashboard/trainees")
  }

  const selectedTrainee = cooperation
    ? {
        id: cooperation.trainee.user.id,
        fullName: `${cooperation.trainee.user.name} ${cooperation.trainee.user.surname}`,
        phone: cooperation.trainee.user.phone,
        birthdate: cooperation.trainee.birthdate,
        workplace: formatWorkplaceAddress(
          cooperation.workplace as WorkplaceAddress
        ),
      }
    : null

  return (
    <div className="p-3">
      {result.error && (
        <Card>
          <CardContent>
            <Alert variant="destructive" className="mx-auto my-12">
              <AlertDescription>{result.error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {!result.error && selectedTrainee && (
        <div className="space-y-4">
          <div className="flex justify-center">
            <button className="bg-dirty-blue hover:bg-hover mb-5 flex items-center gap-2 rounded-2xl p-3 pr-4 text-sm">
              <ChevronLeft size={14} />
              <Link href="/dashboard/trainees">
                Wróć do listy podopiecznych
              </Link>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
            <Card>
              <CardContent className="flex flex-col items-center gap-6 text-center">
                <CardTitle className="text-gold font-michroma custom-scrollbar max-w-full overflow-x-auto text-lg">
                  {selectedTrainee.fullName}
                </CardTitle>

                <TraineeQuickActions
                  traineeId={selectedTrainee.id}
                  phone={selectedTrainee.phone}
                />

                <ShowTraineeSurveyDialog
                  traineeId={selectedTrainee.id}
                  name={selectedTrainee.fullName}
                  birthdate={selectedTrainee.birthdate}
                />

                <div className="flex max-w-full items-center gap-2 text-sm text-zinc-300">
                  <MapPin className="text-baby-blue h-4 w-4 shrink-0" />
                  <span className="truncate">{selectedTrainee.workplace}</span>
                </div>

                <div className="w-[90%] md:w-full">
                  <p className="mb-2 flex items-center gap-2 text-sm text-zinc-300">
                    <NotebookPen className="text-baby-blue h-4 w-4" />
                    Prywatna notatka
                  </p>
                  <TraineeNoteEditor
                    traineeId={selectedTrainee.id}
                    initialNote={cooperation?.trainer_note ?? ""}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-michroma text-baby-blue">
                  Treningi podopiecznego
                </CardTitle>
              </CardHeader>
              <CardContent>
                {trainingsError ? (
                  <Alert variant="destructive" className="mx-auto">
                    <AlertDescription>{trainingsError}</AlertDescription>
                  </Alert>
                ) : (
                  <TraineeTrainingsList groups={trainingGroups} />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
