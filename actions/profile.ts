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
import { Prisma, user_role, workplace } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { getLogger } from "@/lib/server-logger"

export async function updatePersonalData(input: unknown) {
  const logger = await getLogger()

  const session = await auth()
  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  const userId = session.user.id
  const role = session.user.role

  logger.info({ userId, role }, "Updating personal data")
  const schema =
    role === user_role.trainer ? trainerPersonalDataSchema : traineePersonalDataSchema

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

      if (role === user_role.trainee) {
        const traineeData = data as TraineePersonalDataValues

        await tx.trainee.update({
          where: { id: session.user.id },
          data: { birthdate: new Date(traineeData.birthdate) },
        })
      }
    })

    logger.info({ userId, role }, "Personal data updated successfully")
  } catch (error) {
    logger.error({ userId, role }, "Error updating personal data")
    return {
      error: "Wystąpił błąd podczas aktualizacji danych. Spróbuj ponownie.",
    }
  }

  revalidatePath("/dashboard/profile")
  return { success: true }
}

//--- TRAINER ---
export async function updateTrainerCard(input: unknown) {
  const logger = await getLogger()

  const session = await auth()
  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== user_role.trainer) {
    return { error: "Brak uprawnień do tej operacji." }
  }

  const userId = session.user.id

  logger.info({ userId }, "Updating trainer card")

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

    logger.info({ userId }, "Trainer card updated successfully")
    revalidatePath("/dashboard/profile")
    return { success: true }
  } catch (error) {
    logger.error({ userId }, "Error updating trainer card")
    return {
      error: "Wystąpił błąd podczas aktualizacji danych. Spróbuj ponownie.",
    }
  }
}

export async function editWorkplace(workplace: workplace) {
  const logger = await getLogger()

  const session = await auth()

  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== user_role.trainer) {
    return { error: "Brak uprawnień do tej operacji." }
  }

  const userId = session.user.id

  logger.info({ userId, workplaceId: workplace.id }, "Editing workplace")

  const validated = editWorkplaceSchema.safeParse(workplace)
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

    logger.info({ userId, workplaceId: data.id }, "Workplace edited successfully")
    revalidatePath("/dashboard/profile")
    return { success: true }
  } catch (error) {
    logger.error({ userId, workplaceId: data.id }, "Error editing workplace")
    return {
      error: "Wystąpił błąd podczas aktualizacji danych. Spróbuj ponownie.",
    }
  }
}

export async function addWorkplace(input: unknown) {
  const logger = await getLogger()

  const session = await auth()
  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== user_role.trainer) {
    return { error: "Brak uprawnień do tej operacji." }
  }

  const userId = session.user.id

  logger.info({ userId }, "Adding workplace")

  const validated = createWorkplaceSchema.safeParse(input)
  if (!validated.success) {
    return { error: "Nieprawidłowe dane wejściowe." }
  }

  const data = validated.data

  try {
    await prisma.workplace.create({
      data: {
        trainer_id: userId,
        name: data.name,
        street: data.street,
        building_number: data.building_number,
        flat_number: data.flat_number || null,
        city: data.city,
      },
    })

    logger.info({ userId }, "Workplace added successfully")
    revalidatePath("/dashboard/profile")
    return { success: true }
  } catch (error) {
    logger.error({ userId }, "Error adding workplace")
    return {
      error: "Wystąpił błąd podczas zapisywania danych. Spróbuj ponownie.",
    }
  }
}

export async function deleteWorkplace(workplaceId: string) {
  const logger = await getLogger()

  const session = await auth()

  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== user_role.trainer) {
    return { error: "Brak uprawnień do tej operacji." }
  }

  const userId = session.user.id

  logger.info({ userId, workplaceId }, "Deleting workplace")

  try {
    const workplacesCount = await prisma.workplace.count({
      where: { trainer_id: session.user.id },
    })

    if (workplacesCount <= 1) {
      logger.warn({ userId, workplaceId }, "Workplace not deleted because it is the last one")
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
      logger.warn({ userId, workplaceId }, "Workplace not deleted because it is not found")
      return { error: "Nie znaleziono miejsca pracy lub brak uprawnień." }
    }

    logger.info({ userId, workplaceId }, "Workplace deleted successfully")
    revalidatePath("/dashboard/profile")
    return { success: true }

  } catch (error) {
    logger.error({ userId, workplaceId }, "Error deleting workplace")
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return {
        error:
          "Nie możesz usunąć tego miejsca pracy, ponieważ jest powiązane z aktywnymi współpracami. Najpierw rozwiąż wszystkie współprace przypisane do tego miejsca.",
      }
    }

    return { error: "Wystąpił błąd podczas usuwania danych. Spróbuj ponownie." }
  }
}

export async function changeProfileVisibility(isPublic: boolean) {
  const logger = await getLogger()

  const session = await auth()

  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== user_role.trainer) {
    return { error: "Brak uprawnień do tej operacji." }
  }

  const userId = session.user.id

  logger.info({ userId, isPublic }, "Changing profile visibility")

  try {
    await prisma.trainer.update({
      where: { id: session.user.id },
      data: { is_public: isPublic },
    })

    logger.info({ userId, isPublic }, "Profile visibility changed successfully")
    revalidatePath("/dashboard/profile")
    return { success: true }
  } catch (error) {
    logger.error({ userId, isPublic }, "Error changing profile visibility")
    return {
      error: "Wystąpił błąd podczas zapisywania zmian. Spróbuj ponownie.",
    }
  }
}
