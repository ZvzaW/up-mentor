"use client"

import { Card, CardContent } from "@/components/ui/card"
import SettingsDialog from "@/components/dialogs/settings"
import { FillSurveyDialog } from "@/components/dialogs/trainee/fill-survey"

interface TraineeProfileProps {
  baseData: {
    id: string
    name: string
    surname: string
    email: string
    phone: string
    role: string
  }
  specificData: {
    birthdate: Date
  }
}

export default function TraineeProfile({
  baseData,
  specificData,
}: TraineeProfileProps) {
  
  return (
    <section className="grid grid-cols-1 gap-10 lg:grid-cols-5">
      {/* PROFIL*/}
      <div className="lg:col-span-2">
        <Card>
          <CardContent>
            <div className="flex flex-col items-center text-center">
              <div className="font-michroma text-baby-blue w-full text-xl">
                <p className="truncate">{baseData.name}</p>
                <p className="truncate">{baseData.surname}</p>
              </div>

              <div className="mt-6 flex w-full max-w-[250px] flex-col gap-4">
                <FillSurveyDialog />
                <SettingsDialog
                  baseData={baseData}
                  specificData={specificData}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/*TO-DO: Replace with working server actions*/}
      {/* REKORDY OSOBISTE */}
      <div className="lg:col-span-3">
        <Card className="h-full">
          <CardContent>
            <p className="text-baby-blue font-michroma mb-8 text-xl">
              Rekordy osobiste
            </p>

            <div className="space-y-6">
              {[
                { label: "Wyciskanie leżąc", value: "100 kg" },
                { label: "Martwy ciąg", value: "140 kg" },
                { label: "Przysiad", value: "120 kg" },
              ].map((rekord) => (
                <div
                  key={rekord.label}
                  className="flex items-center justify-between border-b border-zinc-700/50 pb-3"
                >
                  <span className="text-md text-zinc-400">{rekord.label}</span>
                  <span className="text-gold text-lg font-bold">
                    {rekord.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
