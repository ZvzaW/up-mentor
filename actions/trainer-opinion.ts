"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { trainerOpinionSchema } from "@/lib/validations"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation";

export async function getMyOpinion(trainerId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== "trainee") {
    return { error: "Brak uprawnień do tej operacji." }
  }

  try {
    const opinion = await prisma.opinion.findUnique({
      where: {
        trainee_id_trainer_id: {
          trainee_id: session.user.id,
          trainer_id: trainerId,
        },
      },
      select: {
        rate: true,
        comment: true,
      },
    })

    if (!opinion) {
      return { success: true as const, data: null }
    }

    return {
      success: true as const,
      data: {
        rate: opinion.rate as 1 | 2 | 3 | 4 | 5,
        comment: opinion.comment,
      },
    }
  } catch {
    return { error: "Nie udało się pobrać opinii. Spróbuj ponownie" }
  }
}

export async function getTrainerOpinions(trainerId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  try {
    const opinions = await prisma.opinion.findMany({
      where: {
        trainer_id: trainerId,
      },
      include: {
        trainee: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })

    const reviews = opinions.map((opinion) => ({
      traineeId: opinion.trainee_id,
      name: opinion.trainee.user.name,
      createdAt: opinion.created_at,
      rate: opinion.rate as 1 | 2 | 3 | 4 | 5,
      comment: opinion.comment,
    }))

    const averageRate =
      reviews.length > 0
        ? Number(
            (
              reviews.reduce((sum, review) => sum + review.rate, 0) /
              reviews.length
            ).toFixed(1)
          )
        : null

    return {
      success: true as const,
      data: {
        averageRate,
        reviews,
      },
    }
  } catch {
    return { error: "Nie udało się pobrać danych. Spróbuj odświeżyć stronę" }
  }
}

export async function upsertOpinion(input: unknown) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== "trainee") {
    return { error: "Brak uprawnień do tej operacji." }
  }

  const validated = trainerOpinionSchema.safeParse(input)
  if (!validated.success) {
    return { error: "Nieprawidłowe dane formularza." }
  }

  const data = validated.data

  const cooperation = await prisma.cooperation.findUnique({
    where: {
      trainer_id_trainee_id: {
        trainer_id: data.trainer_id,
        trainee_id: session.user.id,
      },
    },
    select: { status: true },
  })

  if (!cooperation || cooperation.status !== "active") {
    return {
      error: "Możesz ocenić tylko trenera, z którym masz aktywną współpracę.",
    }
  }

  try {
    await prisma.opinion.upsert({
      where: {
        trainee_id_trainer_id: {
          trainee_id: session.user.id,
          trainer_id: data.trainer_id,
        },
      },
      create: {
        trainee_id: session.user.id,
        trainer_id: data.trainer_id,
        rate: data.rate,
        comment: data.comment,
      },
      update: {
        rate: data.rate,
        comment: data.comment,
      },
    })
  } catch {
    return { error: "Wystąpił błąd podczas zapisywania danych. Spróbuj ponownie." }
  }

  revalidatePath("/dashboard/trainers")
  return { success: true as const }
}


export async function deleteOpinion(trainerId: string) {
   const session = await auth()
  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== "trainee") {
    return { error: "Brak uprawnień do tej operacji." }
  }

  try {
    await prisma.opinion.deleteMany({
      where: {
        trainee_id: session.user.id,
        trainer_id: trainerId,
      },
    })
  } catch {
    return { error: "Wystąpił błąd podczas usuwania danych. Spróbuj ponownie." }
  }

  revalidatePath("/dashboard/trainers")
  return { success: true as const }
}
