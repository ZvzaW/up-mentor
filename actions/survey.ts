"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { cooperation_status, user_role } from "@prisma/client"
import { getLogger } from "@/lib/server-logger"

export async function saveSurveyAnswers(
  answers: { question_id: string; answer: string }[]
) {
  const logger = await getLogger()

  const session = await auth()
  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== user_role.trainee) {
    return { error: "Brak uprawnień do tej operacji." }
  }

  const traineeId = session.user.id

  logger.info({ traineeId }, "Saving survey answers")
  try {
    await prisma.$transaction(async (tx) => {
      await tx.survey_answer.deleteMany({
        where: { trainee_id: traineeId },
      })

      if (answers.length > 0) {
        await tx.survey_answer.createMany({
          data: answers.map((a) => ({
            trainee_id: traineeId,
            question_id: a.question_id,
            answer: a.answer,
          })),
        })
      }

      const trainee = await tx.trainee.findUnique({
        where: { id: traineeId },
        select: {
          slug: true,
          user: { select: { name: true, surname: true } },
          cooperation: {
            where: { status: cooperation_status.active },
            select: { trainer_id: true },
          },
        },
      })

      if (trainee && trainee.cooperation.length > 0) {
        await tx.notification.createMany({
          data: trainee.cooperation.map((cooperation) => ({
            user_id: cooperation.trainer_id,
            title: "Ankieta startowa",
            message: `${trainee.user.name} ${trainee.user.surname} zaktualizował(a) odpowiedzi ankiety startowej.`,
            redirect_url: `/dashboard/trainees/${trainee.slug}`,
            type: "survey",
          })),
        })
      }
    })

    logger.info({ traineeId }, "Survey answers saved successfully")
    return { success: true }
  } catch {
    logger.error({ traineeId }, "Error saving survey answers")
    return { error: "Nie udało się zapisać ankiety. Spróbuj ponownie później." }
  }
}

export async function getSurveyData(traineeId?: string) {
  const logger = await getLogger()

  const session = await auth()

  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  const userId = session.user.id
  const userRole = session.user.role

  logger.info({ userId, traineeId }, "Fetching survey data")

  const traineeIdToFetch = traineeId || userId

  if (userRole === user_role.trainee) {
    if (traineeIdToFetch !== userId) {
      return { error: "Brak uprawnień do tej ankiety." }
    }
  } else if (userRole === user_role.trainer) {
    if (!traineeId) {
      return { error: "Nie podano podopiecznego." }
    }

    const activeCooperation = await prisma.cooperation.findFirst({
      where: {
        trainer_id: userId,
        trainee_id: traineeId,
        status: cooperation_status.active,
      },
    })

    if (!activeCooperation) {
      return {
        error:
          "Nie masz aktywnej współpracy z tym podopiecznym. Brak dostępu do ankiety.",
      }
    }
  } else {
    return { error: "Brak uprawnień do tej operacji." }
  }

  try {
    const questions = await prisma.survey_question.findMany({
      orderBy: {
        order: "asc",
      },
    })

    const answers = await prisma.survey_answer.findMany({
      where: { trainee_id: traineeIdToFetch },
    })

    const answerDictionary = answers.reduce(
      (acc, curr) => {
        acc[curr.question_id] = curr.answer
        return acc
      },
      {} as Record<string, string>
    )

    const mappedData = questions.map((q) => ({
      id: q.id,
      question: q.question,
      currentAnswer: answerDictionary[q.id] || undefined,
    }))

    logger.info(
      { userId, traineeId: traineeIdToFetch },
      "Survey data fetched successfully"
    )
    return { success: true, data: mappedData }
  } catch {
    logger.error(
      { userId, traineeId: traineeIdToFetch },
      "Error fetching survey data"
    )
    return { error: "Nie udało się pobrać danych. Spróbuj odświeżyć stronę" }
  }
}
