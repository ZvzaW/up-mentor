"use server"

import { auth } from "@/auth"
import { getCooperationChannelName } from "@/lib/chat-channel"
import { prisma } from "@/lib/prisma"
import { getPusherServer, isPusherConfigured } from "@/lib/pusher-server"
import { ChatMessageDTO } from "@/lib/types"
import { sendChatMessageSchema } from "@/lib/validations"
import { redirect } from "next/navigation"
import { cooperation_status, user_role } from "@prisma/client"
import { getLogger } from "@/lib/server-logger"

async function assertCooperationAccess(
  userId: string,
  role: user_role,
  trainerId: string,
  traineeId: string
): Promise<string | null> {
  const isTrainerParticipant =
    role === user_role.trainer && userId === trainerId
  const isTraineeParticipant =
    role === user_role.trainee && userId === traineeId

  if (!isTrainerParticipant && !isTraineeParticipant) {
    return "Brak uprawnień do tej rozmowy."
  }

  const cooperation = await prisma.cooperation.findFirst({
    where: {
      trainer_id: trainerId,
      trainee_id: traineeId,
      status: cooperation_status.active,
    },
    select: { trainer_id: true },
  })

  if (!cooperation) {
    return "Nie masz aktywnej współpracy z tym użytkownikiem."
  }

  return null
}

export async function getChatMessages(trainerId: string, traineeId: string) {
  const logger = await getLogger()

  const session = await auth()
  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  logger.info({ trainerId, traineeId }, "Fetching chat messages")

  const accessError = await assertCooperationAccess(
    session.user.id,
    session.user.role,
    trainerId,
    traineeId
  )
  if (accessError) return { error: accessError }

  try {
    const messages = await prisma.chat_message.findMany({
      where: { trainer_id: trainerId, trainee_id: traineeId },
      orderBy: { created_at: "asc" },
      take: 300,
    })

    const data: ChatMessageDTO[] = messages.map((message) => ({
      id: message.id,
      senderId: message.sender_id,
      content: message.content,
      createdAt: message.created_at.toISOString(),
      isOwn: message.sender_id === session.user.id,
    }))

    logger.info("Chat messages fetched successfully")
    return { success: true, data }
  } catch {
    logger.error({ trainerId, traineeId }, "Error fetching chat messages")
    return {
      error: "Nie udało się pobrać wiadomości. Spróbuj odświeżyć stronę.",
    }
  }
}

export async function sendChatMessage(
  trainerId: string,
  traineeId: string,
  content: string
) {
  const logger = await getLogger()

  const session = await auth()
  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  logger.info({ trainerId, traineeId }, "Sending chat message")

  const validated = sendChatMessageSchema.safeParse({
    trainerId,
    traineeId,
    content,
  })
  if (!validated.success) {
    return { error: "Nieprawidłowa wiadomość." }
  }

  const accessError = await assertCooperationAccess(
    session.user.id,
    session.user.role,
    validated.data.trainerId,
    validated.data.traineeId
  )
  if (accessError) return { error: accessError }

  try {
    const message = await prisma.chat_message.create({
      data: {
        trainer_id: validated.data.trainerId,
        trainee_id: validated.data.traineeId,
        sender_id: session.user.id,
        content: validated.data.content,
      },
    })

    const payload: ChatMessageDTO = {
      id: message.id,
      senderId: message.sender_id,
      content: message.content,
      createdAt: message.created_at.toISOString(),
      isOwn: message.sender_id === session.user.id,
    }

    if (isPusherConfigured()) {
      const pusher = getPusherServer()
      if (pusher) {
        await pusher.trigger(
          getCooperationChannelName(
            validated.data.trainerId,
            validated.data.traineeId
          ),
          "new-message",
          payload
        )
      }
    }

    logger.info({ trainerId, traineeId }, "Chat message sent successfully")
    return { success: true, data: payload }
  } catch {
    logger.error({ trainerId, traineeId }, "Error sending chat message")
    return {
      error: "Wystąpił błąd podczas wysyłania wiadomości. Spróbuj ponownie.",
    }
  }
}
