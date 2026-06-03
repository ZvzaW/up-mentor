"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import {
  editTrainerExerciseSchema,
  trainerExerciseFormSchema,
} from "@/lib/validations"
import type { exercise } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createTrainerExercise(input: unknown) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== "trainer") {
    return { error: "Brak uprawnień do tej operacji." }
  }

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

    revalidatePath("/dashboard/exercises")
    return { success: true }
  } catch (error) {
    console.error(
      "[CREATE_TRAINER_EXERCISE_ERROR]:",
      new Date().toLocaleString("pl-PL"),
      error
    )
    return {
      error: "Wystąpił błąd podczas zapisywania danych. Spróbuj ponownie.",
    }
  }
}

export async function editTrainerExercise(exercise: exercise) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== "trainer") {
    return { error: "Brak uprawnień do tej operacji." }
  }

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
      return { error: "Nie znaleziono ćwiczenia do edycji." }
    }

    revalidatePath("/dashboard/exercises")
    return { success: true }
  } catch (error) {
    console.error(
      "[EDIT_TRAINER_EXERCISE_ERROR]:",
      new Date().toLocaleString("pl-PL"),
      error
    )
    return {
      error: "Wystąpił błąd podczas aktualizacji danych. Spróbuj ponownie.",
    }
  }
}

export async function deleteTrainerExercise(exerciseId: string) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== "trainer") {
    return { error: "Brak uprawnień do tej operacji." }
  }

  try {
    const result = await prisma.exercise.deleteMany({
      where: {
        id: exerciseId,
        trainer_id: session.user.id,
      },
    })

    if (result.count === 0) {
      return { error: "Nie znaleziono ćwiczenia do usunięcia." }
    }

    revalidatePath("/dashboard/exercises")
    return { success: true }
  } catch (error) {
    console.error(
      "[DELETE_TRAINER_EXERCISE_ERROR]:",
      new Date().toLocaleString("pl-PL"),
      error
    )
    return { error: "Wystąpił błąd podczas usuwania danych. Spróbuj ponownie." }
  }
}
