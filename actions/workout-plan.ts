"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export type ExerciseSetInput = {
  exercise_id: string
  series_count: number
  reps_count: number
  weight?: number | null
  order: number
}

export type SectionInput = {
  name?: string | null
  body_part?: string | null
  order: number
  exercise_sets: ExerciseSetInput[]
}

export type WorkoutPlanInput = {
  name: string
  difficulty?: string | null
  description?: string | null
  sections: SectionInput[]
}


const formatPlans = (plans: any[]) => {
  return plans.map((plan) => ({
    ...plan,
    section: plan.section.map((sec: any) => ({
      ...sec,
      exercise_set: sec.exercise_set.map((set: any) => ({
        ...set,
        weight: set.weight ? Number(set.weight) : null, 
      })),
    })),
  }))
}

export async function getWorkoutPlans() {
  const session = await auth()
  if (!session?.user) return { error: "Brak autoryzacji" }

  const userId = session.user.id
  const role = session.user.role

  try {
    if (role === "trainer") {

      const plans = await prisma.workout_plan.findMany({
        where: { trainer_id: userId },
        include: {
          plans_library: {
            include: {
              trainee: {
                include: {
                  user: {
                    select: {
                      name: true,
                      surname: true
                    }
                  }
                }
              }
            }
          },
          section: {
            include: { exercise_set: { include: { exercise: true } } }
          }
        },
        orderBy: { name: "asc" }
      })
      return { data: formatPlans(plans) }
    } else if (role === "trainee") {

      const plans = await prisma.workout_plan.findMany({
        where: {
          plans_library: {
            some: { trainee_id: userId }
          }
        },
        include: {
          trainer: {
            include: {
              user: {
                select: {
                  name: true,
                  surname: true
                }
              }
            }
          },
          section: {
            include: { exercise_set: { include: { exercise: true } } }
          }
        },
        orderBy: { name: "asc" }
      })
      return { data: formatPlans(plans) }
    }
    return { error: "Nieprawidłowa rola" }
  } catch (error) {
    return { error: "Wystąpił błąd podczas pobierania planów." }
  }
}

export async function createWorkoutPlan(data: WorkoutPlanInput) {
  const session = await auth()
  if (session?.user?.role !== "trainer") return { error: "Brak uprawnień" }

  try {
    const newPlan = await prisma.workout_plan.create({
      data: {
        trainer_id: session.user.id,
        name: data.name,
        difficulty: data.difficulty,
        description: data.description,
        section: {
          create: data.sections.map((sec) => ({
            name: sec.name,
            body_part: sec.body_part,
            order: sec.order,
            exercise_set: {
              create: sec.exercise_sets.map((set) => ({
                exercise_id: set.exercise_id,
                series_count: set.series_count,
                reps_count: set.reps_count,
                weight: set.weight,
                order: set.order
              }))
            }
          }))
        }
      }
    })
    
    revalidatePath("/dashboard/workouts")
    return { data: newPlan }
  } catch (error) {
    return { error: "Błąd podczas tworzenia planu treningowego." }
  }
}

export async function cloneWorkoutPlan(planId: string) {
  const session = await auth()
  if (session?.user?.role !== "trainer") return { error: "Brak uprawnień" }

  try {
    const existingPlan = await prisma.workout_plan.findUnique({
      where: { id: planId },
      include: {
        section: {
          include: { exercise_set: true }
        }
      }
    })

    if (!existingPlan || existingPlan.trainer_id !== session.user.id) {
      return { error: "Nie znaleziono planu." }
    }

    await prisma.workout_plan.create({
      data: {
        trainer_id: existingPlan.trainer_id,
        name: `${existingPlan.name} (Kopia)`,
        difficulty: existingPlan.difficulty,
        description: existingPlan.description,
        section: {
          create: existingPlan.section.map(sec => ({
            name: sec.name,
            body_part: sec.body_part,
            order: sec.order,
            exercise_set: {
              create: sec.exercise_set.map(set => ({
                exercise_id: set.exercise_id,
                series_count: set.series_count,
                reps_count: set.reps_count,
                weight: set.weight,
                order: set.order
              }))
            }
          }))
        }
      }
    })

    revalidatePath("/dashboard/workouts")
    return { success: true }
  } catch (error) {
    return { error: "Błąd podczas klonowania planu." }
  }
}

export async function deleteWorkoutPlan(planId: string) {
  const session = await auth()
  if (session?.user?.role !== "trainer") return { error: "Brak uprawnień" }

  try {
    const existingPlan = await prisma.workout_plan.findUnique({
      where: { id: planId },
    })

    if (!existingPlan || existingPlan.trainer_id !== session.user.id) {
      return { error: "Nie znaleziono planu." }
    }

    await prisma.workout_plan.delete({ where: { id: planId } })

    revalidatePath("/dashboard/workout-plans")
    return { success: true }
  } catch {
    return { error: "Błąd podczas usuwania planu treningowego." }
  }
}

export async function assignPlanToTrainee(planId: string, traineeId: string) {
  const session = await auth()
  if (session?.user?.role !== "trainer") return { error: "Brak uprawnień" }

  try {

    const assignment = await prisma.plans_library.create({
      data: {
        workout_plan_id: planId,
        trainee_id: traineeId
      }
    })
    
    revalidatePath("/dashboard/workouts")
    return { success: true, data: assignment }
  } catch (error) {

    return { error: "Ten plan jest już przypisany do wybranego podopiecznego." }
  }
}