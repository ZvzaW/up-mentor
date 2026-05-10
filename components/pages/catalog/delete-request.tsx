"use client"

import { useTransition } from "react"
import { deleteCoachingRequest } from "@/actions/coaching-request"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

export function DeleteCoachingRequestButton({
  trainerId,
}: {
  trainerId: string
}) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    if (!confirm("Czy na pewno chcesz wycofać prośbę o współpracę?")) return

    startTransition(async () => {
      const result = await deleteCoachingRequest(trainerId)

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success("Prośba została wycofana.")
    })
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleDelete}
      disabled={isPending}
      className="mx-auto w-fit gap-2 text-xs"
    >
      {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
      Wycofaj prośbę
    </Button>
  )
}
