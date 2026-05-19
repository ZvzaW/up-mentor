"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  useFieldArray,
  useForm,
  useFormContext,
  type UseFormReturn,
} from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  createWorkoutPlan,
  updateWorkoutPlan,
  WorkoutPlanInput,
} from "@/actions/workout-plan"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Trash2, Dumbbell, GripVertical, Loader2 } from "lucide-react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { toast } from "sonner"
import {
  workoutPlanFormSchema,
  type WorkoutPlanFormValues,
} from "@/lib/validations"
import { Alert, AlertDescription } from "@/components/ui/alert"

type WorkoutPlanFormExercise = {
  id: string
  name: string
  body_part: string
}

interface WorkoutPlanFormProps {
  exercises: WorkoutPlanFormExercise[]
  initialPlan?: WorkoutPlanFormInitialData
}

type WorkoutPlanFormInitialData = {
  id: string
  name: string
  difficulty: string | null
  description: string | null
  section: {
    id: string
    body_part: string | null
    order: number
    exercise_set: {
      id: string
      exercise_id: string
      series_count: number
      reps_count: number
      weight: number | null
      order: number
    }[]
  }[]
}

function buildDefaultValues(
  initialPlan?: WorkoutPlanFormInitialData
): WorkoutPlanFormValues {
  return {
    name: initialPlan?.name ?? "",
    difficulty: initialPlan?.difficulty ?? "",
    description: initialPlan?.description ?? "",
    sections: initialPlan
      ? initialPlan.section
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((sec) => ({
            id: sec.id,
            uid: sec.id,
            body_part: sec.body_part ?? "",
            order: sec.order,
            exercise_sets: sec.exercise_set
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((set) => ({
                id: set.id,
                uid: set.id,
                exercise_id: set.exercise_id,
                series_count: set.series_count,
                reps_count: set.reps_count,
                weight: set.weight,
                order: set.order,
              })),
          }))
      : [],
  }
}

function mapToWorkoutPlanInput(data: WorkoutPlanFormValues): WorkoutPlanInput {
  return {
    name: data.name,
    difficulty: data.difficulty || null,
    description: data.description || null,
    sections: data.sections.map((sec) => ({
      id: sec.id,
      body_part: sec.body_part || null,
      order: sec.order,
      exercise_sets: sec.exercise_sets.map((set) => ({
        id: set.id,
        exercise_id: set.exercise_id,
        series_count: set.series_count,
        reps_count: set.reps_count,
        weight: set.weight,
        order: set.order,
      })),
    })),
  }
}

function reorderSectionOrders(form: UseFormReturn<WorkoutPlanFormValues>) {
  const sections = form.getValues("sections")
  sections.forEach((_, idx) => {
    form.setValue(`sections.${idx}.order`, idx + 1)
  })
}

function SortableExerciseSet({
  sectionIndex,
  exerciseIndex,
  exerciseUid,
  exercises,
  onRemove,
}: {
  sectionIndex: number
  exerciseIndex: number
  exerciseUid: string
  exercises: WorkoutPlanFormExercise[]
  onRemove: () => void
}) {
  const form = useFormContext<WorkoutPlanFormValues>()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: exerciseUid })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  }

  const baseName =
    `sections.${sectionIndex}.exercise_sets.${exerciseIndex}` as const

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-dark-navy relative flex w-full flex-col rounded-md border p-3 pt-1 ${isDragging ? "ring-primary opacity-50 ring-2" : ""}`}
    >
      <div className="mb-1 flex items-center justify-between">
        <div
          {...attributes}
          {...listeners}
          className="text-muted-foreground hover:text-foreground cursor-grab"
        >
          <GripVertical className="h-4 w-4" />
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:gap-4">
        <FormField
          control={form.control}
          name={`${baseName}.exercise_id`}
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel className="text-xs uppercase mb-0.5">
                Ćwiczenie
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="border-baby-blue/80 w-full">
                    <SelectValue placeholder="Wybierz ćwiczenie..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {exercises.map((ex) => (
                    <SelectItem key={ex.id} value={ex.id}>
                      <div className="flex w-full items-baseline gap-4">
                        <span className="text-gold">{ex.name}</span>
                        <span className="text-muted-foreground text-xs">-</span>
                        <span className="text-muted-foreground text-xs">
                          {ex.body_part}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`${baseName}.series_count`}
          render={({ field }) => (
            <FormItem className="sm:w-[20%]">
              <FormLabel className=" text-xs uppercase mb-0.5">
                Serie
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  value={field.value}
                  onChange={(e) =>
                    field.onChange(parseInt(e.target.value, 10) || 1)
                  }

                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`${baseName}.reps_count`}
          render={({ field }) => (
            <FormItem className="sm:w-[20%]">
              <FormLabel className="text-xs uppercase mb-0.5">
                Powtórzenia
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  value={field.value}
                  onChange={(e) =>
                    field.onChange(parseInt(e.target.value, 10) || 1)
                  }
                  
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`${baseName}.weight`}
          render={({ field }) => (
            <FormItem className="sm:w-[20%]">
              <FormLabel className="text-xs uppercase mb-0.5">
                Ciężar (kg)
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.25"
                  min={0}
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value ? parseFloat(e.target.value) : null
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}

function SortableSection({
  sectionIndex,
  sectionUid,
  exercises,
  onRemoveSection,
}: {
  sectionIndex: number
  sectionUid: string
  exercises: WorkoutPlanFormExercise[]
  onRemoveSection: () => void
}) {
  const form = useFormContext<WorkoutPlanFormValues>()
  const sectionOrder = form.watch(`sections.${sectionIndex}.order`)

  const {
    fields: exerciseFields,
    append: appendExercise,
    remove: removeExercise,
    move: moveExercise,
  } = useFieldArray({
    control: form.control,
    name: `sections.${sectionIndex}.exercise_sets`,
    keyName: "uid",
  })

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sectionUid })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleExerciseDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = exerciseFields.findIndex((f) => f.uid === active.id)
    const newIndex = exerciseFields.findIndex((f) => f.uid === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    moveExercise(oldIndex, newIndex)
    const sets = form.getValues(`sections.${sectionIndex}.exercise_sets`)
    sets.forEach((_, idx) => {
      form.setValue(
        `sections.${sectionIndex}.exercise_sets.${idx}.order`,
        idx + 1
      )
    })
  }

  const handleAddExercise = () => {
    if (exercises.length === 0) return
    appendExercise({
      uid: crypto.randomUUID(),
      exercise_id: exercises[0].id,
      series_count: 3,
      reps_count: 10,
      weight: null,
      order: exerciseFields.length + 1,
    })
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`border-l-gold relative border-l-4 ${isDragging ? "ring-gold opacity-50 ring-2" : ""}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="text-muted-foreground hover:text-foreground absolute top-4 left-2 cursor-grab p-1"
      >
        <GripVertical className="h-5 w-5" />
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemoveSection}
        className="text-destructive hover:text-destructive absolute top-3 right-3"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <CardHeader>
        <div className="flex flex-col justify-center ">
          <p className="text-gold mx-auto mb-6 text-lg font-semibold">
            Sekcja {sectionOrder}
          </p>
          <FormField
            control={form.control}
            name={`sections.${sectionIndex}.body_part`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Partia ciała (opcjonalnie)
                </FormLabel>
                <FormControl>
                  <Input {...field} placeholder="np. Góra ciała" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-3 border-t pt-4">
        <div className="py-3">
          <h4 className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold uppercase">
            <Dumbbell className="h-4 w-4" /> Ćwiczenia w tej sekcji
          </h4>
        </div>

        {exerciseFields.length === 0 ? (
          <p className="text-muted-foreground py-2 text-center text-xs italic">
            Brak dodanych ćwiczeń do tej sekcji.
          </p>
        ) : (
          <DndContext
            id={`dnd-context-exercises-${sectionIndex}`}
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleExerciseDragEnd}
          >
            <SortableContext
              items={exerciseFields.map((s) => s.uid)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {exerciseFields.map((field, eIndex) => (
                  <SortableExerciseSet
                    key={field.uid}
                    sectionIndex={sectionIndex}
                    exerciseIndex={eIndex}
                    exerciseUid={field.uid}
                    exercises={exercises}
                    onRemove={() => {
                      removeExercise(eIndex)
                      const sets = form.getValues(
                        `sections.${sectionIndex}.exercise_sets`
                      )
                      sets.forEach((_, idx) => {
                        form.setValue(
                          `sections.${sectionIndex}.exercise_sets.${idx}.order`,
                          idx + 1
                        )
                      })
                    }}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        <div className="flex justify-center">
          <Button
            type="button"
            onClick={handleAddExercise}
            disabled={exercises.length === 0}
            className="bg-gold hover:bg-gold/60 mt-3 gap-1"
          >
            <Plus className="h-4 w-4" /> Dodaj ćwiczenie
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function WorkoutPlanForm({
  exercises,
  initialPlan,
}: WorkoutPlanFormProps) {
  const router = useRouter()
  const [isSubmitting, startSubmitTransition] = useTransition()

  const form = useForm<WorkoutPlanFormValues>({
    resolver: zodResolver(workoutPlanFormSchema),
    defaultValues: buildDefaultValues(initialPlan),
    mode: "onChange",
  })

  const {
    fields: sectionFields,
    append: appendSection,
    remove: removeSection,
    move: moveSection,
  } = useFieldArray({
    control: form.control,
    name: "sections",
    keyName: "uid",
  })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const sectionsError = form.formState.errors.sections?.message

  const handleSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = sectionFields.findIndex((s) => s.uid === active.id)
    const newIndex = sectionFields.findIndex((s) => s.uid === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    moveSection(oldIndex, newIndex)
    reorderSectionOrders(form)
  }

  const handleAddSection = () => {
    appendSection({
      uid: crypto.randomUUID(),
      body_part: "",
      order: sectionFields.length + 1,
      exercise_sets: [],
    })
  }

  const handleRemoveSection = (index: number) => {
    removeSection(index)
    reorderSectionOrders(form)
  }

  const onSubmit = (data: WorkoutPlanFormValues) => {
    startSubmitTransition(async () => {
      const payload = mapToWorkoutPlanInput(data)
      const res = initialPlan
        ? await updateWorkoutPlan(initialPlan.id, payload)
        : await createWorkoutPlan(payload)

      if (res.error) {
        toast.error(res.error)
        return
      }

      toast.success(
        initialPlan ? "Plan został zaktualizowany." : "Plan został zapisany."
      )
      router.push("/dashboard/workout-plans")
      router.refresh()
    })
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, () => {
          toast.error("Popraw błędy w formularzu przed zapisem.")
        })}
        className="mx-auto space-y-6 pb-12"
      >
        <Card>
          <CardContent className="w-full space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>
                      Nazwa planu*
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="np. Push/Pull/Legs" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>
                      Poziom zaawansowania (opcjonalnie)
                    </FormLabel>
                    <Select
                      onValueChange={(value) =>
                        field.onChange(value === "none" ? "" : value)
                      }
                      value={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger className="border-baby-blue/80 w-full">
                          <SelectValue placeholder="Wybierz poziom..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Wybierz poziom...</SelectItem>
                        <SelectItem value="Początkujący">
                          Początkujący
                        </SelectItem>
                        <SelectItem value="Średniozaawansowany">
                          Średniozaawansowany
                        </SelectItem>
                        <SelectItem value="Zaawansowany">
                          Zaawansowany
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Opis planu (opcjonalnie)
                  </FormLabel>
                  <FormControl>
                    <textarea
                      {...field}
                      placeholder="Założenia makrocyklu..."
                      rows={3}
                      className="ring-baby-blue/80 focus-visible:ring-baby-blue/80 w-full rounded-md p-3 text-sm ring focus-visible:ring-1 focus-visible:outline-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <div className="border-gold border-t pt-6">
            <h2 className="flex justify-center text-lg font-semibold">
              Struktura planu treningowego
            </h2>
          </div>

          {sectionFields.length === 0 ? (
            <div className="bg-muted/20 text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
              Brak sekcji w planie.
            </div>
          ) : (
            <DndContext
              id="dnd-context-sections"
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleSectionDragEnd}
            >
              <SortableContext
                items={sectionFields.map((s) => s.uid)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-7">
                  {sectionFields.map((field, sIndex) => (
                    <SortableSection
                      key={field.uid}
                      sectionIndex={sIndex}
                      sectionUid={field.uid}
                      exercises={exercises}
                      onRemoveSection={() => handleRemoveSection(sIndex)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

{sectionsError && (
            <Alert variant="destructive" className="mx-auto">
              <AlertDescription>{sectionsError}</AlertDescription>
            </Alert>  
          )}
          
          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={handleAddSection}
              className="bg-dark-navy/80 gap-1"
            >
              <Plus className="h-4 w-4" /> Dodaj sekcję
            </Button>
          </div>
        </div>

        <div className="border-gold flex items-center justify-center gap-6 border-t pt-6">
          <Button
            variant="destructive"
            type="button"
            disabled={isSubmitting}
            onClick={() => router.push("/dashboard/workout-plans")}
          >
            Anuluj
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : "Zapisz"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
