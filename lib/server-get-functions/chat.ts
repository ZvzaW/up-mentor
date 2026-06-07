import { prisma } from "@/lib/prisma"
import { ChatConversationDTO } from "@/lib/types"
import { cooperation_status, user_role } from "@prisma/client"

export async function getChatConversations(userId: string, role: user_role) {
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

      return { success: true, data }
    }

    return { error: "Brak uprawnień do czatu." }
  } catch (error) {
    console.error(
      "[GET_CHAT_CONVERSATIONS_ERROR]:",
      new Date().toLocaleString("pl-PL"),
      error
    )
    return { error: "Nie udało się pobrać rozmów. Spróbuj odświeżyć stronę." }
  }
}
