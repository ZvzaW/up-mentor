import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { TrainerOpinionsList } from "@/components/pages/trainer-opinions-list";

export function ShowOpinionsDialog({ trainerId }: { trainerId: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" className="flex gap-2">
          <Star className="size-4" /> Opinie klientów
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-michroma">Opinie klientów</DialogTitle>
        </DialogHeader>
          <TrainerOpinionsList trainerId={trainerId} />
      </DialogContent>
    </Dialog>
  );
}
