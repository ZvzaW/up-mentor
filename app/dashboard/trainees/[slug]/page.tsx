import { redirect } from "next/navigation";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, Clock3, MapPin, NotebookPen, ChevronLeft, Trophy } from "lucide-react";
import { getMyTraineeBySlug } from "@/actions/my-trainees";
import { TraineeQuickActions } from "@/components/pages/my-trainees/trainee-quick-actions";
import { TraineeNoteEditor } from "@/components/pages/my-trainees/trainee-note-editor";


type TraineeDetailsPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

//TO-DO: Replace with actual trainings data from database
const mockTrainings = [
  {
    id: "training-1",
    date: "2026-05-06",
    startTime: "17:30",
    duration: "1.5 h",
    workplace: "Fit Zone, ul. Lipowa 12, Gdańsk",
    sectionName: "Push day",
  },
  {
    id: "training-2",
    date: "2026-05-08",
    startTime: "18:00",
    duration: "1.0 h",
    workplace: "Fit Zone, ul. Lipowa 12, Gdańsk",
    sectionName: "Pull day",
  },
  {
    id: "training-3",
    date: "2026-05-11",
    startTime: "17:00",
    duration: "1.5 h",
    workplace: "Fit Zone, ul. Lipowa 12, Gdańsk",
    sectionName: "Legs + core",
  },
];

export default async function TraineeDetailsPage({ params }: TraineeDetailsPageProps) {
  const { slug } = await params;
  const result = await getMyTraineeBySlug(slug)

  const cooperation = result.data;

  if (!result.error && !cooperation) {
    redirect("/dashboard/trainees");
  }

  const selectedTrainee = cooperation
    ? {
        id: cooperation.trainee.user.id,
        fullName: `${cooperation.trainee.user.name} ${cooperation.trainee.user.surname}`,
        phone: cooperation.trainee.user.phone,
        workplace: `${cooperation.workplace.name} - ul. ${cooperation.workplace.street} ${cooperation.workplace.building_number}${cooperation.workplace.flat_number ? `/${cooperation.workplace.flat_number}` : ""}, ${cooperation.workplace.city}`,
      }
    : null;

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
              <button className="bg-dirty-blue rounded-2xl p-3 pr-4 flex items-center text-sm gap-2 hover:bg-hover mb-5">
                <ChevronLeft size={14} />
                <Link href="/dashboard/trainees">Wróć do listy podopiecznych</Link>
              </button>
            </div>
          

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <Card>
              <CardContent className="flex flex-col items-center text-center gap-6">
                <CardTitle className="max-w-full text-gold font-michroma text-lg overflow-x-auto custom-scrollbar">
                  {selectedTrainee.fullName}
                </CardTitle>

                <TraineeQuickActions
                  traineeId={selectedTrainee.id}
                  phone={selectedTrainee.phone}
                />

                <div className="flex items-center gap-2 text-sm text-zinc-300 max-w-full">
                  <MapPin className="text-baby-blue w-4 h-4 shrink-0" />
                  <span className="truncate">{selectedTrainee.workplace}</span>
                </div>

               {/*TO-DO: Replace with actual working Dialogs */}
                <div className="md:flex flex-col md:flex-row w-[90%] md:w-full max-w-sm overflow-hidden rounded-2xl border border-baby-blue/80 divide-y divide-baby-blue md:divide-y-0 md:divide-x">
                  <Button
                    variant="secondary"
                    type="button"
                    className="flex-1 rounded-none h-11 w-full"
                  >
                    <ClipboardList />
                    Ankieta startowa
                  </Button>
                  <Button
                    variant="secondary"
                    type="button"
                    className=" flex-1 rounded-none  h-11 w-full"
                  >
                    <Trophy />
                    Rekordy osobiste
                  </Button>
                </div>

                <div className="mt-2 w-[90%] md:w-full">
                  <p className="text-sm text-zinc-300 mb-2 flex items-center gap-2">
                    <NotebookPen className="w-4 h-4 text-baby-blue" />
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
                <CardTitle className="font-michroma text-baby-blue ">
                  Treningi podopiecznego
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockTrainings.map((training) => (
                  <div
                    key={training.id}
                    className="rounded-lg border border-zinc-700/70 bg-dirty-blue/40 p-4 space-y-2"
                  >
                    <p className="text-gold font-semibold">{training.sectionName}</p>
                    <div className="flex items-center gap-2 text-sm text-zinc-300">
                      <Clock3 className="w-4 h-4 text-baby-blue" />
                      <span>
                        {training.date} o {training.startTime} ({training.duration})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <MapPin className="w-4 h-4 text-baby-blue" />
                      <span>{training.workplace}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
