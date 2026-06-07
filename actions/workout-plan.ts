"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { toDownloadFile } from "@/lib/workout-plan-pdf"
import { WorkoutPlanPayload, WorkoutPlanPayloadSchema } from "@/lib/validations"
import { cooperation_status, Prisma, user_role } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

async function validateExercisesAccess(
  trainerId: string,
  exerciseIds: string[]
) {
  if (exerciseIds.length === 0) {
    return {}
  }

  const uniqueIds = [...new Set(exerciseIds)]
  const visibleCount = await prisma.exercise.count({
    where: {
      id: { in: uniqueIds },
      OR: [{ trainer_id: null }, { trainer_id: trainerId }],
    },
  })

  if (visibleCount !== uniqueIds.length) {
    return { error: "Wybrano niedostępne dla Ciebie ćwiczenia." }
  }

  return {}
}

export async function createWorkoutPlan(data: unknown) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== user_role.trainer)
    return { error: "Brak uprawnień do tej operacji." }

  const validated = WorkoutPlanPayloadSchema.safeParse(data)
  if (!validated.success) {
    return { error: "Nieprawidłowe dane wejściowe." }
  }

  const planData = validated.data
  const exerciseIds = planData.sections.flatMap((sec) =>
    sec.exercise_sets.map((set) => set.exercise_id)
  )
  const exerciseValidation = await validateExercisesAccess(
    session.user.id,
    exerciseIds
  )
  if (exerciseValidation.error) {
    return { error: exerciseValidation.error }
  }

  try {
    await prisma.workout_plan.create({
      data: {
        trainer_id: session.user.id,
        name: planData.name,
        difficulty: planData.difficulty,
        description: planData.description,
        section: {
          create: planData.sections.map((sec) => ({
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
    return { success: true }
  } catch (error) {
    console.error(
      "[CREATE_WORKOUT_PLAN_ERROR]:",
      new Date().toLocaleString("pl-PL"),
      error
    )
    return {
      error: "Wystąpił błąd podczas zapisywania planu. Spróbuj ponownie.",
    }
  }
}

export async function updateWorkoutPlan(
  planId: string,
  data: WorkoutPlanPayload
) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== user_role.trainer)
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
      return { error: "Nie znaleziono planu do zaktualizowania." }
    }

    const validated = WorkoutPlanPayloadSchema.safeParse(data)
    if (!validated.success) {
      return { error: "Nieprawidłowe dane wejściowe." }
    }

    const planData = validated.data
    const exerciseIds = planData.sections.flatMap((sec) =>
      sec.exercise_sets.map((set) => set.exercise_id)
    )
    const exerciseValidation = await validateExercisesAccess(
      session.user.id,
      exerciseIds
    )
    if (exerciseValidation.error) {
      return { error: exerciseValidation.error }
    }

    await prisma.$transaction(async (tx) => {
      await tx.workout_plan.update({
        where: { id: planId },
        data: {
          name: planData.name,
          difficulty: planData.difficulty,
          description: planData.description,
        },
      })

      const sectionIds = planData.sections
        .map((sec) => sec.id)
        .filter((id): id is string => Boolean(id))

      await tx.section.deleteMany({
        where: {
          workout_plan_id: planId,
          ...(sectionIds.length > 0 ? { id: { notIn: sectionIds } } : {}),
        },
      })

      for (const sec of planData.sections) {
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
    console.error(
      "[UPDATE_WORKOUT_PLAN_ERROR]:",
      new Date().toLocaleString("pl-PL"),
      error
    )
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

  if (session.user.role !== user_role.trainer)
    return { error: "Brak uprawnień do tej operacji." }

  try {
    const existingPlan = await prisma.workout_plan.findUnique({
      where: {
        id: planId,
        trainer_id: session.user.id,
      },
      include: {
        section: {
          include: { exercise_set: true },
        },
      },
    })

    if (!existingPlan) {
      return { error: "Nie znaleziono planu do sklonowania." }
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
    console.error(
      "[CLONE_WORKOUT_PLAN_ERROR]:",
      new Date().toLocaleString("pl-PL"),
      error
    )
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

  if (session.user.role !== user_role.trainer)
    return { error: "Brak uprawnień do tej operacji." }

  try {
    const existingPlan = await prisma.workout_plan.findUnique({
      where: {
        id: planId,
        trainer_id: session.user.id,
      },
      select: { id: true },
    })

    if (!existingPlan) {
      return { error: "Nie znaleziono planu do usunięcia." }
    }

    await prisma.workout_plan.delete({ where: { id: planId } })

    revalidatePath("/dashboard/workout-plans")
    return { success: true }
  } catch (error) {
    console.error(
      "[DELETE_WORKOUT_PLAN_ERROR]:",
      new Date().toLocaleString("pl-PL"),
      error
    )
    return { error: "Wystąpił błąd podczas usuwania planu. Spróbuj ponownie." }
  }
}

export async function generateWorkoutPlanPdf(planId: string) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== user_role.trainer && session.user.role !== user_role.trainee) {
    return { error: "Brak uprawnień do tej operacji." }
  }

  try {
    const plan = await prisma.workout_plan.findFirst({
      where: {
        id: planId,
        ...(session.user.role === user_role.trainer
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

    if (session.user.role === user_role.trainer) {
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
    console.error(
      "[GENERATE_WORKOUT_PLAN_PDF_ERROR]:",
      new Date().toLocaleString("pl-PL"),
      error
    )
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

    if (session.user.role !== user_role.trainer)
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
      return { error: "Nie znaleziono planu do przypisania." }
    }

    const activeCooperation = await prisma.cooperation.findFirst({
      where: {
        trainer_id: session.user.id,
        trainee_id: traineeId,
        status: cooperation_status.active,
      },
      select: { trainee_id: true },
    })

    if (!activeCooperation) {
      return {
        error: "Brak aktywnej współpracy z wybranym podopiecznym.",
      }
    }

    await prisma.plans_library.create({
      data: {
        workout_plan_id: planId,
        trainee_id: traineeId,
      },
    })

    revalidatePath("/dashboard/workout-plans")
    return { success: true }
  } catch (error) {
    console.error(
      "[ASSIGN_PLAN_TO_TRAINEE_ERROR]:",
      new Date().toLocaleString("pl-PL"),
      error
    )
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
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
