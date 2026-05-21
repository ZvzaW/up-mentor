import { redirect } from "next/navigation"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Clock3,
  MapPin,
  NotebookPen,
  ChevronLeft,
  Trophy,
} from "lucide-react"
import { getMyTraineeBySlug } from "@/actions/my-trainees"
import { TraineeQuickActions } from "@/components/pages/my-trainees/trainee-quick-actions"
import { TraineeNoteEditor } from "@/components/pages/my-trainees/trainee-note-editor"
import { ShowTraineeSurveyDialog } from "@/components/dialogs/trainer/show-trainee-survey"

type TraineeDetailsPageProps = {
  params: Promise<{
    slug: string
  }>
}

//TO-DO: Replace with actual trainings data from database
const mockTrainings = [
  {
    id: "training-1",
    date: "2026-05-06",
    startTime: "17:30",
    duration: "1.5 h",
  },
  {
    id: "training-2",
    date: "2026-05-08",
    startTime: "18:00",
    duration: "1.0 h",
  },
  {
    id: "training-3",
    date: "2026-05-11",
    startTime: "17:00",
    duration: "1.5 h",
  },
]

export default async function TraineeDetailsPage({
  params,
}: TraineeDetailsPageProps) {
  const { slug } = await params
  const result = await getMyTraineeBySlug(slug)

  const cooperation = result.data

  if (!result.error && !cooperation) {
    redirect("/dashboard/trainees")
  }

  const selectedTrainee = cooperation
    ? {
        id: cooperation.trainee.user.id,
        fullName: `${cooperation.trainee.user.name} ${cooperation.trainee.user.surname}`,
        phone: cooperation.trainee.user.phone,
        workplace: `${cooperation.workplace.name} - ul. ${cooperation.workplace.street} ${cooperation.workplace.building_number}${cooperation.workplace.flat_number ? `/${cooperation.workplace.flat_number}` : ""}, ${cooperation.workplace.city}`,
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

                <div className="flex max-w-full items-center gap-2 text-sm text-zinc-300">
                  <MapPin className="text-baby-blue h-4 w-4 shrink-0" />
                  <span className="truncate">{selectedTrainee.workplace}</span>
                </div>

                
                  <ShowTraineeSurveyDialog traineeId={selectedTrainee.id} name={selectedTrainee.fullName}/>
                  


                <div className="mt-2 w-[90%] md:w-full">
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
              <CardContent className="space-y-4">
                {mockTrainings.map((training) => (
                  <div
                    key={training.id}
                    className="bg-dirty-blue/40 space-y-2 rounded-lg border border-zinc-700/70 p-4"
                  >
                    <div className="flex items-center gap-2 text-sm text-zinc-300">
                      <Clock3 className="text-baby-blue h-4 w-4" />
                      <span>
                        {training.date} o {training.startTime} (
                        {training.duration})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <MapPin className="text-baby-blue h-4 w-4" />
                      <span>{selectedTrainee.workplace}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
