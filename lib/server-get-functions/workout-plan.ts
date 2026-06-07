import { prisma } from "@/lib/prisma"
import type { WorkoutPlanFromDb, WorkoutPlanItem } from "@/lib/types"
import { user_role } from "@prisma/client"
import { getLogger } from "@/lib/server-logger"

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

export async function getWorkoutPlans(userId: string, role: user_role) {
  const logger = await getLogger()

  logger.info({ userId, role }, "Fetching workout plans")

  try {
    if (role === user_role.trainer) {
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

      logger.info({ userId, role }, "Workout plans fetched successfully")
      return { data: formatPlans(plans) }
    } else if (role === user_role.trainee) {
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

      logger.info({ userId, role }, "Workout plans fetched successfully")
      return { data: formatPlans(plans) }
    }

    return { error: "Nieprawidłowa rola" }
  } catch {
    logger.error({ userId, role }, "Error fetching workout plans")
    return { error: "Nie udało się pobrać planów. Spróbuj odświeżyć stronę." }
  }
}

export async function getWorkoutPlanById(userId: string, planId: string) {
  const logger = await getLogger()

  logger.info({ userId, planId }, "Fetching workout plan by id")

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

    logger.info({ userId, planId }, "Workout plan fetched by id successfully")

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
    logger.error({ userId, planId }, "Error fetching workout plan by id")
    return { error: "Nie udało się pobrać planu. Spróbuj odświeżyć stronę." }
  }
}
