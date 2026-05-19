"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export type ExerciseSetInput = {
  id?: string
  exercise_id: string
  series_count: number
  reps_count: number
  weight?: number | null
  order: number
}

export type SectionInput = {
  id?: string
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

export type WorkoutPlanDetails = {
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

export type WorkoutPlanListItem = {
  id: string
  name: string
  difficulty: string | null
  description: string | null
  plans_library?: {
    trainee: {
      user: {
        name: string | null
        surname: string | null
      } | null
    } | null
  }[]
  trainer?: {
    user: {
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

type FormattedExerciseSet = {
  id: string
  order: number
  series_count: number
  reps_count: number
  weight: unknown
  exercise: {
    name: string
    video_url: string | null
  }
}

type FormattedSection = {
  id: string
  body_part: string | null
  order: number
  exercise_set: FormattedExerciseSet[]
}

type FormattedPlan = {
  id: string
  name: string
  difficulty: string | null
  description: string | null
  plans_library?: WorkoutPlanListItem["plans_library"]
  trainer?: WorkoutPlanListItem["trainer"]
  section: FormattedSection[]
}

const formatPlans = <T extends FormattedPlan>(
  plans: T[]
): WorkoutPlanListItem[] => {
  return plans.map((plan) => ({
    id: plan.id,
    name: plan.name,
    difficulty: plan.difficulty,
    description: plan.description,
    plans_library: plan.plans_library,
    trainer: plan.trainer,
    section: plan.section.map((section) => ({
      id: section.id,
      body_part: section.body_part,
      order: section.order,
      exercise_set: section.exercise_set.map((set) => ({
        id: set.id,
        order: set.order,
        series_count: set.series_count,
        reps_count: set.reps_count,
        weight: set.weight == null ? null : Number(set.weight),
        exercise: {
          name: set.exercise.name,
          video_url: set.exercise.video_url,
        },
      })),
    })),
  }))
}


export async function getWorkoutPlans(){
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  const role = session.user.role

  try {
    if (role === "trainer") {
      const plans = await prisma.workout_plan.findMany({
        where: { trainer_id: session.user.id },
        include: {
          plans_library: {
            include: {
              trainee: {
                include: {
                  user: {
                    select: {
                      name: true,
                      surname: true,
                    },
                  },
                },
              },
            },
          },
          section: {
            include: { exercise_set: { include: { exercise: true } } },
          },
        },
        orderBy: { name: "asc" },
      })

      return { data: formatPlans(plans) }

    } else if (role === "trainee") {

      const plans = await prisma.workout_plan.findMany({
        where: {
          plans_library: {
            some: { trainee_id: session.user.id },
          },
        },
        include: {
          trainer: {
            include: {
              user: {
                select: {
                  name: true,
                  surname: true,
                },
              },
            },
          },
          section: {
            include: { exercise_set: { include: { exercise: true } } },
          },
        },
        orderBy: { name: "asc" },
      })
      return { data: formatPlans(plans) }
    }

    return { error: "Nieprawidłowa rola" }
  } catch {
    return { error: "Nie udało się pobrać planów. Spróbuj odświeżyć stronę." }
  }
}

export async function getWorkoutPlanById(
  planId: string
){
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== "trainer") 
    return { error: "Brak uprawnień do tej operacji." }

  try {
    const plan = await prisma.workout_plan.findFirst({
      where: {
        id: planId,
        trainer_id: session.user.id,
      },
      include: {
        section: {
          orderBy: { order: "asc" },
          include: {
            exercise_set: {
              orderBy: { order: "asc" },
              include: { exercise: true },
            },
          },
        },
      },
    })

    if (!plan) {
      return { error: "Nie znaleziono planu." }
    }

    return {
      data: {
        id: plan.id,
        name: plan.name,
        difficulty: plan.difficulty,
        description: plan.description,
        section: plan.section.map((sec) => ({
          id: sec.id,
          body_part: sec.body_part,
          order: sec.order,
          exercise_set: sec.exercise_set.map((set) => ({
            id: set.id,
            exercise_id: set.exercise_id,
            series_count: set.series_count,
            reps_count: set.reps_count,
            weight: set.weight == null ? null : Number(set.weight),
            order: set.order,
          })),
        })),
      },
    }
  } catch {
    return { error: "Nie udało się pobrać planu. Spróbuj odświeżyć stronę." }
  }
}

export async function createWorkoutPlan(data: WorkoutPlanInput) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== "trainer") 
    return { error: "Brak uprawnień do tej operacji." }

  try {
    const newPlan = await prisma.workout_plan.create({
      data: {
        trainer_id: session.user.id,
        name: data.name,
        difficulty: data.difficulty,
        description: data.description,
        section: {
          create: data.sections.map((sec) => ({
            body_part: sec.body_part,
            order: sec.order,
            exercise_set: {
              create: sec.exercise_sets.map((set) => ({
                exercise_id: set.exercise_id,
                series_count: set.series_count,
                reps_count: set.reps_count,
                weight: set.weight,
                order: set.order,
              })),
            },
          })),
        },
      },
    })

    revalidatePath("/dashboard/workouts")
    return { data: newPlan }
  } catch {
    return { error: "Wystąpił błąd podczas zapisywania planu. Spróbuj ponownie." }
  }
}

export async function updateWorkoutPlan(
  planId: string,
  data: WorkoutPlanInput
) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== "trainer") 
    return { error: "Brak uprawnień do tej operacji." }

  try {
    const existingPlan = await prisma.workout_plan.findFirst({
      where: {
        id: planId,
        trainer_id: session.user.id,
      },
      select: { id: true },
    })

    if (!existingPlan) {
      return { error: "Nie znaleziono planu." }
    }

    await prisma.$transaction(async (tx) => {
      await tx.workout_plan.update({
        where: { id: planId },
        data: {
          name: data.name,
          difficulty: data.difficulty,
          description: data.description,
        },
      })

      const sectionIds = data.sections
        .map((sec) => sec.id)
        .filter((id): id is string => Boolean(id))

      await tx.section.deleteMany({
        where: {
          workout_plan_id: planId,
          ...(sectionIds.length > 0 ? { id: { notIn: sectionIds } } : {}),
        },
      })

      for (const sec of data.sections) {
        let section: { id: string }

        if (sec.id) {
          const updatedSection = await tx.section.updateMany({
            where: {
              id: sec.id,
              workout_plan_id: planId,
            },
            data: {
              body_part: sec.body_part,
              order: sec.order,
            },
          })

          if (updatedSection.count === 0) {
            throw new Error("Nie znaleziono sekcji do edycji.")
          }

          section = { id: sec.id }
        } else {
          section = await tx.section.create({
            data: {
              workout_plan_id: planId,
              body_part: sec.body_part,
              order: sec.order,
            },
            select: { id: true },
          })
        }

        const exerciseSetIds = sec.exercise_sets
          .map((set) => set.id)
          .filter((id): id is string => Boolean(id))

        await tx.exercise_set.deleteMany({
          where: {
            section_id: section.id,
            ...(exerciseSetIds.length > 0
              ? { id: { notIn: exerciseSetIds } }
              : {}),
          },
        })

        for (const set of sec.exercise_sets) {
          if (set.id) {
            const updatedSet = await tx.exercise_set.updateMany({
              where: {
                id: set.id,
                section_id: section.id,
              },
              data: {
                exercise_id: set.exercise_id,
                series_count: set.series_count,
                reps_count: set.reps_count,
                weight: set.weight,
                order: set.order,
              },
            })

            if (updatedSet.count === 0) {
              throw new Error("Nie znaleziono ćwiczenia do edycji.")
            }
          } else {
            await tx.exercise_set.create({
              data: {
                section_id: section.id,
                exercise_id: set.exercise_id,
                series_count: set.series_count,
                reps_count: set.reps_count,
                weight: set.weight,
                order: set.order,
              },
            })
          }
        }
      }
    })

    revalidatePath("/dashboard/workout-plans")
    revalidatePath(`/dashboard/workout-plans/edit/${planId}`)
    return { success: true }
  } catch {
    return { error: "Wystąpił błąd podczas aktualizacji planu. Spróbuj ponownie." }
  }
}

export async function cloneWorkoutPlan(planId: string) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== "trainer") 
    return { error: "Brak uprawnień do tej operacji." }

  try {
    const existingPlan = await prisma.workout_plan.findUnique({
      where: { id: planId },
      include: {
        section: {
          include: { exercise_set: true },
        },
      },
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
          create: existingPlan.section.map((sec) => ({
            body_part: sec.body_part,
            order: sec.order,
            exercise_set: {
              create: sec.exercise_set.map((set) => ({
                exercise_id: set.exercise_id,
                series_count: set.series_count,
                reps_count: set.reps_count,
                weight: set.weight,
                order: set.order,
              })),
            },
          })),
        },
      },
    })

    revalidatePath("/dashboard/workouts")
    return { success: true }
  } catch {
    return { error: "Wystąpił błąd podczas klonowania planu. Spróbuj ponownie." }
  }
}

export async function deleteWorkoutPlan(planId: string) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== "trainer") 
    return { error: "Brak uprawnień do tej operacji." }

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
    return { error: "Wystąpił błąd podczas usuwania planu. Spróbuj ponownie." }
  }
}

export async function assignPlanToTrainee(planId: string, traineeId: string) {
  const session = await auth()
    if (!session?.user?.id) {
      redirect("/?unauthorized=true")
    }
  
  if (session.user.role !== "trainer") 
    return { error: "Brak uprawnień do tej operacji." }

  try {
    const assignment = await prisma.plans_library.create({
      data: {
        workout_plan_id: planId,
        trainee_id: traineeId,
      },
    })

    revalidatePath("/dashboard/workouts")
    return { success: true, data: assignment }
  } catch (error: any) {
    if(error.code === "P2002") {
      return { error: "Ten plan jest już przypisany do wybranego podopiecznego." }
    }
    return { error: "Wystąpił błąd podczas przypisywania planu do podopiecznego. Spróbuj ponownie." }
  }
}
