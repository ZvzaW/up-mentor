"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import {
  finishCooperation,
  getAssignedPlansPdfForDownload,
} from "@/actions/cooperation"
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

  const handleDownloadTestPdfs = () => {
    startDownloadTransition(async () => {
      const result = await getAssignedPlansPdfForDownload(partnerId)

      if (result?.error) {
        toast.error(result.error)
        return
      }

      const files = result.data
      if (!files || files.length === 0) {
        toast.info("Brak przypisanych planów do pobrania.")
        return
      }

      for (const file of files) {
        const binary = atob(file.base64)
        const bytes = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i += 1) {
          bytes[i] = binary.charCodeAt(i)
        }

        const blob = new Blob([bytes], { type: "application/pdf" })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement("a")
        anchor.href = url
        anchor.download = file.filename
        document.body.appendChild(anchor)
        anchor.click()
        anchor.remove()
        URL.revokeObjectURL(url)
      }

      toast.success("Pobrano testowe pliki PDF.")
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rozwiązanie współpracy</DialogTitle>
          
            <p className="text-sm text-gold  mt-3">Czy na pewno chcesz zakończyć współpracę?</p>
          <DialogDescription className="  ">
            
          Utracisz dostęp do danych tej strony współpracy. Natomiast zachowasz zanonimizowaną historię treningów. 
          Jeśli zostały udostępnione podopiecznemu plany treningowe w systemie, otrzyma je na mail'a w formie pdf.

          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-0">
          <Button
            type="button"
            variant="secondary"
            onClick={handleDownloadTestPdfs}
            disabled={isPending || isDownloading}
          >
            {isDownloading ? (
              <Loader2 className="animate-spin" />
            ) : (
              "Pobierz testowe PDF-y"
            )}
          </Button>
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
