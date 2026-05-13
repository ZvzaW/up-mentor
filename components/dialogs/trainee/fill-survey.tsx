"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

import { ClipboardList, Loader2, Info } from "lucide-react"
import { toast } from "sonner"
import { saveSurveyAnswersAction, getSurveyDataAction } from "@/actions/survey"
import { SkeletonList } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface QuestionData {
  id: string
  question: string
  currentAnswer?: string
}

export function FillSurveyDialog() {
  const [questions, setQuestions] = useState<QuestionData[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isOpen, setIsOpen] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const fetchSurveyData = async () => {
      if (!isOpen) return

      setError(null)
      setIsLoadingData(true)

      const result = await getSurveyDataAction()

      if (!isMounted) return

      if (result?.error) {
        setError(result.error)
      } else if (result.data) {
        setQuestions(result.data)
        
        const initialAnswers: Record<string, string> = {}
        result.data.forEach((q) => {
          if (q.currentAnswer) {
            initialAnswers[q.id] = q.currentAnswer
          }
        })
        setAnswers(initialAnswers)
      }
      setIsLoadingData(false)
    }

    fetchSurveyData()

    return () => {
      isMounted = false
    }
  }, [isOpen])

  const handleAnswerChange = (questionId: string, val: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: val }))
  }

  const handleSubmit = async () => {
    const answeredCount = Object.values(answers).filter(a => a.trim() !== "").length
    if (answeredCount === 0) {
      toast.error("Wypełnij przynajmniej jedno pytanie przed zapisem.")
      return
    }

    setIsPending(true)
    const payload = Object.entries(answers)
      .filter(([_, text]) => text.trim() !== "")
      .map(([qId, text]) => ({
        question_id: qId,
        answer: text,
      }))

    const result = await saveSurveyAnswersAction(payload)

    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success("Twoja ankieta została zapisana pomyślnie!")
      setIsOpen(false)
    }
    setIsPending(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
       <Button variant="secondary">
         <ClipboardList /> Ankieta startowa
       </Button>
      </DialogTrigger>

      <DialogContent className=" flex max-h-[95%] flex-col sm:max-w-[700px]">
        <DialogHeader >
          <DialogTitle className="font-michroma text-baby-blue">
            Ankieta startowa
          </DialogTitle>
          <DialogDescription className="mt-2 flex items-start gap-2 text-zinc-400 ">
            <Info className="text-baby-blue size-4 shrink-0" />
            Te informacje są widoczne tylko dla Twojego trenera.
          </DialogDescription>
        </DialogHeader>

        {/*PYTANIA*/}
        <div className="custom-scrollbar space-y-10 overflow-y-auto p-6 bg-dirty-blue rounded-lg">
          {isLoadingData ? (
             <SkeletonList/>
          ) : error ? (
<Alert variant="destructive" className="mx-auto">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
          ) : questions.length === 0 ? (
             <div className="flex h-full flex-col items-center justify-center">
               <p className="text-zinc-400">Brak dostępnych pytań w ankiecie.</p>
             </div>
          ) : (
             questions.map((q, index) => (
               <div key={q.id} className="group space-y-4">
                 <div className="flex items-start gap-4">
                   <span className="font-michroma text-gold flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gold text-sm">
                     {index + 1}
                   </span>
                   <label className="text-zinc-200 mt-1 leading-snug">
                     {q.question}
                   </label>
                 </div>
                 <textarea
                   placeholder="Twoja odpowiedź..."
                   className=" focus:border-gold bg-dirty-navy/50 text-sm w-full rounded-md border p-4 transition-all outline-none placeholder:text-zinc-500 custom-scrollbar"
                   value={answers[q.id] || ""}
                   onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                 />
               </div>
             ))
          )}
        </div>

        {!isLoadingData && !error && <DialogFooter>
          <Button
            variant="destructive"
            onClick={() => setIsOpen(false)}
            disabled={isPending || isLoadingData}
          >
            Anuluj
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || isLoadingData || questions.length === 0}
          >
            {isPending && (
              <Loader2 className=" animate-spin" />
            )}
            Zapisz
          </Button>
        </DialogFooter>
        }
      </DialogContent>
    </Dialog>
  )
}