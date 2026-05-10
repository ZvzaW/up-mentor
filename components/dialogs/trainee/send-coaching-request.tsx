"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { sendCoachingRequest } from "@/actions/coaching-request";
import { CoachingRequestInput, coachingRequestSchema } from "@/lib/validations";


type Workplace = {
  id: string;
  name: string;
  city: string;
  street: string;
  building_number: string;
  flat_number: string | null;

};

type SendCoachingRequestDialogProps = {
  trainerId: string;
  workplaces: Workplace[];
};

export function SendCoachingRequestDialog({ trainerId, workplaces }: SendCoachingRequestDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<CoachingRequestInput>({
    resolver: zodResolver(coachingRequestSchema),
    defaultValues: {
      trainer_id: trainerId,
      workplace_id: "",
      message: "",
    },
  });

  const onSubmit = (data: CoachingRequestInput) => {
    startTransition(async () => {
      const result = await sendCoachingRequest(data);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Prośba o współpracę została wysłana!");
      setOpen(false);
      form.reset();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button >
          <Send/>
          Poproś o współpracę
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Wyślij prośbę o współpracę</DialogTitle>
          <DialogDescription>
            Wybierz miejsce, w którym chciałbyś trenować, i opcjonalnie zostaw wiadomość dla trenera.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="workplace_id"
              render={({ field }) => (
                <FormItem >
                  <FormLabel>Miejsce treningów</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Wybierz miejsce pracy trenera" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {workplaces.map((workplace) => (
                        <SelectItem key={workplace.id} value={workplace.id}>
                          {workplace.name} - ul. {workplace.street} {workplace.building_number}{workplace.flat_number ?`/${workplace.flat_number}` : ""}, {workplace.city}
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
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Wiadomość do trenera (opcjonalna)</FormLabel>
                  <FormControl>
                    <textarea
                      {...field}
                      value={field.value ?? ""}
                      placeholder="Napisz kilka słów o swoim celu, doświadczeniu itp."
                      className="custom-scrollbar flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-baby-blue resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="button" variant="destructive" onClick={() => setOpen(false)} disabled={isPending}>
                Anuluj
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                Wyślij
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}