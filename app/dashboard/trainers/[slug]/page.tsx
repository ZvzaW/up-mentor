import { redirect } from "next/navigation"
import {
  getMyTrainerBySlug,
  hasTrainerCooperation,
} from "@/actions/my-trainers"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Banknote, BookOpen, ChevronLeft, MapPin } from "lucide-react"
import { TrainerQuickActions } from "@/components/pages/my-trainers/trainer-quick-actions"
import { OpinionDialog } from "@/components/dialogs/trainee/opinion-dialog"
import { TrainerOpinionsList } from "@/components/pages/trainer-opinions-list"

type TrainerDetailsPageProps = {
  params: Promise<{
    slug: string
  }>
}

export default async function TrainerDetailsPage({
  params,
}: TrainerDetailsPageProps) {
  const { slug } = await params
  const [trainerResult, cooperationResult] = await Promise.all([
    getMyTrainerBySlug(slug),
    hasTrainerCooperation(),
  ])

  const pageError = trainerResult.error ?? cooperationResult.error
  const cooperation = trainerResult.data
  const hasAnyCooperation = cooperationResult.data ?? false

  if (!pageError && !cooperation) {
    redirect("/dashboard/trainers")
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
    : null

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
          {hasAnyCooperation ? (
            <div className="flex justify-center">
              <button className="bg-dirty-blue hover:bg-hover mb-5 flex items-center gap-2 rounded-2xl p-3 pr-4 text-sm">
                <ChevronLeft size={14} />{" "}
                <Link href="/dashboard/trainers">Wróć do listy trenerów</Link>
              </button>
            </div>
          ) : (
            <div className="mb-8 flex flex-col items-center justify-between gap-6 sm:mb-5 sm:flex-row">
              <h1 className="font-michroma text-2xl md:ml-1">Twój trener</h1>

              <Button
                asChild
                variant="secondary"
                className="font-michroma flex w-[185px] gap-2 text-xs"
              >
                <Link href="/dashboard/trainers/catalog">
                  <BookOpen className="shrink-0" />
                  Katalog trenerów
                </Link>
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
            <Card>
              <CardContent className="flex w-full flex-col items-center space-y-4 text-sm text-gray-300">
                <CardTitle className="text-gold font-michroma custom-scrollbar mb-6 max-w-full overflow-x-auto text-center text-lg">
                  {selectedTrainer.name}
                </CardTitle>
                <TrainerQuickActions
                  trainerId={selectedTrainer.key}
                  slug={selectedTrainer.slug}
                  phone={selectedTrainer.phone}
                />

                <div className="mt-3 flex items-center gap-3">
                  <Banknote className="text-baby-blue h-4 w-4" />
                  <span>{selectedTrainer.price}</span>
                </div>
                <div className="custom-scrollbar flex max-w-full items-center gap-3 truncate overflow-x-auto pl-1">
                  <MapPin className="text-baby-blue h-4 w-4 shrink-0" />
                  <span>{selectedTrainer.workplace}</span>
                </div>

                {selectedTrainer.workDescription && (
                  <div className="bg-dirty-blue/40 w-full rounded-md p-2">
                    <div className="custom-scrollbar max-h-40 overflow-y-auto p-2 break-words whitespace-pre-wrap text-gray-400 italic [tab-size:4]">
                      {selectedTrainer.workDescription}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-baby-blue font-michroma">
                  OPINIE
                </CardTitle>
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
  )
}
