"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Pencil, Plus, Star } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import {
  deleteOpinion,
  getMyOpinion,
  upsertOpinion,
} from "@/actions/opinion"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  trainerOpinionSchema,
  type TrainerOpinionFormValues,
} from "@/lib/validations"
import { cn } from "@/lib/utils"

type OpinionDialogProps = {
  trainerId: string
  trainerName: string
}

export function OpinionDialog({ trainerId, trainerName }: OpinionDialogProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [isSaving, startSavingTransition] = React.useTransition()
  const [isLoadingOpinion, setIsLoadingOpinion] = React.useState(false)
  const [currentOpinion, setCurrentOpinion] = React.useState<{
    rate: number
    comment: string | null
  } | null>(null)
  const hasOpinion = currentOpinion !== null

  const form = useForm<TrainerOpinionFormValues>({
    resolver: zodResolver(trainerOpinionSchema),
    defaultValues: {
      trainer_id: trainerId,
      rate: 5,
      comment: "",
    },
    mode: "onChange",
  })

  React.useEffect(() => {
    if (!open) return

    let mounted = true
    setIsLoadingOpinion(true)

    void (async () => {
      const result = await getMyOpinion(trainerId)
      if (!mounted) return

      if (result.error) {
        toast.error(result.error)
        setCurrentOpinion(null)
        form.reset({
          trainer_id: trainerId,
          rate: 5,
          comment: "",
        })
        setIsLoadingOpinion(false)
        return
      }

      const opinion = result.data ?? null
      setCurrentOpinion(opinion)
      form.reset({
        trainer_id: trainerId,
        rate: opinion?.rate ?? 5,
        comment: opinion?.comment ? opinion.comment : "",
      })
      setIsLoadingOpinion(false)
    })()

    return () => {
      mounted = false
    }
  }, [open, trainerId, form])

  const handleSave = (data: TrainerOpinionFormValues) => {
    startSavingTransition(async () => {
      const result = await upsertOpinion(data)

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success(hasOpinion ? "Zaktualizowano opinię." : "Dodano opinię.")
      setCurrentOpinion({
        rate: data.rate,
        comment: data.comment,
      })
      setOpen(false)
      router.refresh()
    })
  }

  const handleDelete = () => {
    startSavingTransition(async () => {
      const result = await deleteOpinion(trainerId)

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success("Usunięto opinię.")
      setCurrentOpinion(null)
      form.reset({
        trainer_id: trainerId,
        rate: 5,
        comment: "",
      })
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="xs"
          className="mr-1"
          title="Dodaj lub edytuj swoją opinię"
          aria-label="Dodaj lub edytuj swoją opinię"
        >
          <Plus /> <Pencil />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-michroma">
            {hasOpinion ? "Twoja opinia" : "Nowa opinia"}
          </DialogTitle>
          <DialogDescription>
            {hasOpinion
              ? `Zaktualizuj lub usuń opinię dla trenera ${trainerName}.`
              : `Oceń współpracę z trenerem ${trainerName}. Możesz dodać jedną opinię danemu trenerowi - później możesz ją edytować.`}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
            <input type="hidden" {...form.register("trainer_id")} />

            <FormField
              control={form.control}
              name="rate"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div
                      className="flex justify-center gap-1"
                      role="group"
                      aria-label="Ocena od 1 do 5"
                    >
                      {Array.from({ length: 5 }, (_, index) => {
                        const value = index + 1
                        const active = value <= field.value
                        return (
                          <button
                            key={value}
                            type="button"
                            className="focus-visible:ring-baby-blue rounded p-0.5 transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:outline-none"
                            onClick={() => field.onChange(value)}
                            aria-label={`${value} z 5 gwiazdek`}
                            aria-pressed={active}
                          >
                            <Star
                              className={cn(
                                "size-8",
                                active
                                  ? "fill-gold text-gold"
                                  : "text-gold/30 fill-transparent"
                              )}
                            />
                          </button>
                        )
                      })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Komentarz (opcjonalnie)</FormLabel>
                  <FormControl>
                    <textarea
                      {...field}
                      value={field.value || ""}
                      placeholder="Np. atmosfera treningów, komunikacja, postępy…"
                      rows={4}
                      className="custom-scrollbar border-input focus-visible:ring-baby-blue flex min-h-[100px] w-full rounded-md border bg-transparent px-3 py-2 text-sm focus-visible:ring-1 focus-visible:outline-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              {isLoadingOpinion ? (
                <div className="flex w-full justify-center">
                  <Loader2 className="animate-spin" aria-hidden />
                </div>
              ) : (
                <>
                  {hasOpinion ? (
                    <Button
                      type="button"
                      className="bg-zinc-400 hover:bg-zinc-400/60"
                      onClick={handleDelete}
                      disabled={isSaving}
                    >
                      Usuń opinię
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setOpen(false)}
                    disabled={isSaving}
                  >
                    Anuluj
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="animate-spin" aria-hidden />
                    ) : hasOpinion ? (
                      "Zapisz"
                    ) : (
                      "Dodaj"
                    )}
                  </Button>
                </>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
