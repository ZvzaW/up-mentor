"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Loader2, Pencil } from "lucide-react"

import { editWorkplace } from "@/actions/profile"
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
  editWorkplaceSchema,
  type EditWorkplaceFormValues,
} from "@/lib/validations"
import { workplace } from "@prisma/client"

interface EditWorkplaceDialogProps {
  workplace: {
    id: string
    name: string
    street: string
    building_number: string
    flat_number: string | null
    city: string
  }
}

export default function EditWorkplaceDialog({
  workplace,
}: EditWorkplaceDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [isSaving, startSavingTransition] = React.useTransition()
  const form = useForm<EditWorkplaceFormValues>({
    resolver: zodResolver(editWorkplaceSchema),
    defaultValues: {
      id: workplace.id,
      name: workplace.name,
      street: workplace.street,
      building_number: workplace.building_number,
      flat_number: workplace.flat_number ?? "",
      city: workplace.city,
    },
    mode: "onChange",
  })

  React.useEffect(() => {
    if (!open) {
      form.reset({
        id: workplace.id,
        name: workplace.name,
        street: workplace.street,
        building_number: workplace.building_number,
        flat_number: workplace.flat_number ?? "",
        city: workplace.city,
      })
    }
  }, [open, workplace, form])

  const handleSave = (data: EditWorkplaceFormValues) => {
    startSavingTransition(async () => {
      const result = await editWorkplace({ ...workplace, ...data } as workplace)

      if (result?.error) {
        toast.error(result.error)
        return
      }

      toast.success("Zapisano zmiany miejsca pracy.")
      setOpen(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <Pencil />
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edytuj miejsce pracy</DialogTitle>
          <DialogDescription>
            Zaktualizuj dane lokalizacji, w której prowadzisz treningi.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)}>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nazwa miejsca</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ulica</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-between">
                <FormField
                  control={form.control}
                  name="building_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nr budynku</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <span className="mt-6 px-2">/</span>

                <FormField
                  control={form.control}
                  name="flat_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nr lokalu (opcjonalne)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Miasto</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
