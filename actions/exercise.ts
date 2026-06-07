"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import {
  editTrainerExerciseSchema,
  trainerExerciseFormSchema,
} from "@/lib/validations"
import { exercise, user_role } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { getLogger } from "@/lib/server-logger"

export async function createTrainerExercise(input: unknown) {
  const logger = await getLogger()

  const session = await auth()

  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== user_role.trainer) {
    return { error: "Brak uprawnień do tej operacji." }
  }

  const userId = session.user.id

  logger.info({ userId }, "Creating trainer exercise")

  const validated = trainerExerciseFormSchema.safeParse(input)
  if (!validated.success) {
    return { error: "Nieprawidłowe dane wejściowe." }
  }

  const data = validated.data

  try {
    await prisma.exercise.create({
      data: {
        name: data.name,
        body_part: data.body_part,
        video_url: data.video_url === "" ? null : data.video_url,
        trainer_id: session.user.id,
      },
    })

    logger.info({ userId }, "Trainer exercise created successfully")
    revalidatePath("/dashboard/exercises")
    return { success: true }
  } catch (error) {
    logger.error({ userId }, "Error creating trainer exercise")
    return {
      error: "Wystąpił błąd podczas zapisywania danych. Spróbuj ponownie.",
    }
  }
}

export async function editTrainerExercise(exercise: exercise) {
  const logger = await getLogger()

  const session = await auth()

  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== user_role.trainer) {
    return { error: "Brak uprawnień do tej operacji." }
  }

  const userId = session.user.id

  logger.info({ userId, exerciseId: exercise.id }, "Editing trainer exercise")

  const validated = editTrainerExerciseSchema.safeParse(exercise)
  if (!validated.success) {
    return { error: "Nieprawidłowe dane wejściowe." }
  }

  const data = validated.data

  try {
    const result = await prisma.exercise.updateMany({
      where: {
        id: data.id,
        trainer_id: session.user.id,
      },
      data: {
        name: data.name,
        body_part: data.body_part,
        video_url: data.video_url === "" ? null : data.video_url,
      },
    })

    if (result.count === 0) {
      logger.warn({ userId, exerciseId: data.id }, "Exercise to edit not found")
      return { error: "Nie znaleziono ćwiczenia do edycji." }
    }

    logger.info({ userId, exerciseId: data.id }, "Trainer exercise edited successfully")
    revalidatePath("/dashboard/exercises")
    return { success: true }
  } catch (error) {
    logger.error({ userId, exerciseId: data.id }, "Error editing trainer exercise")
    return {
      error: "Wystąpił błąd podczas aktualizacji danych. Spróbuj ponownie.",
    }
  }
}

export async function deleteTrainerExercise(exerciseId: string) {
  const logger = await getLogger()

  const session = await auth()

  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== user_role.trainer) {
    return { error: "Brak uprawnień do tej operacji." }
  }

  const userId = session.user.id

  logger.info({ userId, exerciseId }, "Deleting trainer exercise")

  try {
    const result = await prisma.exercise.deleteMany({
      where: {
        id: exerciseId,
        trainer_id: session.user.id,
      },
    })

    if (result.count === 0) {
      logger.warn({ userId, exerciseId }, "Exercise to delete not found")
      return { error: "Nie znaleziono ćwiczenia do usunięcia." }
    }

    logger.info({ userId, exerciseId }, "Trainer exercise deleted successfully")
    revalidatePath("/dashboard/exercises")
    return { success: true }
  } catch (error) {
    logger.error({ userId, exerciseId }, "Error deleting trainer exercise")
    return { error: "Wystąpił błąd podczas usuwania danych. Spróbuj ponownie." }
  }
}
