"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { user_role } from "@prisma/client"
import { getLogger } from "@/lib/server-logger"

export async function updateMyTraineeNote(traineeId: string, note: string) {
  const logger = await getLogger()

  const session = await auth()
  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== user_role.trainer) {
    return { error: "Brak uprawnień do tej operacji." }
  }

  const trainerId = session.user.id

  logger.info({ trainerId, traineeId }, "Updating trainee note")

  try {
    await prisma.cooperation.update({
      where: {
        trainer_id_trainee_id: {
          trainer_id: session.user.id,
          trainee_id: traineeId,
        },
      },
      data: {
        trainer_note: note.trim() ? note : null,
      },
    })

    logger.info({ trainerId, traineeId }, "Trainee note updated successfully")
    return { success: true }
  } catch {
    logger.error({ trainerId, traineeId }, "Error updating trainee note")
    return {
      error: "Wystąpił błąd podczas zapisywania danych. Spróbuj ponownie.",
    }
  }
}
