"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"

import { addWorkplace } from "@/actions/profile"
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
  createWorkplaceSchema,
  type CreateWorkplaceFormValues,
} from "@/lib/validations"

export default function AddWorkplaceDialog() {
  const [open, setOpen] = React.useState(false)
  const [isSaving, startSavingTransition] = React.useTransition()
  const form = useForm<CreateWorkplaceFormValues>({
    resolver: zodResolver(createWorkplaceSchema),
    defaultValues: {
      name: "",
      street: "",
      building_number: "",
      flat_number: "",
      city: "",
    },
    mode: "onChange",
  })

  React.useEffect(() => {
    if (!open) {
      form.reset()
    }
  }, [open, form])

  const handleSave = (data: CreateWorkplaceFormValues) => {
    startSavingTransition(async () => {
      const result = await addWorkplace(data)

      if (result?.error) {
        toast.error(result.error)
        return
      }

      toast.success("Dodano nowe miejsce pracy.")
      setOpen(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="mr-1" size="xs" title="Dodaj nowe miejsce">
          <Plus />
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dodaj miejsce pracy</DialogTitle>
          <DialogDescription>
            Uzupełnij dane nowej lokalizacji, w której prowadzisz treningi.
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
                    <FormLabel>Nazwa miejsca*</FormLabel>
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
                    <FormLabel>Ulica*</FormLabel>
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
                      <FormLabel>Nr budynku*</FormLabel>
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
                    <FormLabel>Miasto*</FormLabel>
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
                {isSaving ? <Loader2 className="animate-spin" /> : "Dodaj"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
