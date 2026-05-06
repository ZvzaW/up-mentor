import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getMyTrainerBySlug, getMyTrainersCount } from "@/actions/my-trainers";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Banknote, BookOpen, ChevronLeft, MapPin } from "lucide-react";
import { TrainerQuickActions } from "@/components/pages/my-trainers/trainer-quick-actions";
import { OpinionDialog } from "@/components/dialogs/trainee/opinion-dialog";
import { TrainerOpinionsList } from "@/components/pages/trainer-opinions-list";

type TrainerDetailsPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function TrainerDetailsPage({ params }: TrainerDetailsPageProps) {
  const session = await auth();

  if (session?.user?.role !== "trainee") {
    redirect("/dashboard");
  }

  const { slug } = await params;
  const [trainerResult, trainersCountResult] = await Promise.all([
    getMyTrainerBySlug(slug),
    getMyTrainersCount(),
  ]);

  const pageError = trainerResult.error ?? trainersCountResult.error;
  const cooperation = trainerResult.data;
  const trainersCount = trainersCountResult.data ?? 0;

  if (!pageError && !cooperation) {
    redirect("/dashboard/trainers");
  }

  const selectedTrainer = cooperation
    ? {
        key: cooperation.trainer_id,
        name: `${cooperation.trainer.user.name} ${cooperation.trainer.user.surname}`,
        phone: cooperation.trainer.user.phone,
        workplace: `${cooperation.workplace.name} - ul. ${cooperation.workplace.street} ${cooperation.workplace.building_number}${cooperation.workplace.flat_number ? `/${cooperation.workplace.flat_number}` : ""}, ${cooperation.workplace.city}`,
        workDescription: cooperation.trainer.work_description,
        price: cooperation.trainer.price_per_training
          ? `${cooperation.trainer.price_per_training} PLN`
          : "Nie podano ceny",
        slug: cooperation.trainer.slug,
      }
    : null;

  return (
    <div className="p-3">
      {pageError && (
        <Card>
          <CardContent>
            <Alert variant="destructive" className="mx-auto my-12">
              <AlertDescription>{pageError}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {!pageError && selectedTrainer && (
        <div className="space-y-4">
          {trainersCount === 1 ? (
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 sm:mb-5 gap-6">
              <h1 className="text-2xl font-michroma md:ml-1">Twój trener</h1>

              <Button variant="secondary" className="border border-baby-blue flex w-[185px] gap-2 text-xs font-michroma">
                <BookOpen className="shrink-0" />
                Katalog trenerów
              </Button>
            </div>
          ) : (
            <div className="flex justify-center">
              <button className="bg-dirty-blue rounded-2xl p-3 pr-4 flex items-center text-sm gap-2 hover:bg-hover mb-5">
                <ChevronLeft size={14} /> <Link href="/dashboard/trainers">Wróć do listy trenerów</Link>
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <Card>
              <CardContent className="flex flex-col space-y-4 text-gray-300 text-sm items-center w-full">
                <CardTitle className="text-gold font-michroma text-lg max-w-full overflow-x-auto text-center custom-scrollbar mb-6">{selectedTrainer.name}</CardTitle>
                <TrainerQuickActions trainerId={selectedTrainer.key} slug={selectedTrainer.slug} phone={selectedTrainer.phone} />

                <div className="flex items-center gap-3 mt-3">
                  <Banknote className="text-baby-blue w-4 h-4" />
                  <span>{selectedTrainer.price}</span>
                </div>
                <div className="flex items-center gap-3 max-w-full truncate  pl-1 custom-scrollbar overflow-x-auto">
                  <MapPin className="text-baby-blue w-4 h-4 shrink-0" />
                  <span>{selectedTrainer.workplace}</span>
                </div>

                {selectedTrainer.workDescription && (
                  <div className="bg-dirty-blue/40 rounded-md p-2 w-full">
                    <div className="p-2 custom-scrollbar max-h-40 overflow-y-auto text-gray-400 italic break-words whitespace-pre-wrap [tab-size:4]">
                      {selectedTrainer.workDescription}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-baby-blue font-michroma">OPINIE</CardTitle>
                <OpinionDialog
                  trainerId={selectedTrainer.key}
                  trainerName={selectedTrainer.name}
                />
              </CardHeader>
              <CardContent>
                <TrainerOpinionsList trainerId={selectedTrainer.key} />
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
