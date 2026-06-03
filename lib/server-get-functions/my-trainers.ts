import { prisma } from "@/lib/prisma"
import { formatWorkplaceAddress } from "@/lib/utils"
import { WorkplaceAddress } from "@/lib/types"

export async function getMyTrainers(userId: string) {
  try {
    const cooperations = await prisma.cooperation.findMany({
      where: {
        trainee_id: userId,
        status: "active",
      },
      include: {
        trainer: {
          include: {
            user: {
              select: {
                name: true,
                surname: true,
                phone: true,
              },
            },
          },
        },
        workplace: {
          select: {
            name: true,
            street: true,
            city: true,
            building_number: true,
            flat_number: true,
          },
        },
      },
    })

    const mappedCooperations = cooperations.map((cooperation) => ({
      key: cooperation.trainer_id,
      name: `${cooperation.trainer.user.name} ${cooperation.trainer.user.surname}`,
      workplace: formatWorkplaceAddress(
        cooperation.workplace as WorkplaceAddress
      ),
      slug: cooperation.trainer.slug,
    }))

    return { success: true, data: mappedCooperations }
  } catch (error) {
    console.error(
      "[GET_MY_TRAINERS_ERROR]:",
      new Date().toLocaleString("pl-PL"),
      error
    )
    return { error: "Nie udało się pobrać danych. Spróbuj odświeżyć stronę." }
  }
}

export async function getMyTrainerBySlug(userId: string, slug: string) {
  try {
    const cooperation = await prisma.cooperation.findFirst({
      where: {
        trainee_id: userId,
        status: "active",
        trainer: {
          slug,
        },
      },
      include: {
        trainer: {
          include: {
            user: {
              select: {
                name: true,
                surname: true,
                phone: true,
              },
            },
          },
        },
        workplace: {
          select: {
            name: true,
            street: true,
            city: true,
            building_number: true,
            flat_number: true,
          },
        },
      },
    })

    return { success: true, data: cooperation }
  } catch (error) {
    console.error(
      "[GET_MY_TRAINER_BY_SLUG_ERROR]:",
      new Date().toLocaleString("pl-PL"),
      error
    )
    return { error: "Nie udało się pobrać danych. Spróbuj odświeżyć stronę." }
  }
}

export async function countCooperations(userId: string) {
  try {
    const count = await prisma.cooperation.count({
      where: {
        trainee_id: userId,
        status: "active",
      },
    })

    return { success: true, data: count }
  } catch (error) {
    console.error(
      "[COUNT_COOPERATIONS_ERROR]:",
      new Date().toLocaleString("pl-PL"),
      error
    )
    return { error: "Nie udało się pobrać danych. Spróbuj odświeżyć stronę." }
  }
}
