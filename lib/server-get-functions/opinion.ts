import { prisma } from "@/lib/prisma"

export async function getTrainerOpinions(trainerId: string) {
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

    return {
      success: true as const,
      data: {
        averageRate,
        reviews,
      },
    }
  } catch (error) {
    console.error(
      "[GET_TRAINER_OPINIONS_ERROR]:",
      new Date().toLocaleString("pl-PL"),
      error
    )
    return { error: "Nie udało się pobrać danych. Spróbuj odświeżyć stronę" }
  }
}
