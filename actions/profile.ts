"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import {
  traineePersonalDataSchema,
  TraineePersonalDataValues,
  trainerPersonalDataSchema,
  trainerCardSchema,
  createWorkplaceSchema,
  editWorkplaceSchema,
} from "@/lib/validations"
import { Prisma } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function updatePersonalDataAction(input: unknown) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  const role = session.user.role
  const schema =
    role === "trainer" ? trainerPersonalDataSchema : traineePersonalDataSchema

  const validated = schema.safeParse(input)
  if (!validated.success) return { error: "Nieprawidłowe dane wejściowe." }

  const data = validated.data

  try {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          name: data.name.trim(),
          surname: data.surname.trim(),
          phone: data.phone.trim(),
        },
      })

      if (role === "trainee") {
        const traineeData = data as TraineePersonalDataValues

        await tx.trainee.update({
          where: { id: session.user.id },
          data: { birthdate: new Date(traineeData.birthdate) },
        })
      }
    })
  } catch (e: any) {
    return {
      error: "Wystąpił błąd podczas aktualizacji danych. Spróbuj ponownie.",
    }
  }

  revalidatePath("/dashboard/profile")
  return { success: true }
}

//--- TRAINER ---
export async function updateTrainerCardAction(input: unknown) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== "trainer") {
    return { error: "Brak uprawnień do tej operacji." }
  }

  const validated = trainerCardSchema.safeParse(input)
  if (!validated.success) {
    return { error: "Nieprawidłowe dane wejściowe." }
  }

  const data = validated.data

  try {
    await prisma.trainer.update({
      where: { id: session.user.id },
      data: {
        price_per_training: data.price_per_training,
        work_description: data.work_description,
      },
    })
  } catch (e: any) {
    return {
      error: "Wystąpił błąd podczas aktualizacji danych. Spróbuj ponownie.",
    }
  }

  revalidatePath("/dashboard/profile")
  return { success: true }
}

export async function editWorkplaceAction(input: unknown) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== "trainer") {
    return { error: "Brak uprawnień do tej operacji." }
  }

  const validated = editWorkplaceSchema.safeParse(input)
  if (!validated.success) {
    return { error: "Nieprawidłowe dane wejściowe." }
  }

  const data = validated.data

  try {
    const result = await prisma.workplace.updateMany({
      where: {
        id: data.id,
        trainer_id: session.user.id,
      },
      data: {
        name: data.name,
        street: data.street,
        building_number: data.building_number,
        flat_number: data.flat_number || null,
        city: data.city,
      },
    })

    if (result.count === 0) {
      return { error: "Nie znaleziono miejsca pracy lub brak uprawnień." }
    }

    revalidatePath("/dashboard/profile")
    return { success: true }
  } catch (error) {
    return {
      error: "Wystąpił błąd podczas aktualizacji danych. Spróbuj ponownie.",
    }
  }
}

export async function addWorkplaceAction(input: unknown) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== "trainer") {
    return { error: "Brak uprawnień do tej operacji." }
  }

  const validated = createWorkplaceSchema.safeParse(input)
  if (!validated.success) {
    return { error: "Nieprawidłowe dane wejściowe." }
  }

  const data = validated.data

  try {
    await prisma.workplace.create({
      data: {
        trainer_id: session.user.id,
        name: data.name,
        street: data.street,
        building_number: data.building_number,
        flat_number: data.flat_number || null,
        city: data.city,
      },
    })

    revalidatePath("/dashboard/profile")
    return { success: true }
  } catch (error) {
    return {
      error: "Wystąpił błąd podczas zapisywania danych. Spróbuj ponownie.",
    }
  }
}

export async function deleteWorkplaceAction(workplaceId: string) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== "trainer") {
    return { error: "Brak uprawnień do tej operacji." }
  }

  try {
    const workplacesCount = await prisma.workplace.count({
      where: { trainer_id: session.user.id },
    })

    if (workplacesCount <= 1) {
      return {
        error:
          "Nie możesz usunąć tego miejsca pracy. Profil trenera musi posiadać co najmniej jedno miejsce.",
      }
    }

    const result = await prisma.workplace.deleteMany({
      where: {
        id: workplaceId,
        trainer_id: session.user.id,
      },
    })

    if (result.count === 0) {
      return { error: "Nie znaleziono miejsca pracy lub brak uprawnień." }
    }

    revalidatePath("/dashboard/profile")
    return { success: true }
  } catch (error) {
    return { error: "Wystąpił błąd podczas usuwania danych. Spróbuj ponownie." }
  }
}

export async function changeProfileVisibilityAction(isPublic: boolean) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== "trainer") {
    return { error: "Brak uprawnień do tej operacji." }
  }

  try {
    await prisma.trainer.update({
      where: { id: session.user.id },
      data: { is_public: isPublic },
    })

    revalidatePath("/dashboard/profile")
    return { success: true }
  } catch (error) {
    return {
      error: "Wystąpił błąd podczas zapisywania zmian. Spróbuj ponownie.",
    }
  }
}
