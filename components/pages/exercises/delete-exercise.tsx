"use client"

import { useTransition } from "react"
import { Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { deleteTrainerExercise } from "@/actions/exercise"
import { Button } from "@/components/ui/button"

export function DeleteExerciseButton({ exerciseId }: { exerciseId: string }) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    if (!confirm("Czy na pewno chcesz usunąć to ćwiczenie?")) return

    startTransition(async () => {
      const result = await deleteTrainerExercise(exerciseId)

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success("Usunięto ćwiczenie.")
    })
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={handleDelete}
      disabled={isPending}
      title="Usuń ćwiczenie"
      aria-label="Usuń ćwiczenie"
    >
      {isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Trash2 className="size-4" />
      )}
    </Button>
  )
}
