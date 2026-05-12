"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ClipboardList, Loader2, Info } from "lucide-react"
import { getSurveyDataAction } from "@/actions/survey"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SkeletonTable } from "@/components/ui/skeleton"

interface QuestionData {
  id: string
  question: string
  currentAnswer?: string
}

interface ShowTraineeSurveyDialogProps {
  traineeId: string
  name: string
}

export function ShowTraineeSurveyDialog({ traineeId, name }: ShowTraineeSurveyDialogProps) {
  const [questions, setQuestions] = useState<QuestionData[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const fetchSurveyData = async () => {
      if (!isOpen) return

      setError(null)
      setIsLoading(true)

      try {
        const result = await getSurveyDataAction(traineeId)

        if (!isMounted) return

        if (result.error) {
          setError(result.error)
        } else if (result.data) {
          setQuestions(result.data)
        }
      } catch (err) {
        if (isMounted) {
          setError("Wystąpił nieoczekiwany błąd serwera. Spróbuj ponownie później.")
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchSurveyData()

    return () => {
      isMounted = false
    }
  }, [isOpen, traineeId])

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          type="button"
          className="h-11 w-full flex-1 rounded-none"
        >
          <ClipboardList/>
          Ankieta startowa
        </Button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[95%] flex-col sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="font-michroma text-baby-blue">
            Ankieta startowa - {name}
          </DialogTitle>
          <DialogDescription className="mt-2 flex items-start gap-2 text-zinc-400">
            <Info className="text-baby-blue size-4 shrink-0" />
            Poniżej znajdują się informacje medyczno-treningowe wypełnione przez kursanta.
          </DialogDescription>
        </DialogHeader>

        {/*PYTANIA I ODPOWIEDZI*/}
        <div className="custom-scrollbar bg-dirty-blue space-y-12 overflow-y-auto rounded-lg p-6">
          {isLoading ? (
            <SkeletonTable/>
          ) : error ? (
            <Alert variant="destructive" className="mx-auto">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : questions.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center">
              <p className="text-zinc-400">Brak dostępnych pytań w systemie.</p>
            </div>
          ) : (
            questions.map((q, index) => (
              <div key={q.id} className="group space-y-4">
                <div className="flex items-start gap-4">
                  <span className="font-michroma text-gold border-gold flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-sm">
                    {index + 1}
                  </span>
                  <label className="mt-1 leading-snug text-zinc-200">
                    {q.question}
                  </label>
                </div>
                
                <div className="bg-dirty-navy/50 w-full rounded-md border p-4 text-sm text-zinc-300">
                  {q.currentAnswer ? (
                    <p className="whitespace-pre-wrap">{q.currentAnswer}</p>
                  ) : (
                    <p className="italic text-zinc-500">
                      Podopieczny nie udzielił odpowiedzi na to pytanie.
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}