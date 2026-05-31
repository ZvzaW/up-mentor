"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import {
  editTrainerExerciseSchema,
  trainerExerciseFormSchema,
} from "@/lib/validations"
import type { exercise, Prisma } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

async function exerciseVisibility(
  userId: string,
  role: string
): Promise<Prisma.exerciseWhereInput> {
  const predefined: Prisma.exerciseWhereInput = { trainer_id: null }

  if (role === "trainer") {
    return {
      OR: [predefined, { trainer_id: userId }],
    }
  }

  if (role === "trainee") {
    const cooperations = await prisma.cooperation.findMany({
      where: {
        trainee_id: userId,
        status: "active",
      },
      select: { trainer_id: true },
    })
    const trainerIds = [...new Set(cooperations.map((c) => c.trainer_id))]
    const or: Prisma.exerciseWhereInput[] = [predefined]
    if (trainerIds.length > 0) {
      or.push({ trainer_id: { in: trainerIds } })
    }
    return { OR: or }
  }

  return { id: { in: [] } }
}

export async function getExercises() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  try {
    const visibility = await exerciseVisibility(
      session.user.id,
      session.user.role
    )

    const data = await prisma.exercise.findMany({
      where: visibility,
      select: {
        id: true,
        name: true,
        body_part: true,
        video_url: true,
        trainer_id: true,
      },
      orderBy: { name: "asc" },
    })

    return { success: true as const, data }
  } catch (error) {
    console.error(
      "[GET_EXERCISES_ERROR]:",
      new Date().toLocaleString("pl-PL"),
      error
    )
    return { error: "Nie udało się pobrać ćwiczeń. Spróbuj odświeżyć stronę." }
  }
}

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
