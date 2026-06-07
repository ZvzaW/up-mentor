import { prisma } from "@/lib/prisma"
import { ChatConversationDTO } from "@/lib/types"
import { cooperation_status, user_role } from "@prisma/client"
import { getLogger } from "@/lib/server-logger"

export async function getChatConversations(userId: string, role: user_role) {
  const logger = await getLogger()

  logger.info({ userId, role }, "Fetching chat conversations")

  try {
    if (role === user_role.trainer) {
      const cooperations = await prisma.cooperation.findMany({
        where: {
          trainer_id: userId,
          status: cooperation_status.active,
        },
        include: {
          trainee: {
            include: {
              user: { select: { name: true, surname: true } },
            },
          },
        },
        orderBy: { created_at: "desc" },
      })

      const data: ChatConversationDTO[] = cooperations.map((cooperation) => {
        return {
          trainerId: cooperation.trainer_id,
          traineeId: cooperation.trainee_id,
          partnerName: `${cooperation.trainee.user.name} ${cooperation.trainee.user.surname}`,
        }
      })

      logger.info({ userId, role }, "Chat conversations fetched successfully")
      return { success: true, data }
    }

    if (role === user_role.trainee) {
      const cooperations = await prisma.cooperation.findMany({
        where: {
          trainee_id: userId,
          status: cooperation_status.active,
        },
        include: {
          trainer: {
            include: {
              user: { select: { name: true, surname: true } },
            },
          },
        },
        orderBy: { created_at: "desc" },
      })

      const data: ChatConversationDTO[] = cooperations.map((cooperation) => {
        return {
          trainerId: cooperation.trainer_id,
          traineeId: cooperation.trainee_id,
          partnerName: `${cooperation.trainer.user.name} ${cooperation.trainer.user.surname}`,
        }
      })

      logger.info({ userId, role }, "Chat conversations fetched successfully")
      return { success: true, data }
    }

    return { error: "Brak uprawnień do czatu." }
  } catch {
    logger.error({ userId, role }, "Error fetching chat conversations")
    return { error: "Nie udało się pobrać rozmów. Spróbuj odświeżyć stronę." }
  }
}
