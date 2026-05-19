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
    <section className="w-full">
      {/* PROFIL*/}
      <div >
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
    </section>
  )
}
