"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export async function saveSurveyAnswersAction(
  answers: { question_id: string; answer: string }[]
) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== "trainee") {
    return { error: "Brak uprawnień do tej operacji." }
  }

  try {
    const traineeId = session.user.id

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
    })

    const trainee = await prisma.trainee.findUnique({
      where: { id: traineeId },
      select: {
        slug: true,
        user: { select: { name: true, surname: true } },
        cooperation: {
          where: { status: "active" },
          select: { trainer_id: true },
        },
      },
    })

    if (trainee && trainee.cooperation.length > 0) {
      await prisma.notification.createMany({
        data: trainee.cooperation.map((cooperation) => ({
          user_id: cooperation.trainer_id,
          title: "Ankieta startowa",
          message: `${trainee.user.name} ${trainee.user.surname} zaktualizował(a) odpowiedzi ankiety startowej.`,
          redirect_url: `/dashboard/trainees/${trainee.slug}`,
          type: "survey",
        })),
      })
    }

    return { success: true }
  } catch (error) {
    console.error(
      "[SAVE_SURVEY_ANSWERS_ERROR]:",
      new Date().toLocaleString("pl-PL"),
      error
    )
    return { error: "Nie udało się zapisać ankiety. Spróbuj ponownie później." }
  }
}

export async function getSurveyDataAction(traineeId?: string) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  const userId = session.user.id
  const userRole = session.user.role

  const traineeIdToFetch = traineeId || userId

  if (userRole === "trainee") {
    if (traineeIdToFetch !== userId) {
      return { error: "Brak uprawnień do tej ankiety." }
    }
  } else if (userRole === "trainer") {
    if (!traineeId) {
      return { error: "Nie podano podopiecznego." }
    }

    const activeCooperation = await prisma.cooperation.findFirst({
      where: {
        trainer_id: userId,
        trainee_id: traineeId,
        status: "active",
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

    return { success: true, data: mappedData }
  } catch (error) {
    console.error(
      "[GET_SURVEY_DATA_ERROR]:",
      new Date().toLocaleString("pl-PL"),
      error
    )
    return { error: "Nie udało się pobrać danych. Spróbuj odświeżyć stronę" }
  }
}
