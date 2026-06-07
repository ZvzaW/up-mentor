import { prisma } from "@/lib/prisma"
import { cooperation_status } from "@prisma/client"
import { TraineeDTO, WorkplaceAddress } from "@/lib/types"
import { getLogger } from "@/lib/server-logger"

export async function getMyTrainees(userId: string) {
  const logger = await getLogger()

  logger.info({ userId }, "Fetching trainees")

  try {
    const cooperations = await prisma.cooperation.findMany({
      where: {
        trainer_id: userId,
        status: cooperation_status.active,
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

    logger.info({ userId }, "Trainees fetched successfully")
    return { success: true, data: mappedCooperations }
  } catch (error) {
    logger.error({ userId }, "Error fetching trainees")
    return { error: "Nie udało się pobrać danych. Spróbuj odświeżyć stronę." }
  }
}

export async function getMyTraineeBySlug(userId: string, slug: string) {
  const logger = await getLogger()

  logger.info({ userId, slug }, "Fetching trainee by slug")

  try {
    const cooperation = await prisma.cooperation.findFirst({
      where: {
        trainer_id: userId,
        status: cooperation_status.active,
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

    logger.info({ userId, slug}, "Trainee fetched by slug successfully")
    return { success: true, data: cooperation }
  } catch (error) {
    logger.error({ userId, slug }, "Error fetching trainee by slug")
    return { error: "Nie udało się pobrać danych. Spróbuj odświeżyć stronę." }
  }
}
