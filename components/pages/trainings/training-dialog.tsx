"use client"

import * as React from "react"
import { useForm, useWatch, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"


import {
  createTraining,
  deleteTraining,
  updateTraining,
} from "@/actions/training"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  formatTrainingDateTime,
  type TrainingSlot,
} from "@/lib/training-calendar-functions"
import {
  formatWorkplaceAddress,
  toDateInputValue,
  toTimeInputValue,
} from "@/lib/utils"
import {
  trainingDialogSchema,
  type TrainingDialogFormValues,
} from "@/lib/validations"
import { TrainingDTO, WorkplaceAddress } from "@/lib/types"

const DURATION_OPTIONS = [
  { value: 0.5, label: "30 min" },
  { value: 1, label: "1 h" },
  { value: 1.5, label: "1,5 h" },
  { value: 2, label: "2 h" },
  { value: 2.5, label: "2,5 h" },
  { value: 3, label: "3 h" },
]

type TrainingDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit" | "view"
  training: TrainingDTO | null
  initialSlot?: TrainingSlot | null
  trainees: any[] | null
  isTrainer: boolean
  onSaved: () => void
}

export default function TrainingDialog({
  open,
  onOpenChange,
  mode,
  training,
  initialSlot,
  trainees,
  isTrainer,
  onSaved,
}: TrainingDialogProps) {
  const [isPending, startTransition] = React.useTransition()
  const wasOpenRef = React.useRef(false)
  const readOnly = mode === "view" || !isTrainer

  const defaultValues: TrainingDialogFormValues = React.useMemo(() => {
    if (training) {
      const startsAt = new Date(training.scheduledAt)
      return {
        id: training.id,
        trainee_id: training.traineeId,
        date: toDateInputValue(startsAt),
        start_time: toTimeInputValue(startsAt),
        duration: training.duration,
      }
    }
    return {
      trainee_id: "",
      date: initialSlot?.date ?? "",
      start_time: initialSlot?.start_time ?? "",
      duration: 1,
    }
  }, [training, initialSlot])

  const form = useForm<TrainingDialogFormValues>({
    resolver: zodResolver(
      trainingDialogSchema
    ) as Resolver<TrainingDialogFormValues>,
    defaultValues,
    mode: "onChange",
  })

  const { reset } = form

  React.useEffect(() => {
    if (open && !wasOpenRef.current) {
      reset(defaultValues)
    }
    wasOpenRef.current = open
  }, [open, defaultValues, reset])

  const watchTraineeId = useWatch({
    control: form.control,
    name: "trainee_id",
  })

  const selectedWorkplace = trainees?.find(
    (t) => t.id === watchTraineeId
  )?.workplace as WorkplaceAddress | undefined

  const selectedWorkplaceLabel = selectedWorkplace
    ? formatWorkplaceAddress(selectedWorkplace)
    : null

  const handleSubmit = (data: TrainingDialogFormValues) => {
    onOpenChange(false)
    startTransition(async () => {
      const result =
        mode === "edit" && data.id
          ? await updateTraining({
              id: data.id,
              trainee_id: data.trainee_id,
              date: data.date,
              start_time: data.start_time,
              duration: data.duration,
            })
          : await createTraining({
              trainee_id: data.trainee_id,
              date: data.date,
              start_time: data.start_time,
              duration: data.duration,
            })

      if (result?.error) {
        toast.error(result.error)
        return
      }

      toast.success(
        mode === "edit" ? "Zaktualizowano trening." : "Zaplanowano trening."
      )
      onSaved()
    })
  }

  const handleDeleteClick = () => {
    if (!training?.id) return
    if (!confirm("Czy na pewno chcesz usunąć ten trening?")) return
    onOpenChange(false)
    startTransition(async () => {
      const result = await deleteTraining(training.id)
      if (result?.error) {
        toast.error(result.error)
        return
      }
      toast.success("Usunięto trening.")
      onSaved()
    })
  }

  const title =
    mode === "create"
      ? "Nowy trening"
      : mode === "edit"
        ? "Edycja treningu"
        : "Szczegóły treningu"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className=" flex  flex-col ">
        <DialogHeader >
          <DialogTitle>
            {title}
          </DialogTitle>
          <DialogDescription >
            {readOnly
              ? "Podgląd zaplanowanego treningu."
              : "Uzupełnij dane treningu - będzie widoczny u Ciebie i u podopiecznego."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex   flex-col ">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="flex flex-col"
            >
              <div className="space-y-5 ">
                {readOnly && training ? (
                  <div className="space-y-3 text-sm text-zinc-200">
                    <p>
                      <span className="text-gold">Trener: </span>
                      {training.trainerName}
                    </p>
                    <p className="break-words">
                      <span className="text-gold">Miejsce: </span>
                      {training.workplaceAddress}
                    </p>
                    <p>
                      <span className="text-gold">Termin: </span>
                      {formatTrainingDateTime(
                        new Date(training.scheduledAt),
                        training.duration
                      )}
                    </p>
                  </div>
                ) : (
                  <>
                    <FormField
                      control={form.control}
                      name="trainee_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Podopieczny</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full border-baby-blue">
                                <SelectValue placeholder="Wybierz podopiecznego" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {trainees?.map((t) => (
                                <SelectItem key={t.id} value={t.id}>
                                  {t.fullName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {watchTraineeId && selectedWorkplaceLabel && (
                      <p className="mb-6 break-words rounded-lg bg-dirty-navy/50 px-3 py-2 text-sm text-zinc-300">
                        <span className="text-zinc-400">Miejsce treningu: </span>
                        {selectedWorkplaceLabel}
                      </p>
                    )}

                    <div className="grid gap-4 sm:grid-cols-3">
                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} className="appearance-none" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="start_time"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Godzina</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} className="appearance-none"/>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="duration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Czas trwania</FormLabel>
                            <Select
                              onValueChange={(v) =>
                                field.onChange(parseFloat(v))
                              }
                              value={String(field.value)}
                            >
                              <FormControl>
                                <SelectTrigger className="w-full border-baby-blue">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {DURATION_OPTIONS.map((opt) => (
                                  <SelectItem
                                    key={opt.value}
                                    value={String(opt.value)}
                                  >
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}
              </div>

              {!readOnly && (
                <DialogFooter>
                  {mode === "edit" && (
                    <Button
                      type="button"
                      className="mr-auto bg-gold hover:bg-gold/60"
                      disabled={isPending}
                      onClick={handleDeleteClick}
                    >
                      <Trash2 className="size-4" />
                      Usuń
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => onOpenChange(false)}
                  >
                    Anuluj
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending && <Loader2 className="animate-spin" />}
                    Zapisz
                  </Button>
                </DialogFooter>
              )}

              {readOnly && (
                <DialogFooter>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => onOpenChange(false)}
                  >
                    Zamknij
                  </Button>
                </DialogFooter>
              )}
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
