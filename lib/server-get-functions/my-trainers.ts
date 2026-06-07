import { prisma } from "@/lib/prisma"
import { cooperation_status } from "@prisma/client"
import { formatWorkplaceAddress } from "@/lib/utils"
import { WorkplaceAddress } from "@/lib/types"
import { getLogger } from "@/lib/server-logger"

export async function getMyTrainers(userId: string) {
  const logger = await getLogger()

  logger.info({ userId }, "Fetching trainers")

  try {
    const cooperations = await prisma.cooperation.findMany({
      where: {
        trainee_id: userId,
        status: cooperation_status.active,
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

    logger.info({ userId }, "Trainers fetched successfully")
    return { success: true, data: mappedCooperations }
  } catch {
    logger.error({ userId }, "Error fetching trainers")
    return { error: "Nie udało się pobrać danych. Spróbuj odświeżyć stronę." }
  }
}

export async function getMyTrainerBySlug(userId: string, slug: string) {
  const logger = await getLogger()

  logger.info({ userId, slug }, "Fetching trainer by slug")

  try {
    const cooperation = await prisma.cooperation.findFirst({
      where: {
        trainee_id: userId,
        status: cooperation_status.active,
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

    logger.info({ userId, slug }, "Trainer fetched by slug successfully")
    return { success: true, data: cooperation }
  } catch {
    logger.error({ userId, slug }, "Error fetching trainer by slug")
    return { error: "Nie udało się pobrać danych. Spróbuj odświeżyć stronę." }
  }
}

export async function countCooperations(userId: string) {
  const logger = await getLogger()

  logger.info({ userId }, "Counting active cooperations")

  try {
    const count = await prisma.cooperation.count({
      where: {
        trainee_id: userId,
        status: cooperation_status.active,
      },
    })

    logger.info({ userId, count }, "Active cooperations counted successfully")
    return { success: true, data: count }
  } catch {
    logger.error({ userId }, "Error counting active cooperations")
    return { error: "Nie udało się pobrać danych. Spróbuj odświeżyć stronę." }
  }
}
