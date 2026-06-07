"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { user_role } from "@prisma/client"

export async function updateMyTraineeNote(traineeId: string, note: string) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== user_role.trainer) {
    return { error: "Brak uprawnień do tej operacji." }
  }

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

    return { success: true }
  } catch (error) {
    console.error(
      "[UPDATE_MY_TRAINEE_NOTE_ERROR]:",
      new Date().toLocaleString("pl-PL"),
      error
    )
    return {
      error: "Wystąpił błąd podczas zapisywania danych. Spróbuj ponownie.",
    }
  }
}
