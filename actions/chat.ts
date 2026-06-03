"use server"

import { auth } from "@/auth"
import { getCooperationChannelName } from "@/lib/chat-channel"
import { prisma } from "@/lib/prisma"
import { getPusherServer, isPusherConfigured } from "@/lib/pusher-server"
import { ChatMessageDTO } from "@/lib/types"
import { sendChatMessageSchema } from "@/lib/validations"
import { redirect } from "next/navigation"

async function assertCooperationAccess(
  userId: string,
  role: string,
  trainerId: string,
  traineeId: string
): Promise<string | null> {
  const isTrainerParticipant = role === "trainer" && userId === trainerId
  const isTraineeParticipant = role === "trainee" && userId === traineeId

  if (!isTrainerParticipant && !isTraineeParticipant) {
    return "Brak uprawnień do tej rozmowy."
  }

  const cooperation = await prisma.cooperation.findFirst({
    where: {
      trainer_id: trainerId,
      trainee_id: traineeId,
      status: "active",
    },
    select: { trainer_id: true },
  })

  if (!cooperation) {
    return "Nie masz aktywnej współpracy z tym użytkownikiem."
  }

  return null
}

export async function getChatMessages(trainerId: string, traineeId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

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

    return { success: true, data }
  } catch (error) {
    console.error(
      "[GET_CHAT_MESSAGES_ERROR]:",
      new Date().toLocaleString("pl-PL"),
      error
    )
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
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

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

    return { success: true, data: payload }
  } catch (error) {
    console.error(
      "[SEND_CHAT_MESSAGE_ERROR]:",
      new Date().toLocaleString("pl-PL"),
      error
    )
    return {
      error: "Wystąpił błąd podczas wysyłania wiadomości. Spróbuj ponownie.",
    }
  }
}
