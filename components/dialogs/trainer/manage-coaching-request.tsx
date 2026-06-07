"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Check, X, Loader2, Inbox, MapPin } from "lucide-react"
import { format } from "date-fns"
import { pl } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { acceptRequest, rejectRequest } from "@/actions/coaching-request"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RequestDTO } from "@/lib/types"

export function ManageCoachingRequestsDialog({
  requests,
  error,
}: {
  requests: RequestDTO[]
  error: string | undefined
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleAccept = (traineeId: string) => {
    setLoadingId(traineeId)
    startTransition(async () => {
      const result = await acceptRequest(traineeId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Zaakceptowano nową współpracę!")
        if (requests.length === 1) setOpen(false)
      }
      setLoadingId(null)
    })
  }

  const handleReject = (traineeId: string) => {
    if (!confirm("Czy na pewno chcesz odrzucić tę prośbę?")) return

    setLoadingId(traineeId)
    startTransition(async () => {
      const result = await rejectRequest(traineeId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Prośba została odrzucona.")
        if (requests.length === 1) setOpen(false)
      }
      setLoadingId(null)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="font-michroma relative flex w-[210px] gap-2 text-xs">
          <Inbox />
          Prośby o współpracę
          {requests.length > 0 && (
            <span className="bg-gold border-baby-blue absolute -top-3 -right-2 flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] font-bold">
              {requests.length}
            </span>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[90vh] flex-col">
        <DialogHeader>
          <DialogTitle className="text-baby-blue font-michroma">
            Oczekujące prośby
          </DialogTitle>
        </DialogHeader>

        {error ? (
          <Alert variant="destructive" className="mx-auto my-12">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <div className="custom-scrollbar space-y-4 overflow-y-auto pr-2">
            {requests.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-zinc-400">
                <Inbox size={40} className="opacity-20" />
                <p className="text-sm">Brak nowych próśb o współpracę.</p>
              </div>
            ) : (
              requests.map((req) => {
                const isCurrentLoading =
                  isPending && loadingId === req.traineeId

                return (
                  <div
                    key={req.traineeId}
                    className="bg-dirty-blue border-baby-blue space-y-3 rounded-xl border p-4"
                  >
                    <p className="text-gold font-michroma mb-1 text-sm">
                      {req.name}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {format(new Date(req.createdAt), "d MMMM yyyy, HH:mm", {
                        locale: pl,
                      })}
                    </p>

                    <div className="flex items-center gap-2">
                      <MapPin size={15} className="text-baby-blue" />
                      <span className="text-sm">{req.workplace}</span>
                    </div>

                    {req.message && (
                      <div className="bg-dirty-navy/50 rounded-md p-3 text-xs break-words text-zinc-300 italic">
                        „{req.message}”
                      </div>
                    )}

                    <div className="flex justify-center gap-2 pt-1">
                      <Button
                        size="sm"
                        className="border border-red-400 bg-red-400/20 text-red-400 hover:bg-red-400/40"
                        onClick={() => handleReject(req.traineeId)}
                        disabled={isPending}
                      >
                        {isCurrentLoading ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <X />
                        )}
                        Odrzuć
                      </Button>

                      <Button
                        size="sm"
                        className="border border-emerald-500 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/40"
                        onClick={() => handleAccept(req.traineeId)}
                        disabled={isPending}
                      >
                        {isCurrentLoading ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <Check />
                        )}
                        Akceptuj
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
