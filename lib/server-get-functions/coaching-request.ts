import { prisma } from "@/lib/prisma"
import { formatWorkplaceAddress } from "@/lib/utils"
import { WorkplaceAddress } from "@/lib/types"

export async function getCooperationStatus(userId: string, trainerId: string) {
  const [request, cooperation] = await Promise.all([
    prisma.coaching_request.findUnique({
      where: {
        trainer_id_trainee_id: { trainer_id: trainerId, trainee_id: userId },
      },
    }),
    prisma.cooperation.findUnique({
      where: {
        trainer_id_trainee_id: { trainer_id: trainerId, trainee_id: userId },
        status: "active",
      },
    }),
  ])

  return {
    hasRequest: !!request,
    hasCooperation: !!cooperation,
  }
}

export async function getPendingRequests(userId: string) {
  try {
    const requests = await prisma.coaching_request.findMany({
      where: {
        trainer_id: userId,
        status: "pending",
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

    return { success: true, data: mappedRequests }
  } catch (error) {
    console.error(
      "[GET_PENDING_REQUESTS_ERROR]:",
      new Date().toLocaleString("pl-PL"),
      error
    )
    return { error: "Nie udało się pobrać danych. Spróbuj odświeżyć stronę." }
  }
}
