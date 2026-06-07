import { prisma } from "@/lib/prisma"
import { getLogger } from "@/lib/server-logger"

export async function getTrainerOpinions(trainerId: string) {
  const logger = await getLogger()

  logger.info({ trainerId }, "Fetching trainer opinions")

  try {
    const opinions = await prisma.opinion.findMany({
      where: {
        trainer_id: trainerId,
      },
      include: {
        trainee: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })

    const reviews = opinions.map((opinion) => ({
      traineeId: opinion.trainee_id,
      name: opinion.trainee.user.name,
      createdAt: opinion.created_at,
      rate: opinion.rate as 1 | 2 | 3 | 4 | 5,
      comment: opinion.comment,
    }))

    const averageRate =
      reviews.length > 0
        ? Number(
            (
              reviews.reduce((sum, review) => sum + review.rate, 0) /
              reviews.length
            ).toFixed(1)
          )
        : null

    logger.info({ trainerId }, "Trainer opinions fetched successfully")

    return {
      success: true as const,
      data: {
        averageRate,
        reviews,
      },
    }
  } catch (error) {
    logger.error({ trainerId }, "Error fetching trainer opinions")
    return { error: "Nie udało się pobrać danych. Spróbuj odświeżyć stronę" }
  }
}
