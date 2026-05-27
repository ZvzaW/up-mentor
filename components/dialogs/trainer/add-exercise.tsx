"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"

import { createTrainerExercise } from "@/actions/exercise"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EXERCISE_BODY_PARTS } from "@/lib/types"
import {
  trainerExerciseFormSchema,
  type TrainerExerciseFormInput,
} from "@/lib/validations"

export function AddExerciseDialog() {
  const [open, setOpen] = React.useState(false)
  const [isSaving, startSavingTransition] = React.useTransition()
  const form = useForm<TrainerExerciseFormInput>({
    resolver: zodResolver(trainerExerciseFormSchema),
    defaultValues: {
      name: "",
      body_part: "",
      video_url: "",
    },
    mode: "onChange",
  })

  React.useEffect(() => {
    if (!open) {
      form.reset({
        name: "",
        body_part: "",
        video_url: "",
      })
    }
  }, [open, form])

  const handleSave = (data: TrainerExerciseFormInput) => {
    startSavingTransition(async () => {
      const result = await createTrainerExercise(data)

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success("Dodano ćwiczenie.")
      setOpen(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="mx-auto mt-4 mr-1 w-fit sm:mx-0 sm:mt-0">
          <Plus /> Dodaj ćwiczenie
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dodaj własne ćwiczenie</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)}>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nazwa ćwiczenia*</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-dirty-blue rounded-xl"
                        placeholder="np. Wyciskanie sztangi na ławce płaskiej"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="body_part"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Partia ciała*</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-dirty-blue w-full rounded-xl">
                          <SelectValue placeholder="Wybierz partię ciała" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {EXERCISE_BODY_PARTS.map((part) => (
                          <SelectItem key={part} value={part}>
                            {part}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="video_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Link do materiału instruktażowego (opcjonalnie)
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        type="url"
                        className="bg-dirty-blue rounded-xl"
                        placeholder="https://..."
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
                {isSaving ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Zapisz ćwiczenie"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
