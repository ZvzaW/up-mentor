"use client"

import * as React from "react"
import { changeProfileVisibility } from "@/actions/profile"
import EditTrainerCardDialog from "@/components/dialogs/trainer/edit-trainer-card"
import EditWorkplaceDialog from "@/components/dialogs/trainer/edit-workplace"
import DeleteWorkplaceDialog from "@/components/dialogs/trainer/delete-workplace"
import AddWorkplaceDialog from "@/components/dialogs/trainer/add-workplace"
import SettingsDialog from "@/components/dialogs/settings"
import { Card, CardContent } from "@/components/ui/card"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverDescription,
} from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { InfoIcon, Star } from "lucide-react"
import { toast } from "sonner"
import { ShowOpinionsDialog } from "@/components/dialogs/trainer/show-opinions"

interface TrainerProfileProps {
  baseData: {
    id: string
    name: string
    surname: string
    email: string
    phone: string
    role: string
  }
  specificData: {
    work_description: string | null
    price_per_training: number | null
    is_public: boolean
    workplace: {
      id: string
      name: string
      street: string
      building_number: string
      flat_number: string | null
      city: string
    }[]
  }
}

export default function TrainerProfile({
  baseData,
  specificData,
}: TrainerProfileProps) {
  const [isPublic, setIsPublic] = React.useState(specificData.is_public)
  const [isSaving, startSavingTransition] = React.useTransition()

  const handleProfileVisibilityChange = (checked: boolean) => {
    const previousValue = isPublic
    setIsPublic(checked)

    startSavingTransition(async () => {
      const result = await changeProfileVisibility(checked)

      if (result?.error) {
        setIsPublic(previousValue)
        toast.error(result.error)
        return
      }

      toast.success(`Profil jest teraz ${checked ? "publiczny" : "prywatny"}.`)
    })
  }

  return (
    <section className="grid grid-cols-1 gap-10 lg:grid-cols-6">
      <div className="lg:col-span-4">
        <Card className="h-full">
          <CardContent className="my-auto flex flex-col px-0 md:grid md:grid-cols-[9fr_1px_10fr]">
            {/* Dane */}
            <div className="order-1 mb-8 min-w-0 px-5 text-center md:order-none md:row-start-1">
              <div className="font-michroma text-baby-blue w-full text-xl">
                <p className="truncate">{baseData.name}</p>
                <p className="break-words">{baseData.surname}</p>
              </div>
            </div>

            {/* Wizytówka */}
            <div className="order-4 mt-7 flex h-full min-w-0 flex-col items-center gap-6 px-8 md:order-none md:row-span-2 md:mt-0">
              <div className="space-y-1 text-center">
                <p className="text-sm text-zinc-400">
                  Cena za godzinę treningu
                </p>
                <p>
                  {specificData.price_per_training !== null
                    ? `${specificData.price_per_training} PLN`
                    : "Brak podanej ceny"}
                </p>
              </div>
              <div className="w-full space-y-1">
                <p className="text-center text-sm text-zinc-400">Opis pracy</p>
                <div className="bg-dirty-blue/40 mx-auto rounded-md p-2 md:ml-2">
                  <p className="custom-scrollbar max-h-30 overflow-y-auto p-1 text-sm break-words whitespace-pre-wrap [tab-size:4]">
                    {specificData.work_description ?? "Brak opisu"}
                  </p>
                </div>
              </div>

              <div className="mt-auto">
                <EditTrainerCardDialog
                  pricePerTraining={specificData.price_per_training}
                  workDescription={specificData.work_description}
                />
              </div>
            </div>

            {/* Zakładki i opcje */}
            <div className="order-2 flex flex-col items-center md:order-none md:mt-auto">
              <div className="flex w-full max-w-[250px] flex-col gap-4">
                <div className="mx-auto flex">
                  <Popover>
                    <PopoverTrigger>
                      <InfoIcon className="hover:text-gold mr-2 mb-0.5 size-4 text-zinc-300" />
                    </PopoverTrigger>
                    <PopoverContent>
                      <PopoverDescription>
                        Profil publiczny pozwala na widoczność Twojego profilu w
                        wyszukiwarce trenerów. Umożliwia to nawiązanie z Tobą
                        współpracy.
                        <br />
                        Aktualnie twój profil jest{" "}
                        <span className="font-bold">
                          {isPublic ? "publiczny" : "prywatny"}
                        </span>
                        .
                      </PopoverDescription>
                    </PopoverContent>
                  </Popover>
                  <p className="mr-5 text-sm text-zinc-300">Profil publiczny</p>

                  <Switch
                    title={isPublic ? "publiczny" : "prywatny"}
                    checked={isPublic}
                    onCheckedChange={handleProfileVisibilityChange}
                    disabled={isSaving}
                  />
                </div>

                <ShowOpinionsDialog trainerId={baseData.id} />
                <SettingsDialog
                  baseData={baseData}
                  specificData={specificData}
                />
              </div>
            </div>

            <div className="bg-gold order-3 mx-auto mt-8 block h-[1px] w-[80%] md:order-none md:row-span-2 md:row-start-1 md:my-0 md:h-auto md:w-[1px]" />
          </CardContent>
        </Card>
      </div>

      {/* MIEJSCA PRACY */}
      <div className="lg:col-span-2">
        <Card className="h-full">
          <CardContent>
            <div className="mb-8 flex items-center justify-between gap-4">
              <p className="text-baby-blue font-michroma text-xl">
                Miejsca pracy
              </p>
              <AddWorkplaceDialog />
            </div>
            <div className="custom-scrollbar space-y-3 overflow-y-auto pr-2 lg:max-h-[225px]">
              {specificData.workplace.length > 0 ? (
                specificData.workplace.map((place) => (
                  <div
                    key={place.id}
                    className="bg-dirty-blue flex items-start justify-between rounded-md p-4 pr-2"
                  >
                    <div className="min-w-0">
                      <p className="text-gold truncate text-base font-medium">
                        {place.name}
                      </p>
                      <p className="mt-2 truncate text-sm text-zinc-300">
                        ul. {place.street} {place.building_number}
                        {place.flat_number ? `/${place.flat_number}` : ""},
                      </p>
                      <p className="truncate text-sm text-zinc-300">
                        {place.city}
                      </p>
                    </div>

                    <div className="my-auto flex shrink-0 flex-col gap-1">
                      <EditWorkplaceDialog workplace={place} />
                      <DeleteWorkplaceDialog
                        workplaceId={place.id}
                        workplaceName={place.name}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-zinc-400">Brak dodanych miejsc pracy.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
