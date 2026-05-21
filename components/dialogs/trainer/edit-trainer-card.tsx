"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { updateTrainerCard } from "@/actions/profile"
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
import { Input } from "@/components/ui/input"
import {
  TrainerCardInput,
  trainerCardSchema,
} from "@/lib/validations"
import { Loader2 } from "lucide-react"

interface EditTrainerCardDialogProps {
  pricePerTraining: number | null
  workDescription: string | null
}

export default function EditTrainerCardDialog({
  pricePerTraining,
  workDescription,
}: EditTrainerCardDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [isSaving, startSavingTransition] = React.useTransition()
  const form = useForm<TrainerCardInput>({
    resolver: zodResolver(trainerCardSchema),
    defaultValues: {
      price_per_training: pricePerTraining ?? null,
      work_description: workDescription ?? "",
    },
    mode: "onChange",
  })

  React.useEffect(() => {
    if (!open) {
      form.reset({
        price_per_training: pricePerTraining ?? null,
        work_description: workDescription ?? "",
      })
    }
  }, [open, pricePerTraining, workDescription, form])

  const handleSave = (data: TrainerCardInput) => {
    startSavingTransition(async () => {
      const result = await updateTrainerCard({
        price_per_training: data.price_per_training,
        work_description: data.work_description,
      })

      if (result?.error) {
        toast.error(result.error)
        return
      }

      toast.success("Zaktualizowano wizytówkę")
      setOpen(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="w-full">
          Edytuj wizytówkę
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edycja wizytówki trenera</DialogTitle>
          <DialogDescription>
            Zmień cenę za trening oraz opis pracy widoczny na profilu.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)}>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="price_per_training"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cena za godzinę treningu (PLN)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const val = e.target.value
                          field.onChange(val === "" ? null : Number(val))
                        }}
                        placeholder="Np. 150"
                        inputMode="numeric"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="work_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opis pracy</FormLabel>
                    <FormControl>
                      <textarea
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        placeholder="Opisz swój styl pracy, doświadczenie, specjalizację i podejście."
                        className="custom-scrollbar border-input focus-visible:ring-baby-blue flex min-h-[150px] w-full rounded-md border bg-transparent px-3 py-2 text-sm focus-visible:ring-1 focus-visible:outline-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="destructive"
                onClick={() => setOpen(false)}
                disabled={isSaving}
              >
                Anuluj
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="animate-spin" /> : "Zapisz"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
