"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { finishCooperation } from "@/actions/cooperation"
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

type FinishCooperationDialogProps = {
  partnerId: string
  children: React.ReactNode
}

export function FinishCooperationDialog({
  partnerId,
  children,
}: FinishCooperationDialogProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [isPending, startTransition] = React.useTransition()
  const [isDownloading, startDownloadTransition] = React.useTransition()

  const handleFinish = () => {
    startTransition(async () => {
      const result = await finishCooperation(partnerId)
      if (result?.error) {
        toast.error(result.error)
        return
      }

      toast.success("Współpraca została rozwiązana.")
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rozwiązanie współpracy</DialogTitle>

          <p className="text-gold mt-3 text-sm">
            Czy na pewno chcesz zakończyć współpracę?
          </p>
          <DialogDescription className=" ">
            Utracisz dostęp do danych tej strony współpracy. Natomiast zachowasz
            zanonimizowaną historię treningów. Jeśli zostały udostępnione
            podopiecznemu plany treningowe w systemie, otrzyma je na mail'a w
            formie pdf.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-0">
          <Button
            type="button"
            variant="destructive"
            onClick={() => setOpen(false)}
            disabled={isPending || isDownloading}
          >
            Anuluj
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleFinish}
            disabled={isPending || isDownloading}
          >
            {isPending ? <Loader2 className="animate-spin" /> : "Rozwiąż"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
