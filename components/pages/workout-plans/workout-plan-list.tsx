"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  cloneWorkoutPlan,
  assignPlanToTrainee,
  deleteWorkoutPlan,
} from "@/actions/workout-plan"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  UserPlus,
  Pencil,
  Trash2,
  Settings,
  Search,
} from "lucide-react"
import { toast } from "sonner"
import { TraineeDTO } from "@/lib/types"

const DIFFICULTY_LEVELS = [
  "Początkujący",
  "Średniozaawansowany",
  "Zaawansowany",
] as const

type DifficultyFilter = "all" | (typeof DIFFICULTY_LEVELS)[number] | "none"

type WorkoutPlanListPlan = {
  id: string
  name: string
  difficulty: string | null
  description: string | null
  plans_library?: {
    trainee?: {
      user?: {
        name: string | null
        surname: string | null
      } | null
    } | null
  }[]
  trainer?: {
    user?: {
      name: string | null
      surname: string | null
    } | null
  } | null
  section: {
    id: string
    body_part: string | null
    order: number
    exercise_set: {
      id: string
      order: number
      series_count: number
      reps_count: number
      weight: number | null
      exercise: {
        name: string
        video_url: string | null
      }
    }[]
  }[]
}

interface WorkoutPlanListProps {
  plans: WorkoutPlanListPlan[]
  role: string
  trainees?: TraineeDTO[]
}

export function WorkoutPlanList({
  plans,
  role,
  trainees = [],
}: WorkoutPlanListProps) {
  const router = useRouter()
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null)
  const [assigningPlanId, setAssigningPlanId] = useState<string | null>(null)
  const [selectedTraineeId, setSelectedTraineeId] = useState("")
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [nameQuery, setNameQuery] = useState("")
  const [difficultyFilter, setDifficultyFilter] =
    useState<DifficultyFilter>("all")

  const filteredPlans = useMemo(() => {
    const query = nameQuery.trim().toLowerCase()

    return plans.filter((plan) => {
      if (query && !plan.name.toLowerCase().includes(query)) {
        return false
      }

      if (difficultyFilter === "all") {
        return true
      }

      if (difficultyFilter === "none") {
        return !plan.difficulty
      }

      return plan.difficulty === difficultyFilter
    })
  }, [plans, nameQuery, difficultyFilter])

  const hasActiveFilters =
    nameQuery.trim().length > 0 || difficultyFilter !== "all"

  const toggleExpand = (id: string) => {
    setExpandedPlanId(expandedPlanId === id ? null : id)
  }

  const handleClone = async (id: string) => {
    setLoadingId(`clone-${id}`)
    const result = await cloneWorkoutPlan(id)
    setLoadingId(null)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Plan został pomyślnie sklonowany!")
      router.refresh()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Czy na pewno chcesz usunąć ten plan treningowy?")) return
    setLoadingId(`delete-${id}`)
    const result = await deleteWorkoutPlan(id)
    setLoadingId(null)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Plan został usunięty.")
      if (assigningPlanId === id) setAssigningPlanId(null)
      if (expandedPlanId === id) setExpandedPlanId(null)
      router.refresh()
    }
  }

  const handleAssign = async (planId: string) => {
    if (!selectedTraineeId) return
    setLoadingId(`assign-${planId}`)
    const result = await assignPlanToTrainee(planId, selectedTraineeId)
    setLoadingId(null)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Plan został pomyślnie udostępniony podopiecznemu!")
      setAssigningPlanId(null)
      setSelectedTraineeId("")
    }
  }

  return (
    <div className="space-y-4">
      {plans.length > 0 && (
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="w-full sm:flex-1">
            <Label
              htmlFor="plan-name-search "
              className="text-muted-foreground ml-1"
            >
              Nazwa planu
            </Label>
            <div className="relative">
              <Input
                id="plan-name-search"
                type="text"
                value={nameQuery}
                onChange={(e) => setNameQuery(e.target.value)}
                placeholder="Wyszukaj"
                className="rounded-full pr-10 pl-4 placeholder:text-xs placeholder:text-zinc-400"
              />
              <Search className="absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            </div>
          </div>

          <div className="w-full sm:max-w-xs">
            <Label
              htmlFor="plan-difficulty-filter "
              className="text-muted-foreground ml-1"
            >
              Poziom zaawansowania
            </Label>
            <Select
              value={difficultyFilter}
              onValueChange={(value) =>
                setDifficultyFilter(value as DifficultyFilter)
              }
            >
              <SelectTrigger
                id="plan-difficulty-filter"
                className="border-baby-blue h-10 w-full rounded-full"
              >
                <SelectValue placeholder="Wszystkie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie</SelectItem>
                {DIFFICULTY_LEVELS.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
                <SelectItem value="none">Bez poziomu</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <Button
              type="button"
              className="bg-gold hover:bg-gold/60 mx-auto w-fit"
              onClick={() => {
                setNameQuery("")
                setDifficultyFilter("all")
              }}
            >
              Wyczyść filtry
            </Button>
          )}
        </div>
      )}

      {plans.length === 0 && (
        <Card className="p-14 text-center">
          <CardContent>
            <p className="text-zinc-500">
              Brak dostępnych planów treningowych w bazie.
            </p>
          </CardContent>
        </Card>
      )}

      {plans.length > 0 && filteredPlans.length === 0 && (
        <Card className="p-10 text-center">
          <CardContent>
            <p className="text-zinc-500">
              Nie znaleziono planów spełniających kryteria wyszukiwania.
            </p>
          </CardContent>
        </Card>
      )}

      {filteredPlans.map((plan) => {
        const isExpanded = expandedPlanId === plan.id
        const isAssigning = assigningPlanId === plan.id
        const assignedLibraries = plan.plans_library ?? []

        return (
          <Card key={plan.id} className="w-full overflow-hidden py-6">
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <div className="mb-4 flex flex-col items-center gap-2 sm:flex-row sm:gap-4">
                    <p className="text-gold mx-auto text-lg font-semibold sm:mx-0">
                      {plan.name}
                    </p>
                    {plan.difficulty && (
                      <span className="mb-1 rounded-full border border-zinc-400 px-2 pt-1 pb-0.5 text-xs text-zinc-400">
                        {plan.difficulty}
                      </span>
                    )}
                  </div>

                  <div className="text-muted-foreground mx-auto max-w-full pt-1 text-center text-xs break-words sm:mx-0 sm:text-left">
                    {role === "trainer" ? (
                      <div>
                        Udostępniono dla:{" "}
                        {assignedLibraries.length > 0 ? (
                          <span className="text-foreground">
                            {assignedLibraries
                              .map(
                                (p) =>
                                  `${p.trainee?.user?.name} ${p.trainee?.user?.surname}`
                              )
                              .join(", ")}
                          </span>
                        ) : (
                          <span className="italic">
                            Brak przypisanych podopiecznych
                          </span>
                        )}
                      </div>
                    ) : (
                      <div>
                        Trener prowadzący:{" "}
                        <span className="text-foreground">
                          {plan.trainer?.user?.name}{" "}
                          {plan.trainer?.user?.surname}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/*OPCJE*/}
                <div className="mt-2 flex items-center justify-center gap-2 sm:mt-0 sm:self-start">
                  {role === "trainer" && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={loadingId !== null}
                        >
                          <Settings />
                          Opcje
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="bg-dark-navy w-48"
                      >
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/dashboard/workout-plans/edit/${plan.id}`}
                            className="flex cursor-pointer items-center gap-2"
                          >
                            <Pencil className="h-4 w-4" />
                            Edytuj plan
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={loadingId !== null}
                          onClick={() => handleClone(plan.id)}
                          className="gap-2"
                        >
                          <Copy className="h-4 w-4" />
                          {loadingId === `clone-${plan.id}`
                            ? "Klonowanie..."
                            : "Klonuj plan"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            setAssigningPlanId(isAssigning ? null : plan.id)
                          }
                          className="gap-2"
                        >
                          <UserPlus className="h-4 w-4" />
                          Dystrybucja
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          disabled={loadingId !== null}
                          onClick={() => handleDelete(plan.id)}
                          className="text-destructive focus:text-destructive gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          {loadingId === `delete-${plan.id}`
                            ? "Usuwanie..."
                            : "Usuń plan"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => toggleExpand(plan.id)}
                  >
                    {isExpanded ? (
                      <>
                        Schowaj <ChevronUp />
                      </>
                    ) : (
                      <>
                        Pokaż <ChevronDown />
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* DYSTRYBUCJA */}
              {isAssigning && (
                <div className="bg-dark-navy/50 mt-4 space-y-3 rounded-lg border border-zinc-800 p-4">
                  <p className="text-sm font-medium text-zinc-300">
                    Wybierz podopiecznego z listy, aby dodać plan do jego
                    biblioteki:
                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Select
                      value={selectedTraineeId}
                      onValueChange={setSelectedTraineeId}
                      disabled={trainees.length === 0}
                    >
                      <SelectTrigger className="focus-visible:ring-gold h-10 w-full max-w-sm border-zinc-700 bg-zinc-900">
                        <SelectValue
                          placeholder={
                            trainees.length > 0
                              ? "-- Wybierz podopiecznego --"
                              : "Brak aktywnych podopiecznych"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {trainees.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      className="h-10"
                      disabled={
                        loadingId === `assign-${plan.id}` || !selectedTraineeId
                      }
                      onClick={() => handleAssign(plan.id)}
                    >
                      {loadingId === `assign-${plan.id}`
                        ? "Zapisywanie..."
                        : "Zatwierdź"}
                    </Button>
                  </div>
                </div>
              )}
            </CardHeader>

            {/* STRUKTURA PLANU */}
            {isExpanded && (
              <CardContent className="space-y-5 border-t pt-6">
                {plan.description && (
                  <p className="mx-auto mt-3 mb-8 max-w-full text-center text-sm break-words text-zinc-200 sm:mx-0 sm:text-left">
                    {plan.description}
                  </p>
                )}

                {plan.section && plan.section.length > 0 ? (
                  plan.section
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .map((sec) => (
                      <div
                        key={sec.id}
                        className="bg-dark-navy rounded-lg p-4 pb-0"
                      >
                        <div className="border-baby-blue flex flex-col items-center justify-between border-b pb-2 sm:flex-row">
                          <h3 className="text-baby-blue mb-2 flex max-w-full items-center gap-2 truncate font-semibold sm:mb-0">
                            Sekcja {sec.order}
                          </h3>
                          {sec.body_part && (
                            <span className="text-dirty-navy bg-hover mb-1 rounded-full px-2 pt-1 pb-0.5 text-xs font-bold uppercase">
                              Partia: {sec.body_part}
                            </span>
                          )}
                        </div>

                        {/* ĆWICZENIA */}
                        <div className="divide-y">
                          {sec.exercise_set && sec.exercise_set.length > 0 ? (
                            sec.exercise_set
                              .slice()
                              .sort((a, b) => a.order - b.order)
                              .map((set) => (
                                <div
                                  key={set.id}
                                  className="flex flex-col items-start justify-between py-5 text-sm sm:flex-row sm:items-center"
                                >
                                  <span className="flex items-start gap-2 text-zinc-200">
                                    <span className="border-baby-blue text-baby-blue flex h-5 w-5 items-center justify-center rounded-full border pt-1 text-xs">
                                      {set.order}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5">
                                      {set.exercise.name}
                                      {set.exercise.video_url && (
                                        <Button
                                          asChild
                                          variant="ghost"
                                          size="icon"
                                          className="text-baby-blue hover:text-baby-blue/60 h-6 w-6"
                                        >
                                          <a
                                            href={set.exercise.video_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label={`Otwórz materiał dla ćwiczenia ${set.exercise.name}`}
                                            onClick={(event) =>
                                              event.stopPropagation()
                                            }
                                          >
                                            <ExternalLink className="h-3.5 w-3.5" />
                                          </a>
                                        </Button>
                                      )}
                                    </span>
                                  </span>
                                  <div className="mt-4 flex gap-4 text-xs text-zinc-400 sm:mt-0">
                                    <span>
                                      Serie:{" "}
                                      <strong className="text-gold">
                                        {set.series_count}
                                      </strong>
                                    </span>
                                    <span>
                                      Powtórzenia:{" "}
                                      <strong className="text-gold">
                                        {set.reps_count}
                                      </strong>
                                    </span>
                                    {set.weight && (
                                      <span>
                                        Obciążenie:{" "}
                                        <strong className="text-gold">
                                          {set.weight} kg
                                        </strong>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))
                          ) : (
                            <p className="text-muted-foreground py-2 text-xs italic">
                              Brak ćwiczeń przypisanych do tej sekcji.
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="text-muted-foreground py-4 text-center text-sm italic">
                    Ten plan nie zawiera jeszcze żadnych sekcji treningowych.
                  </p>
                )}
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}
