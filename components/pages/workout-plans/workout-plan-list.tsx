"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cloneWorkoutPlan, assignPlanToTrainee, deleteWorkoutPlan } from "@/actions/workout-plan"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, ChevronUp, Copy, UserPlus, Dumbbell, Pencil, Trash2, Settings } from "lucide-react"
import { toast } from "sonner"

interface WorkoutPlanListProps {
  plans: any[]
  role: string
}

export function WorkoutPlanList({ plans, role }: WorkoutPlanListProps) {
  const router = useRouter()
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null)
  const [assigningPlanId, setAssigningPlanId] = useState<string | null>(null)
  const [traineeIdInput, setTraineeIdInput] = useState("")
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

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
    if (!traineeIdInput.trim()) return
    setLoadingId(`assign-${planId}`)

    const result = await assignPlanToTrainee(planId, traineeIdInput)
    setLoadingId(null)

    if (result.error) {
        toast.error(result.error)
    } else {
        toast.success( "Plan został pomyślnie udostępniony podopiecznemu!")

      setAssigningPlanId(null)
      setTraineeIdInput("")
    }
  }

  if (plans.length === 0) {
    return (
      <Card className="text-center p-14">
        <CardContent>
          <p className="text-zinc-500">Brak dostępnych planów treningowych w bazie.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"} className={message.type === "success" ? "border-green-500 bg-green-50/50" : ""}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {plans.map((plan) => {
        const isExpanded = expandedPlanId === plan.id
        const isAssigning = assigningPlanId === plan.id

        return (
          <Card key={plan.id} className="overflow-hidden py-6">
            <CardHeader >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-4 mb-4">
                    <CardTitle className="text-lg font-semibold text-gold ">{plan.name}</CardTitle>
                    {plan.difficulty && (
                      <span className="text-xs px-2 pb-0.5 pt-1 mb-1 rounded-full border border-zinc-400 text-zinc-400">
                        {plan.difficulty}
                      </span>
                    )}
                  </div>
                  {plan.description && (
                    <CardDescription className="max-w-2xl">{plan.description}</CardDescription>
                  )}
                  
                  {/* Informacje o relacjach zależnie od roli */}
                  <div className="text-xs text-muted-foreground pt-1">
                    {role === "trainer" ? (
                      <div>
                        Udostępniono dla:{" "}
                        {plan.plans_library?.length > 0 ? (
                          <span className="text-foreground">
                            {plan.plans_library.map((p: any) => `${p.trainee?.user?.name} ${p.trainee?.user?.surname}`).join(", ")}
                          </span>
                        ) : (
                          <span className="italic">Brak przypisanych podopiecznych</span>
                        )}
                      </div>
                    ) : (
                      <div>
                        Trener prowadzący: <span className="text-foreground">{plan.trainer?.user?.name} {plan.trainer?.user?.surname}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Przyciski Akcji */}
                <div className="flex flex-wrap items-center gap-2 sm:self-start justify-center">
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
                      <DropdownMenuContent align="end" className="bg-dark-navy w-48">
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/dashboard/workout-plans/${plan.id}/edit`}
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
                          {loadingId === `clone-${plan.id}` ? "Klonowanie..." : "Klonuj plan"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setAssigningPlanId(isAssigning ? null : plan.id)}
                          className="gap-2"
                        >
                          <UserPlus className="h-4 w-4" />
                          Dystrybucja
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          disabled={loadingId !== null}
                          onClick={() => handleDelete(plan.id)}
                          className="gap-2 text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          {loadingId === `delete-${plan.id}` ? "Usuwanie..." : "Usuń plan"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => toggleExpand(plan.id)}
                  >
                    {isExpanded ? (<>Schowaj <ChevronUp className="h-5 w-5 mr-1" /> </>) : (<>Pokaż <ChevronDown className="h-5 w-5" /></>)}
                  </Button>
                </div>
              </div>

              {/* Panel przypisywania planu (Dystrybucja) */}
              {isAssigning && (
                <div className="mt-4 p-3 border rounded-lg bg-muted/40 space-y-3">
                  <p className="text-xs font-medium text-muted-foreground">Podaj identyfikator UUID podopiecznego, aby dodać plan do jego biblioteki:</p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Wklej UUID podopiecznego..."
                      value={traineeIdInput}
                      onChange={(e) => setTraineeIdInput(e.target.value)}
                      className="h-9 max-w-sm"
                    />
                    <Button
                      size="sm"
                      disabled={loadingId === `assign-${plan.id}`}
                      onClick={() => handleAssign(plan.id)}
                    >
                      {loadingId === `assign-${plan.id}` ? "Zapisywanie..." : "Zatwierdź"}
                    </Button>
                  </div>
                </div>
              )}
            </CardHeader>

            {/* Rozwijana zawartość strukturalna planu (Sekcje i Ćwiczenia) */}
            {isExpanded && (
              <CardContent className="border-t  pt-6 space-y-5">
                {plan.section && plan.section.length > 0 ? (
                  plan.section
                    .sort((a: any, b: any) => a.order - b.order)
                    .map((sec: any) => (
                      <div key={sec.id} className="rounded-lg bg-dark-navy p-4 pb-0">
                        <div className="flex items-center justify-between border-b border-baby-blue pb-2 ">
                          <h3 className="font-semibold  flex items-center gap-2 text-baby-blue">
                            {sec.name || `Sekcja ${sec.order}`}
                          </h3>
                          {sec.body_part && (
                            <span className="text-xs font-bold text-dirty-navy uppercase bg-hover px-2 pb-0.5 pt-1 rounded-full mb-1">
                              Partia: {sec.body_part}
                            </span>
                          )}
                        </div>

                        {/* Zestaw ćwiczeń w danej sekcji */}
                        <div className="divide-y">
                          {sec.exercise_set && sec.exercise_set.length > 0 ? (
                            sec.exercise_set
                              .sort((a: any, b: any) => a.order - b.order)
                              .map((set: any) => (
                                <div key={set.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-sm py-5">
                                  <span className=" flex items-start gap-2 text-zinc-200">
                                    <span className="border-baby-blue text-baby-blue  flex h-5 w-5 items-center justify-center rounded-full pt-1 border text-xs">
                                      {set.order}
                                    </span>
                                    {set.exercise.name}
                                    {set.exercise.url}
                                  </span>
                                  <div className="flex gap-4 text-zinc-400 text-xs mt-4 sm:mt-0">
                                    <span>Serie: <strong className="text-gold">{set.series_count}</strong></span>
                                    <span>Powtórzenia: <strong className="text-gold">{set.reps_count}</strong></span>
                                    {set.weight && (
                                      <span>Obciążenie: <strong className="text-gold">{set.weight} kg</strong></span>
                                    )}
                                  </div>
                                </div>
                              ))
                          ) : (
                            <p className="text-xs text-muted-foreground italic py-2">Brak ćwiczeń przypisanych do tej sekcji.</p>
                          )}
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="text-sm text-muted-foreground italic text-center py-4">Ten plan nie zawiera jeszcze żadnych sekcji treningowych.</p>
                )}
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}