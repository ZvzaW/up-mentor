import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Star } from "lucide-react"
import {
  TrainerOpinionsList,
  type TrainerReview,
} from "@/components/common/trainer-opinions-list"

type ShowOpinionsDialogProps = {
  reviews: TrainerReview[]
  averageRate: number | null
  error?: string | null
}

export function ShowOpinionsDialog({
  reviews,
  averageRate,
  error,
}: ShowOpinionsDialogProps) {
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
        <TrainerOpinionsList
          reviews={reviews}
          averageRate={averageRate}
          error={error}
        />
      </DialogContent>
    </Dialog>
  )
}
