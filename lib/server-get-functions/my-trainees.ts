import { prisma } from "@/lib/prisma"
import { TraineeDTO, WorkplaceAddress } from "@/lib/types"

export async function getMyTrainees(userId: string) {
  try {
    const cooperations = await prisma.cooperation.findMany({
      where: {
        trainer_id: userId,
        status: "active",
      },
      include: {
        trainee: {
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
            building_number: true,
            flat_number: true,
            city: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    })

    const mappedCooperations = cooperations.map((cooperation) => ({
      id: cooperation.trainee.id,
      slug: cooperation.trainee.slug,
      fullName: `${cooperation.trainee.user.name} ${cooperation.trainee.user.surname}`,
      workplace: cooperation.workplace as WorkplaceAddress,
    })) as TraineeDTO[]

    return { success: true, data: mappedCooperations }
  } catch (error) {
    console.error(
      "[GET_MY_TRAINEES_ERROR]:",
      new Date().toLocaleString("pl-PL"),
      error
    )
    return { error: "Nie udało się pobrać danych. Spróbuj odświeżyć stronę." }
  }
}

export async function getMyTraineeBySlug(userId: string, slug: string) {
  try {
    const cooperation = await prisma.cooperation.findFirst({
      where: {
        trainer_id: userId,
        status: "active",
        trainee: {
          slug,
        },
      },
      include: {
        trainee: {
          include: {
            user: {
              select: {
                id: true,
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
            building_number: true,
            flat_number: true,
            city: true,
          },
        },
      },
    })

    return { success: true, data: cooperation }
  } catch (error) {
    console.error(
      "[GET_MY_TRAINEE_BY_SLUG_ERROR]:",
      new Date().toLocaleString("pl-PL"),
      error
    )
    return { error: "Nie udało się pobrać danych. Spróbuj odświeżyć stronę." }
  }
}
