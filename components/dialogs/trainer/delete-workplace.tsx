"use client"

import * as React from "react"
import { Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { deleteWorkplace } from "@/actions/profile"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface DeleteWorkplaceDialogProps {
  workplaceId: string
  workplaceName: string
}

export default function DeleteWorkplaceDialog({
  workplaceId,
  workplaceName,
}: DeleteWorkplaceDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [isDeleting, startDeletingTransition] = React.useTransition()

  const handleDelete = () => {
    startDeletingTransition(async () => {
      const result = await deleteWorkplace(workplaceId)

      if (result?.error) {
        toast.error(result.error)
        return
      }

      toast.success("Miejsce pracy zostało usunięte.")
      setOpen(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <Trash2 />
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Usuń miejsce pracy</DialogTitle>
        </DialogHeader>
        <p className="text-center text-zinc-400">
          Czy na pewno chcesz usunąć miejsce{" "}
          <span className="font-semibold">{workplaceName}</span>? Tej operacji
          nie można cofnąć.
        </p>
        <DialogFooter>
          <Button
            variant="destructive"
            onClick={() => setOpen(false)}
            disabled={isDeleting}
          >
            Anuluj
          </Button>
          <Button
            className="bg-gold hover:bg-gold/60"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? <Loader2 className="animate-spin" /> : "Usuń"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
