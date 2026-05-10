import { redirect } from "next/navigation";
import { getCatalogTrainerBySlug } from "@/actions/catalog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { TrainerOpinionsList } from "@/components/pages/trainer-opinions-list";
import { Separator } from "@/components/ui/separator"
import { BackButton } from "@/components/common/back-button";
import { getCooperationStatus } from "@/actions/coaching-request";
import { SendCoachingRequestDialog } from "@/components/dialogs/trainee/send-coaching-request";
import { DeleteCoachingRequestButton } from "@/components/pages/catalog/delete-request";

type TrainerCatalogDetailsPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function TrainerCatalogDetailsPage({ params }: TrainerCatalogDetailsPageProps) {

  const { slug } = await params;
  const result = await getCatalogTrainerBySlug(slug);
  const trainer = result.data;

  if (!result.error && !trainer) {
    redirect("/dashboard/trainers/catalog");
  }


  let status = { hasRequest: false, hasCooperation: false };
  if (trainer) {
    status = await getCooperationStatus(trainer.id);
  }

  const canRequest = !status.hasRequest && !status.hasCooperation;

  return (
    <div className="p-3 space-y-4">
      {result.error && (
        <Card>
          <CardContent>
            <Alert variant="destructive" className="mx-auto my-12">
              <AlertDescription>{result.error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {!result.error && trainer && (
        <>
          
            <BackButton label="Wróć do katalogu"/>

            
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <Card>
              <CardContent className="flex flex-col space-y-8 text-gray-300 text-sm items-center w-full">
                <CardTitle className="text-gold font-michroma text-lg max-w-full overflow-x-auto text-center custom-scrollbar mb-8">
                  {trainer.name}
                </CardTitle>

                {canRequest ? (
              <SendCoachingRequestDialog trainerId={trainer.id} workplaces={trainer.workplaces} />
            ) : (
              <div className="flex flex-col  gap-3 px-4 py-3 bg-dirty-blue/40 rounded-xl text-sm text-baby-blue font-medium border border-baby-blue/20">
                {status.hasCooperation 
                  ? "Masz aktywną współpracę z tym trenerem" 
                  : "Twoja prośba oczekuje na akceptację"}

{status.hasRequest && !status.hasCooperation && (
        <DeleteCoachingRequestButton trainerId={trainer.id} />
      )}
              </div>
            )}

                <Separator/>
                <div className="w-full flex items-baseline text-baby-blue justify-center gap-1 ">
                 <span className="font-michroma ">Godzina treningu -</span>
                {trainer.pricePerTraining !== null ? 
                  (<span className="text-zinc-300">{trainer.pricePerTraining} PLN</span>) : 
                  (<span className="text-zinc-400">Brak podanej ceny</span>)}
                </div>

                <div className="w-full">
                  <p className="text-baby-blue font-michroma mb-1.5 text-center">Opis</p>
                  <div className="bg-dirty-blue/40 rounded-md p-2 w-full">
                  {trainer.workDescription ? (
                    <div className="p-2 custom-scrollbar max-h-40 overflow-y-auto text-zinc-300 italic break-words whitespace-pre-wrap [tab-size:4]">
                      {trainer.workDescription}
                    </div>
                  ):(
                    <p className="text-zinc-400 text-sm text-center">Brak opisu</p>
                  )}
                  </div>
                </div>

                <div className="w-full">
                  <p className="text-baby-blue font-michroma text-center mb-1.5">Miejsca pracy</p>
                  <div className="space-y-2">
                    {trainer.workplaces.length > 0 ? (
                      trainer.workplaces.map((workplace) => (
                        <div key={workplace.id} className="rounded-md bg-dirty-blue/40 px-3 py-2 items-center">
                          <div className="flex items-start gap-2 text-zinc-300 text-sm mt-1">
                            <MapPin className="text-baby-blue w-4 h-4 shrink-0" />
                            <span className="text-gold">{workplace.name}</span>
                            <span>
                               - ul. {workplace.street} {workplace.building_number}
                              {workplace.flat_number ? `/${workplace.flat_number}` : ""},{" "}
                              {workplace.city}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-zinc-400 text-xs">Brak zdefiniowanych miejsc pracy.</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-baby-blue font-michroma">OPINIE</CardTitle>
              </CardHeader>
              <CardContent>
                <TrainerOpinionsList trainerId={trainer.id} />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}