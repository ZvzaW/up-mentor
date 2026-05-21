import { redirect } from "next/navigation"
import { getCatalogTrainerBySlug } from "@/actions/catalog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin } from "lucide-react"
import { TrainerOpinionsFetch } from "@/components/common/trainer-opinions-list"
import { Separator } from "@/components/ui/separator"
import { BackButton } from "@/components/common/back-button"
import { getCooperationStatus } from "@/actions/coaching-request"
import { SendCoachingRequestDialog } from "@/components/dialogs/trainee/send-coaching-request"
import { DeleteCoachingRequestButton } from "@/components/pages/catalog/delete-request"
import { workplace } from "@prisma/client"

type TrainerCatalogDetailsPageProps = {
  params: Promise<{
    slug: string
  }>
}

export default async function TrainerCatalogDetailsPage({
  params,
}: TrainerCatalogDetailsPageProps) {
  const { slug } = await params
  const result = await getCatalogTrainerBySlug(slug)
  const trainer = result.data

  if (!result.error && !trainer) {
    redirect("/dashboard/trainers/catalog")
  }

  let status = { hasRequest: false, hasCooperation: false }
  if (trainer) {
    status = await getCooperationStatus(trainer.id)
  }

  const canRequest = !status.hasRequest && !status.hasCooperation

  return (
    <div className="space-y-4 p-3">
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
          <BackButton label="Wróć do katalogu" />

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
            <Card>
              <CardContent className="flex w-full flex-col items-center space-y-8 text-sm text-gray-300">
                <CardTitle className="text-gold font-michroma custom-scrollbar mb-8 max-w-full overflow-x-auto text-center text-lg">
                  {trainer.name}
                </CardTitle>

                {canRequest ? (
                  <SendCoachingRequestDialog
                    trainerId={trainer.id}
                    workplaces={trainer.workplaces as workplace[]}
                  />
                ) : (
                  <div className="bg-dirty-blue/40 text-baby-blue border-baby-blue/20 flex flex-col gap-3 rounded-xl border px-4 py-3 text-sm font-medium">
                    {status.hasCooperation
                      ? "Masz aktywną współpracę z tym trenerem"
                      : "Twoja prośba oczekuje na akceptację"}

                    {status.hasRequest && !status.hasCooperation && (
                      <DeleteCoachingRequestButton trainerId={trainer.id} />
                    )}
                  </div>
                )}

                <Separator />
                <div className="text-baby-blue flex w-full items-baseline justify-center gap-1">
                  <span className="font-michroma">Godzina treningu -</span>
                  {trainer.pricePerTraining !== null ? (
                    <span className="text-zinc-300">
                      {trainer.pricePerTraining} PLN
                    </span>
                  ) : (
                    <span className="text-zinc-400">Brak podanej ceny</span>
                  )}
                </div>

                <div className="w-full">
                  <p className="text-baby-blue font-michroma mb-1.5 text-center">
                    Opis
                  </p>
                  <div className="bg-dirty-blue/40 w-full rounded-md p-2">
                    {trainer.workDescription ? (
                      <div className="custom-scrollbar max-h-40 overflow-y-auto p-2 break-words whitespace-pre-wrap text-zinc-300 italic [tab-size:4]">
                        {trainer.workDescription}
                      </div>
                    ) : (
                      <p className="text-center text-sm text-zinc-400">
                        Brak opisu
                      </p>
                    )}
                  </div>
                </div>

                <div className="w-full">
                  <p className="text-baby-blue font-michroma mb-1.5 text-center">
                    Miejsca pracy
                  </p>
                  <div className="space-y-2">
                    {trainer.workplaces.length > 0 ? (
                      trainer.workplaces.map((workplace) => (
                        <div
                          key={workplace.id}
                          className="bg-dirty-blue/40 items-center rounded-md px-3 py-2"
                        >
                          <div className="mt-1 flex items-start gap-2 text-sm text-zinc-300">
                            <MapPin className="text-baby-blue h-4 w-4 shrink-0" />
                            <span className="text-gold">{workplace.name}</span>
                            <span>
                              - ul. {workplace.street}{" "}
                              {workplace.building_number}
                              {workplace.flat_number
                                ? `/${workplace.flat_number}`
                                : ""}
                              , {workplace.city}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-zinc-400">
                        Brak zdefiniowanych miejsc pracy.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-baby-blue font-michroma">
                  OPINIE
                </CardTitle>
              </CardHeader>
              <CardContent>
              <TrainerOpinionsFetch trainerId={trainer.id}/>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
