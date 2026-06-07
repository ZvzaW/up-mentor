"use client"

import * as React from "react"
import { ExternalLink } from "lucide-react"

import { EditExerciseDialog } from "@/components/dialogs/trainer/edit-exercise"
import { DeleteExerciseButton } from "@/components/pages/exercises/delete-exercise"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EXERCISE_BODY_PARTS } from "@/lib/types"
import { exercise, user_role } from "@prisma/client"

type OriginFilter = "all" | "predefined" | "author"

type ExerciseListProps = {
  exercises: exercise[]
  role: user_role
}

function exerciseSourceLabel(ex: exercise, role: user_role) {
  if (ex.trainer_id === null) return "Baza"
  return role === user_role.trainer ? "Twoje" : "Trenera"
}

export function ExerciseList({ exercises, role }: ExerciseListProps) {
  const [nameQuery, setNameQuery] = React.useState("")
  const [bodyPart, setBodyPart] = React.useState("")
  const [origin, setOrigin] = React.useState<OriginFilter>("all")
  const filtered = React.useMemo(() => {
    const q = nameQuery.trim().toLowerCase()
    return exercises.filter((ex) => {
      if (q && !ex.name.toLowerCase().includes(q)) {
        return false
      }
      if (bodyPart && ex.body_part !== bodyPart) {
        return false
      }
      if (origin === "predefined" && ex.trainer_id !== null) {
        return false
      }
      if (origin === "author" && ex.trainer_id === null) {
        return false
      }
      return true
    })
  }, [exercises, nameQuery, bodyPart, origin])

  const hasActiveFilters =
    nameQuery.trim().length > 0 || bodyPart.length > 0 || origin !== "all"

  return (
    <>
      <Card>
        <CardContent>
          <div className="mb-8 flex flex-col items-center gap-4 sm:flex-row">
            <div className="w-full">
              <Label htmlFor="name">Nazwa</Label>
              <Input
                id="name"
                value={nameQuery}
                onChange={(e) => setNameQuery(e.target.value)}
                placeholder="Filtruj po nazwie…"
                className="rounded-full border placeholder:text-xs placeholder:text-zinc-400"
              />
            </div>

            <div className="w-full">
              <Label htmlFor="body">Partia ciała</Label>
              <Select
                value={bodyPart || "all"}
                onValueChange={(value) =>
                  setBodyPart(value === "all" ? "" : value)
                }
              >
                <SelectTrigger
                  id="body"
                  className="border-baby-blue h-10 w-full rounded-full"
                >
                  <SelectValue placeholder="Wszystkie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie</SelectItem>
                  {EXERCISE_BODY_PARTS.map((part) => (
                    <SelectItem key={part} value={part}>
                      {part}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full">
              <Label htmlFor="source">Źródło</Label>
              <Select
                value={origin}
                onValueChange={(value) => setOrigin(value as OriginFilter)}
              >
                <SelectTrigger
                  id="source"
                  className="border-baby-blue h-10 w-full rounded-full"
                >
                  <SelectValue placeholder="Wszystkie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie</SelectItem>
                  <SelectItem value="predefined">
                    Baza (predefiniowane)
                  </SelectItem>
                  <SelectItem value="author">Autorskie</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <Button
                type="button"
                className="bg-gold hover:bg-gold/60"
                onClick={() => {
                  setNameQuery("")
                  setBodyPart("")
                  setOrigin("all")
                }}
              >
                Wyczyść filtry
              </Button>
            )}
          </div>

          {exercises.length === 0 && (
            <p className="py-10 text-center text-zinc-400">
              Brak ćwiczeń w bazie.
            </p>
          )}

          {exercises.length > 0 && filtered.length === 0 && (
            <p className="py-10 text-center text-zinc-400">
              Brak ćwiczeń spełniających kryteria.
            </p>
          )}

          {filtered.length > 0 && (
            <ul className="grid grid-cols-1 gap-4">
              {filtered.map((ex) => (
                <li key={ex.id}>
                  <div className="bg-dirty-blue flex h-full flex-col gap-3 rounded-xl p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <h2 className="text-gold text-md font-bold break-words">
                            {ex.name}
                          </h2>
                          <span className="border-baby-blue/40 shrink-0 rounded-full border px-2 pt-1 pb-0.5 text-xs text-zinc-300">
                            {exerciseSourceLabel(ex, role)}
                          </span>
                        </div>

                        <div className="space-y-3">
                          <p className="text-baby-blue text-sm">
                            Partia ciała:{" "}
                            <span className="text-zinc-200">
                              {ex.body_part}
                            </span>
                          </p>

                          {ex.video_url && (
                            <a
                              href={ex.video_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-baby-blue hover:text-baby-blue/60 inline-flex gap-2 text-sm hover:underline"
                            >
                              <ExternalLink className="size-4 shrink-0" />
                              Materiał instruktażowy
                            </a>
                          )}
                        </div>
                      </div>
                      {role === user_role.trainer && ex.trainer_id !== null && (
                        <div className="my-auto flex shrink-0 flex-col gap-0.5">
                          <EditExerciseDialog exercise={ex} />
                          <DeleteExerciseButton exerciseId={ex.id} />
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  )
}
