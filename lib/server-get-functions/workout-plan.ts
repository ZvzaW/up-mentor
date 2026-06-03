import { prisma } from "@/lib/prisma"
import type { WorkoutPlanFromDb, WorkoutPlanItem } from "@/lib/types"

const formatPlans = (plans: WorkoutPlanFromDb[]): WorkoutPlanItem[] => {
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
          video_url: set.exercise.video_url ?? null,
        },
      })),
    })),
  }))
}


export async function getWorkoutPlans(userId: string, role: string) {
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
            some: { trainee_id: userId },
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
  } catch (error) {
    console.error(
      "[GET_WORKOUT_PLANS_ERROR]:",
      new Date().toLocaleString("pl-PL"),
      error
    )
    return { error: "Nie udało się pobrać planów. Spróbuj odświeżyć stronę." }
  }
}


export async function getWorkoutPlanById(userId: string, planId: string) {
  try {
    const plan = await prisma.workout_plan.findFirst({
      where: {
        id: planId,
        trainer_id: userId,
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
  } catch (error) {
    console.error(
      "[GET_WORKOUT_PLAN_BY_ID_ERROR]:",
      new Date().toLocaleString("pl-PL"),
      error
    )
    return { error: "Nie udało się pobrać planu. Spróbuj odświeżyć stronę." }
  }
}
