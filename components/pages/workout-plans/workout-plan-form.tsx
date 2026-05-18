"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createWorkoutPlan, WorkoutPlanInput } from "@/actions/workout-plan"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Trash2, ArrowLeft, Save, Dumbbell, Calendar, Layers, GripVertical } from "lucide-react"
import Link from "next/link"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'


type FormExerciseSet = {
  uid: string
  exercise_id: string
  series_count: number
  reps_count: number
  weight: number | null
  order: number
}

type FormSection = {
  uid: string
  name: string
  body_part: string
  order: number
  exercise_sets: FormExerciseSet[]
}

interface WorkoutPlanFormProps {
  exercises: any[]
}

// --- SUB-KOMPONENT: Sortowalne Ćwiczenie ---
function SortableExerciseSet({ 
  set, eIndex, exercises, updateField, removeSet 
}: { 
  set: FormExerciseSet, eIndex: number, exercises: any[], updateField: (f: keyof FormExerciseSet, v: any) => void, removeSet: () => void 
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: set.uid })
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : 1 }

  return (
    <div ref={setNodeRef} style={style} className={`grid grid-cols-1 sm:grid-cols-12 gap-2 bg-card p-3 border rounded-md shadow-sm items-end relative pr-10 ${isDragging ? "opacity-50 ring-2 ring-primary" : ""}`}>

      <div {...attributes} {...listeners} className="absolute left-1 top-1/2 -translate-y-1/2 p-1 cursor-grab text-muted-foreground hover:text-foreground">
        <GripVertical className="h-4 w-4" />
      </div>


      <div className="sm:col-span-5 space-y-1 pl-6">
        <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Nazwa ćwiczenia</label>
        <select
          value={set.exercise_id}
          onChange={(e) => updateField("exercise_id", e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2"
        >
          {exercises.map((ex) => (
            <option key={ex.id} value={ex.id}>{ex.name} ({ex.body_part})</option>
          ))}
        </select>
      </div>

      <div className="sm:col-span-2 space-y-1">
        <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Serie</label>
        <Input type="number" min={1} value={set.series_count} onChange={(e) => updateField("series_count", parseInt(e.target.value) || 1)} className="h-9 text-xs font-mono" />
      </div>

      <div className="sm:col-span-2 space-y-1">
        <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Powt.</label>
        <Input type="number" min={1} value={set.reps_count} onChange={(e) => updateField("reps_count", parseInt(e.target.value) || 1)} className="h-9 text-xs font-mono" />
      </div>

      <div className="sm:col-span-3 space-y-1">
        <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Ciężar (kg)</label>
        <Input type="number" step="0.25" min={0} placeholder="Masa własna" value={set.weight || ""} onChange={(e) => updateField("weight", e.target.value ? parseFloat(e.target.value) : null)} className="h-9 text-xs font-mono" />
      </div>

      <Button type="button" variant="ghost" size="icon" onClick={removeSet} className="absolute right-1 bottom-1 h-7 w-7 text-muted-foreground hover:text-destructive">
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}

// --- SUB-KOMPONENT: Sortowalna Sekcja ---
function SortableSection({ 
  section, sIndex, exercises, updateSection, removeSection, addExerciseSet, updateExerciseSet, removeExerciseSet, handleExerciseDragEnd 
}: { 
  section: FormSection, sIndex: number, exercises: any[], updateSection: (f: keyof FormSection, v: any) => void, removeSection: () => void, addExerciseSet: () => void, updateExerciseSet: (eIndex: number, f: keyof FormExerciseSet, v: any) => void, removeExerciseSet: (eIndex: number) => void, handleExerciseDragEnd: (event: DragEndEvent, sIndex: number) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.uid })
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : 1 }


  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  return (
    <Card ref={setNodeRef} style={style} className={`border-l-4 border-l-primary relative ${isDragging ? "opacity-50 ring-2 ring-primary" : ""}`}>

      <div {...attributes} {...listeners} className="absolute left-2 top-4 p-1 cursor-grab text-muted-foreground hover:text-foreground">
        <GripVertical className="h-5 w-5" />
      </div>

      <Button type="button" variant="ghost" size="icon" onClick={removeSection} className="absolute top-3 right-3 text-muted-foreground hover:text-destructive">
        <Trash2 className="h-4 w-4" />
      </Button>

      <CardHeader className="pb-3 pr-12 pl-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Nazwa sekcji (np. Dzień A)</label>
            <Input placeholder={`Dzień ${section.order}`} value={section.name} onChange={(e) => updateSection("name", e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Partia ciała</label>
            <Input placeholder="np. Góra ciała" value={section.body_part} onChange={(e) => updateSection("body_part", e.target.value)} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="bg-muted/10 border-t pt-4 space-y-3">
        <div className="flex items-center justify-between pl-6">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Dumbbell className="h-3.5 w-3.5" /> Ćwiczenia w tej sekcji
          </h4>
          <Button type="button" variant="link" size="sm" onClick={addExerciseSet} disabled={exercises.length === 0} className="p-0 h-auto text-xs">
            + Dodaj ćwiczenie
          </Button>
        </div>

        {section.exercise_sets.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-2 text-center">Brak dodanych ćwiczeń do tego dnia.</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleExerciseDragEnd(e, sIndex)}>
            <SortableContext items={section.exercise_sets.map(s => s.uid)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2 pl-6">
                {section.exercise_sets.map((set, eIndex) => (
                  <SortableExerciseSet 
                    key={set.uid} 
                    set={set} 
                    eIndex={eIndex} 
                    exercises={exercises}
                    updateField={(field, value) => updateExerciseSet(eIndex, field, value)}
                    removeSet={() => removeExerciseSet(eIndex)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>
    </Card>
  )
}

// --- GŁÓWNY KOMPONENT: Kreator ---
export function WorkoutPlanForm({ exercises }: WorkoutPlanFormProps) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [difficulty, setDifficulty] = useState("")
  const [description, setDescription] = useState("")
  const [sections, setSections] = useState<FormSection[]>([])
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)


  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

 
  const generateUID = () => Math.random().toString(36).substring(2, 9)

  // --- Logika Sekcji ---
  const addSection = () => {
    const newSection: FormSection = { uid: generateUID(), name: "", body_part: "", order: sections.length + 1, exercise_sets: [] }
    setSections([...sections, newSection])
  }

  const removeSection = (sIndex: number) => {
    const updated = sections.filter((_, idx) => idx !== sIndex).map((sec, i) => ({ ...sec, order: i + 1 }))
    setSections(updated)
  }

  const updateSectionField = (sIndex: number, field: keyof FormSection, value: any) => {
    const updated = [...sections]
    updated[sIndex] = { ...updated[sIndex], [field]: value }
    setSections(updated)
  }

  const handleSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex((i) => i.uid === active.id)
        const newIndex = items.findIndex((i) => i.uid === over.id)
        const reordered = arrayMove(items, oldIndex, newIndex)
        return reordered.map((sec, idx) => ({ ...sec, order: idx + 1 }))
      })
    }
  }

  // --- Logika Ćwiczeń ---
  const addExerciseSet = (sIndex: number) => {
    if (exercises.length === 0) return
    const updated = [...sections]
    const newSet: FormExerciseSet = { uid: generateUID(), exercise_id: exercises[0].id, series_count: 3, reps_count: 10, weight: null, order: updated[sIndex].exercise_sets.length + 1 }
    updated[sIndex].exercise_sets.push(newSet)
    setSections(updated)
  }

  const removeExerciseSet = (sIndex: number, eIndex: number) => {
    const updated = [...sections]
    updated[sIndex].exercise_sets = updated[sIndex].exercise_sets.filter((_, idx) => idx !== eIndex).map((set, i) => ({ ...set, order: i + 1 }))
    setSections(updated)
  }

  const updateExerciseSetField = (sIndex: number, eIndex: number, field: keyof FormExerciseSet, value: any) => {
    const updated = [...sections]
    updated[sIndex].exercise_sets[eIndex] = { ...updated[sIndex].exercise_sets[eIndex], [field]: value }
    setSections(updated)
  }

  const handleExerciseDragEnd = (event: DragEndEvent, sIndex: number) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setSections((items) => {
        const updated = [...items]
        const oldIndex = updated[sIndex].exercise_sets.findIndex((i) => i.uid === active.id)
        const newIndex = updated[sIndex].exercise_sets.findIndex((i) => i.uid === over.id)
        const reordered = arrayMove(updated[sIndex].exercise_sets, oldIndex, newIndex)
        updated[sIndex].exercise_sets = reordered.map((set, idx) => ({ ...set, order: idx + 1 }))
        return updated
      })
    }
  }

  // --- Zapis Formularza ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError("Nazwa planu treningowego jest wymagana.")
      return
    }
    setIsSubmitting(true)
    setError(null)

    const payload: WorkoutPlanInput = {
      name,
      difficulty: difficulty || null,
      description: description || null,
      sections: sections.map(sec => ({
        name: sec.name || null,
        body_part: sec.body_part || null,
        order: sec.order,
        exercise_sets: sec.exercise_sets.map(set => ({
          exercise_id: set.exercise_id,
          series_count: set.series_count,
          reps_count: set.reps_count,
          weight: set.weight,
          order: set.order
        }))
      }))
    }

    const res = await createWorkoutPlan(payload)
    setIsSubmitting(false)

    if (res.error) {
      setError(res.error)
    } else {
      router.push("/dashboard/workout-plans")
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto pb-12">
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Informacje podstawowe
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nazwa Planu *</label>
              <Input placeholder="np. Push/Pull/Legs" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Poziom zaawansowania</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2">
                <option value="">Wybierz poziom...</option>
                <option value="Początkujący">Początkujący</option>
                <option value="Średniozaawansowany">Średniozaawansowany</option>
                <option value="Zaawansowany">Zaawansowany</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Opis planu</label>
            <textarea placeholder="Założenia makrocyklu..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <h2 className="text-lg font-semibold font-michroma flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" /> Struktura dni treningowych
          </h2>
          <Button type="button" variant="outline" size="sm" onClick={addSection} className="gap-1">
            <Plus className="h-4 w-4" /> Dodaj dzień
          </Button>
        </div>

        {sections.length === 0 ? (
          <div className="text-center p-8 border border-dashed rounded-lg bg-muted/20 text-muted-foreground text-sm">
            Brak sekcji w planie.
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
            <SortableContext items={sections.map(s => s.uid)} strategy={verticalListSortingStrategy}>
              <div className="space-y-4">
                {sections.map((sec, sIndex) => (
                  <SortableSection 
                    key={sec.uid} 
                    section={sec} 
                    sIndex={sIndex} 
                    exercises={exercises}
                    updateSection={(field, value) => updateSectionField(sIndex, field, value)}
                    removeSection={() => removeSection(sIndex)}
                    addExerciseSet={() => addExerciseSet(sIndex)}
                    updateExerciseSet={(eIndex, field, value) => updateExerciseSetField(sIndex, eIndex, field, value)}
                    removeExerciseSet={(eIndex) => removeExerciseSet(sIndex, eIndex)}
                    handleExerciseDragEnd={handleExerciseDragEnd}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <div className="flex items-center justify-between border-t pt-4">
        <Button asChild variant="ghost" type="button">
          <Link href="/dashboard/workouts" className="gap-1.5 text-xs"><ArrowLeft className="h-4 w-4" /> Wróć</Link>
        </Button>
        <Button type="submit" disabled={isSubmitting} className="gap-1.5 text-xs px-5">
          <Save className="h-4 w-4" /> {isSubmitting ? "Zapisywanie..." : "Zapisz plan"}
        </Button>
      </div>
    </form>
  )
}