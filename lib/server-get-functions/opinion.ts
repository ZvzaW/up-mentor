import { prisma } from "@/lib/prisma"
import { getLogger } from "@/lib/server-logger"

export async function getTrainerOpinions(trainerId: string) {
  const logger = await getLogger()

  logger.info({ trainerId }, "Fetching trainer opinions")

  try {
    const [opinions, { _avg }] = await Promise.all([
      prisma.opinion.findMany({
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
      }),
      prisma.opinion.aggregate({
        where: {
          trainer_id: trainerId,
        },
        _avg: {
          rate: true,
        },
      }),
    ])

    const reviews = opinions.map((opinion) => ({
      traineeId: opinion.trainee_id,
      name: opinion.trainee.user.name,
      createdAt: opinion.created_at,
      rate: opinion.rate as 1 | 2 | 3 | 4 | 5,
      comment: opinion.comment,
    }))

    const averageRate = _avg.rate !== null ? Number(_avg.rate.toFixed(1)) : null

    logger.info({ trainerId }, "Trainer opinions fetched successfully")

    return {
      success: true as const,
      data: {
        averageRate,
        reviews,
      },
    }
  } catch {
    logger.error({ trainerId }, "Error fetching trainer opinions")
    return { error: "Nie udało się pobrać danych. Spróbuj odświeżyć stronę" }
  }
}
