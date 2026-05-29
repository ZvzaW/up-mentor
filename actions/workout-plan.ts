"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { toDownloadFile } from "@/lib/workout-plan-pdf"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import type {
  WorkoutPlanFromDb,
  WorkoutPlanInput,
  WorkoutPlanItem,
} from "@/lib/types"


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

export async function getWorkoutPlans() {
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
  } catch (error) {
    console.error("[GET_WORKOUT_PLANS_ERROR]:", new Date().toLocaleString("pl-PL"), error)
    return { error: "Nie udało się pobrać planów. Spróbuj odświeżyć stronę." }
  }
}

export async function getWorkoutPlanById(planId: string) {
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
  } catch (error) {
    console.error("[GET_WORKOUT_PLAN_BY_ID_ERROR]:", new Date().toLocaleString("pl-PL"), error)
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

    revalidatePath("/dashboard/workout-plans")
    return { data: newPlan }
  } catch (error) {
    console.error("[CREATE_WORKOUT_PLAN_ERROR]:", new Date().toLocaleString("pl-PL"), error)
    return {
      error: "Wystąpił błąd podczas zapisywania planu. Spróbuj ponownie.",
    }
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
  } catch (error) {
    console.error("[UPDATE_WORKOUT_PLAN_ERROR]:", new Date().toLocaleString("pl-PL"), error)
    return {
      error: "Wystąpił błąd podczas aktualizacji planu. Spróbuj ponownie.",
    }
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

    revalidatePath("/dashboard/workout-plans")
    return { success: true }
  } catch (error) {
    console.error("[CLONE_WORKOUT_PLAN_ERROR]:", new Date().toLocaleString("pl-PL"), error)
    return {
      error: "Wystąpił błąd podczas klonowania planu. Spróbuj ponownie.",
    }
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
  } catch (error) {
    console.error("[DELETE_WORKOUT_PLAN_ERROR]:", new Date().toLocaleString("pl-PL"), error)
    return { error: "Wystąpił błąd podczas usuwania planu. Spróbuj ponownie." }
  }
}

export async function generateWorkoutPlanPdf(planId: string) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== "trainer" && session.user.role !== "trainee") {
    return { error: "Brak uprawnień do tej operacji." }
  }

  try {
    const plan = await prisma.workout_plan.findFirst({
      where: {
        id: planId,
        ...(session.user.role === "trainer"
          ? { trainer_id: session.user.id }
          : {
              plans_library: {
                some: { trainee_id: session.user.id },
              },
            }),
      },
      include: {
        section: {
          orderBy: { order: "asc" },
          include: {
            exercise_set: {
              orderBy: { order: "asc" },
              include: {
                exercise: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
    })

    if (!plan) {
      return { error: "Nie znaleziono planu lub brak dostępu." }
    }

    if (session.user.role === "trainer") {
      const assignmentCount = await prisma.plans_library.count({
        where: { workout_plan_id: planId },
      })

      if (assignmentCount === 0) {
        return { error: "Plan nie został jeszcze udostępniony podopiecznemu." }
      }
    }

    const file = await toDownloadFile(plan)

    return { success: true as const, data: file }
  } catch (error) {
    console.error("[GENERATE_WORKOUT_PLAN_PDF_ERROR]:", new Date().toLocaleString("pl-PL"), error)
    return {
      error: "Nie udało się wygenerować pliku PDF. Spróbuj ponownie.",
    }
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

    revalidatePath("/dashboard/workout-plans")
    return { success: true, data: assignment }
  } catch (error: any) {
    console.error("[ASSIGN_PLAN_TO_TRAINEE_ERROR]:", new Date().toLocaleString("pl-PL"), error)
    if (error.code === "P2002") {
      return {
        error: "Ten plan jest już przypisany do wybranego podopiecznego.",
      }
    }
    return {
      error:
        "Wystąpił błąd podczas przypisywania planu do podopiecznego. Spróbuj ponownie.",
    }
  }
}
