"use server"

import { auth, signOut } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { cooperation_status, user_role } from "@prisma/client"
import { getLogger } from "@/lib/server-logger"

export async function deleteAccount() {
  const logger = await getLogger()

  const session = await auth()
  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  const userId = session.user.id

  logger.info({ userId }, "Deleting account")

  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { role: true },
      })

      if (!user) {
        throw new Error("USER_NOT_FOUND")
      }

      //Trainer
      if (user.role === user_role.trainer) {
        await tx.coaching_request.deleteMany({
          where: { trainer_id: userId },
        })

        await tx.chat_message.deleteMany({
          where: { trainer_id: userId },
        })

        await tx.opinion.deleteMany({
          where: { trainer_id: userId },
        })

        await tx.cooperation.updateMany({
          where: { trainer_id: userId },
          data: {
            status: cooperation_status.finished,
            workplace_id: null,
          },
        })

        await tx.plans_library.deleteMany({
          where: {
            workout_plan: {
              trainer_id: userId,
            },
          },
        })

        await tx.workout_plan.deleteMany({
          where: { trainer_id: userId },
        })

        await tx.exercise.deleteMany({
          where: { trainer_id: userId },
        })

        await tx.workplace.deleteMany({
          where: { trainer_id: userId },
        })

        await tx.trainer.update({
          where: { id: userId },
          data: {
            work_description: null,
            price_per_training: null,
            is_public: false,
            slug: userId,
          },
        })
        //Trainee
      } else if (user.role === user_role.trainee) {
        await tx.chat_message.deleteMany({
          where: { trainee_id: userId },
        })

        await tx.coaching_request.deleteMany({
          where: { trainee_id: userId },
        })

        await tx.cooperation.updateMany({
          where: {
            trainee_id: userId,
            status: { not: cooperation_status.finished },
          },
          data: { status: cooperation_status.finished },
        })

        await tx.plans_library.deleteMany({
          where: { trainee_id: userId },
        })

        await tx.survey_answer.deleteMany({
          where: { trainee_id: userId },
        })

        await tx.trainee.update({
          where: { id: userId },
          data: {
            slug: userId,
          },
        })
      }

      //Both roles
      const now = new Date()

      if (user.role === user_role.trainer || user.role === user_role.trainee) {
        await tx.training.deleteMany({
          where: {
            ...(user.role === user_role.trainer
              ? { trainer_id: userId }
              : { trainee_id: userId }),
            scheduled_at: { gt: now },
          },
        })
      }

      await tx.notification.deleteMany({
        where: { user_id: userId },
      })

      await tx.refresh_token.deleteMany({
        where: { user_id: userId },
      })

      await tx.user.update({
        where: { id: userId },
        data: {
          name: "Dawny użytkownik",
          surname: "",
          email: `deleted_${userId}`,
          phone: "",
          password: "DELETED",
        },
      })
    })

    logger.info("Account deleted successfully")
  } catch {
    logger.error({ userId }, "Error deleting account")
    return {
      error: "Wystąpił błąd podczas usuwania konta. Spróbuj ponownie.",
    }
  }

  await signOut({ redirectTo: "/" })
}
