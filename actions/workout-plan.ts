"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { toDownloadFile } from "@/lib/workout-plan-pdf"
import { WorkoutPlanPayload, WorkoutPlanPayloadSchema } from "@/lib/validations"
import { cooperation_status, Prisma, user_role } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { getLogger } from "@/lib/server-logger"

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
  const logger = await getLogger()

  const session = await auth()

  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== user_role.trainer)
    return { error: "Brak uprawnień do tej operacji." }

  const userId = session.user.id

  logger.info({ userId }, "Creating workout plan")

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

    logger.info({ userId }, "Workout plan created successfully")
    revalidatePath("/dashboard/workout-plans")
    return { success: true }
  } catch {
    logger.error({ userId }, "Error creating workout plan")
    return {
      error: "Wystąpił błąd podczas zapisywania planu. Spróbuj ponownie.",
    }
  }
}

export async function updateWorkoutPlan(
  planId: string,
  data: WorkoutPlanPayload
) {
  const logger = await getLogger()

  const session = await auth()

  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== user_role.trainer)
    return { error: "Brak uprawnień do tej operacji." }

  const userId = session.user.id

  logger.info({ userId, planId }, "Updating workout plan")

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

    logger.info({ userId, planId }, "Workout plan updated successfully")
    revalidatePath("/dashboard/workout-plans")
    revalidatePath(`/dashboard/workout-plans/edit/${planId}`)
    return { success: true }
  } catch {
    logger.error({ userId, planId }, "Error updating workout plan")
    return {
      error: "Wystąpił błąd podczas aktualizacji planu. Spróbuj ponownie.",
    }
  }
}

export async function cloneWorkoutPlan(planId: string) {
  const logger = await getLogger()

  const session = await auth()

  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== user_role.trainer)
    return { error: "Brak uprawnień do tej operacji." }

  const userId = session.user.id

  logger.info({ userId, planId }, "Cloning workout plan")

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

    logger.info({ userId, planId }, "Workout plan cloned successfully")
    revalidatePath("/dashboard/workout-plans")
    return { success: true }
  } catch {
    logger.error({ userId, planId }, "Error cloning workout plan")
    return {
      error: "Wystąpił błąd podczas klonowania planu. Spróbuj ponownie.",
    }
  }
}

export async function deleteWorkoutPlan(planId: string) {
  const logger = await getLogger()

  const session = await auth()

  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== user_role.trainer)
    return { error: "Brak uprawnień do tej operacji." }

  const userId = session.user.id

  logger.info({ userId, planId }, "Deleting workout plan")

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

    logger.info({ userId, planId }, "Workout plan deleted successfully")
    revalidatePath("/dashboard/workout-plans")
    return { success: true }
  } catch {
    logger.error({ userId, planId }, "Error deleting workout plan")
    return { error: "Wystąpił błąd podczas usuwania planu. Spróbuj ponownie." }
  }
}

export async function generateWorkoutPlanPdf(planId: string) {
  const logger = await getLogger()

  const session = await auth()

  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (
    session.user.role !== user_role.trainer &&
    session.user.role !== user_role.trainee
  ) {
    return { error: "Brak uprawnień do tej operacji." }
  }

  const userId = session.user.id


  try {
    const role = session.user.role 

    logger.info({ userId, planId, role }, "Generating workout plan PDF")

    if (role === user_role.trainer) {
      const ownedPlan = await prisma.workout_plan.findUnique({
        where: { id: planId, trainer_id: session.user.id },
        select: { id: true },
      })

      if (!ownedPlan) {
        logger.warn({ userId, planId, role }, "Workout plan to generate not found")
        return { error: "Nie znaleziono planu lub brak dostępu." }
      }
    } else if (role === user_role.trainee) {
      const assignment = await prisma.plans_library.findFirst({
        where: {
          trainee_id: session.user.id,
          workout_plan_id: planId,
        },
        select: { trainee_id: true },
      })

      if (!assignment) {
        logger.warn({ userId, planId, role }, "Workout plan to generate not found")
        return { error: "Nie znaleziono planu lub brak dostępu." }
      }
    }

    const plan = await prisma.workout_plan.findUnique({
      where: { id: planId },
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

    const file = await toDownloadFile(plan)

    logger.info({ userId, planId, role }, "Workout plan PDF generated successfully")
    return { success: true as const, data: file }
  } catch {
    logger.error({ userId, planId }, "Error generating workout plan PDF")
    return {
      error: "Nie udało się wygenerować pliku PDF. Spróbuj ponownie.",
    }
  }
}

export async function assignPlanToTrainee(planId: string, traineeId: string) {
  const logger = await getLogger()

  const session = await auth()
  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== user_role.trainer)
    return { error: "Brak uprawnień do tej operacji." }

  const userId = session.user.id

  logger.info(
    { userId, planId, traineeId },
    "Assigning workout plan to trainee"
  )

  try {
    const existingPlan = await prisma.workout_plan.findFirst({
      where: {
        id: planId,
        trainer_id: session.user.id,
      },
      select: { id: true },
    })

    if (!existingPlan) {
      logger.warn({ userId, planId }, "Workout plan to assign not found")
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
      logger.warn(
        { userId, planId, traineeId },
        "No active cooperation with the selected trainee"
      )
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

    logger.info(
      { userId, planId, traineeId },
      "Workout plan assigned to trainee successfully"
    )
    revalidatePath("/dashboard/workout-plans")
    return { success: true }
  } catch (error) {
    logger.error(
      { userId, planId, traineeId },
      "Error assigning workout plan to trainee"
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
