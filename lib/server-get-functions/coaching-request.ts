import { prisma } from "@/lib/prisma"
import { cooperation_status } from "@prisma/client"
import { formatWorkplaceAddress } from "@/lib/utils"
import { WorkplaceAddress } from "@/lib/types"
import { getLogger } from "@/lib/server-logger"

export async function getCooperationStatus(userId: string, trainerId: string) {
  const logger = await getLogger()

  logger.info({ userId, trainerId }, "Fetching cooperation status")

  const [request, cooperation] = await Promise.all([
    prisma.coaching_request.findUnique({
      where: {
        trainer_id_trainee_id: { trainer_id: trainerId, trainee_id: userId },
      },
    }),
    prisma.cooperation.findUnique({
      where: {
        trainer_id_trainee_id: { trainer_id: trainerId, trainee_id: userId },
        status: cooperation_status.active,
      },
    }),
  ])

  logger.info({ userId, trainerId }, "Cooperation status fetched successfully")

  return {
    hasRequest: !!request,
    hasCooperation: !!cooperation,
  }
}

export async function getPendingRequests(userId: string) {
  const logger = await getLogger()

  logger.info({ userId }, "Fetching pending coaching requests")

  try {
    const requests = await prisma.coaching_request.findMany({
      where: {
        trainer_id: userId,
      },
      include: {
        trainee: {
          include: {
            user: {
              select: { name: true, surname: true },
            },
          },
        },
        workplace: {
          select: {
            name: true,
            city: true,
            street: true,
            building_number: true,
            flat_number: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    })

    const mappedRequests = requests.map((req) => ({
      traineeId: req.trainee_id,
      workplaceId: req.workplace_id,
      name: `${req.trainee.user.name} ${req.trainee.user.surname}`,
      message: req.message,
      createdAt: req.created_at,
      workplace: formatWorkplaceAddress(req.workplace as WorkplaceAddress),
    }))

    logger.info({ userId }, "Pending coaching requests fetched successfully")
    return { success: true, data: mappedRequests }
  } catch {
    logger.error({ userId }, "Error fetching pending coaching requests")
    return { error: "Nie udało się pobrać danych. Spróbuj odświeżyć stronę." }
  }
}
