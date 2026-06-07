import { prisma } from "@/lib/prisma"
import { getLogger } from "@/lib/server-logger"

type PublicTrainersCatalogFilters = {
  name?: string
  city?: string
}

export async function getCatalogTrainers(
  filters?: PublicTrainersCatalogFilters
) {
  const logger = await getLogger()

  const nameQuery = filters?.name?.trim()
  const cityQuery = filters?.city?.trim()

  logger.info({ nameQuery, cityQuery }, "Fetching catalog trainers")

  try {
    type TrainerFindManyArgs = NonNullable<
      Parameters<typeof prisma.trainer.findMany>[0]
    >
    type TrainerWhere = TrainerFindManyArgs["where"]
    type TrainerAndFilter = NonNullable<TrainerWhere>

    const whereClause: TrainerWhere = {
      is_public: true,
    }

    const andFilters: TrainerAndFilter[] = []

    if (nameQuery) {
      andFilters.push({
        user: {
          OR: [
            { name: { contains: nameQuery, mode: "insensitive" } },
            { surname: { contains: nameQuery, mode: "insensitive" } },
          ],
        },
      })
    }

    if (cityQuery) {
      andFilters.push({
        workplace: {
          some: {
            city: { contains: cityQuery, mode: "insensitive" },
          },
        },
      })
    }

    if (andFilters.length > 0) {
      whereClause.AND = andFilters
    }

    const [trainers, opinionAverages] = await Promise.all([
      prisma.trainer.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              name: true,
              surname: true,
            },
          },
          workplace: {
            distinct: ["city"],
            select: {
              city: true,
            },
            orderBy: {
              city: "asc",
            },
          },
        },
      }),
      prisma.opinion.groupBy({
        by: ["trainer_id"],
        where: {
          trainer: whereClause,
        },
        _avg: {
          rate: true,
        },
      }),
    ])

    const averageRateByTrainerId = new Map(
      opinionAverages.map(({ trainer_id, _avg }) => [
        trainer_id,
        _avg.rate !== null ? Number(_avg.rate.toFixed(1)) : null,
      ])
    )

    const data = trainers.map((trainer) => ({
      id: trainer.id,
      slug: trainer.slug,
      name: `${trainer.user.name} ${trainer.user.surname}`,
      workplaces: trainer.workplace.map((workplace) => workplace.city),
      averageRate: averageRateByTrainerId.get(trainer.id) ?? null,
    }))

    logger.info(
      { nameQuery, cityQuery },
      "Catalog trainers fetched successfully"
    )
    return { success: true as const, data }
  } catch {
    logger.error({ nameQuery, cityQuery }, "Error fetching catalog trainers")
    return { error: "Nie udało się pobrać danych. Spróbuj odświeżyć stronę." }
  }
}

export async function getCatalogTrainerBySlug(slug: string) {
  const logger = await getLogger()

  logger.info({ slug }, "Getting catalog trainer by slug")

  try {
    const trainer = await prisma.trainer.findFirst({
      where: {
        slug,
        is_public: true,
      },
      include: {
        user: {
          select: {
            name: true,
            surname: true,
            phone: true,
          },
        },
        workplace: {
          select: {
            id: true,
            name: true,
            street: true,
            building_number: true,
            flat_number: true,
            city: true,
          },
        },
      },
    })

    if (!trainer) {
      logger.info({ slug }, "Catalog trainer not found by slug")
      return { success: true as const, data: null }
    }

    logger.info({ slug }, "Catalog trainer found by slug")

    return {
      success: true as const,
      data: {
        id: trainer.id,
        slug: trainer.slug,
        name: `${trainer.user.name} ${trainer.user.surname}`,
        phone: trainer.user.phone,
        workDescription: trainer.work_description,
        pricePerTraining: trainer.price_per_training,
        workplaces: trainer.workplace,
      },
    }
  } catch {
    logger.error({ slug }, "Error getting catalog trainer by slug")
    return { error: "Nie udało się pobrać danych. Spróbuj odświeżyć stronę." }
  }
}
