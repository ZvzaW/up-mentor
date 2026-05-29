"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

type PublicTrainersCatalogFilters = {
  name?: string
  city?: string
}

export async function getCatalogTrainers(
  filters?: PublicTrainersCatalogFilters
) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== "trainee") {
    return { error: "Brak uprawnień do tej operacji." }
  }

  const nameQuery = filters?.name?.trim()
  const cityQuery = filters?.city?.trim()

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

    const trainers = await prisma.trainer.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
            surname: true,
          },
        },
        workplace: {
          select: {
            city: true,
          },
          orderBy: {
            city: "asc",
          },
        },
        opinion: {
          select: {
            rate: true,
          },
        },
      },
    })

    const data = trainers.map((trainer) => {
      const averageRate =
        trainer.opinion.length > 0
          ? Number(
              (
                trainer.opinion.reduce(
                  (sum, opinion) => sum + opinion.rate,
                  0
                ) / trainer.opinion.length
              ).toFixed(1)
            )
          : null

      return {
        id: trainer.id,
        slug: trainer.slug,
        name: `${trainer.user.name} ${trainer.user.surname}`,
        workplaces: Array.from(
          new Set(trainer.workplace.map((workplace) => workplace.city))
        ),
        averageRate,
      }
    })

    return { success: true as const, data }
  } catch (error) {
    console.error("[GET_CATALOG_TRAINERS_ERROR]:", new Date().toLocaleString("pl-PL"), error)
    return { error: "Nie udało się pobrać danych. Spróbuj odświeżyć stronę." }
  }
}

export async function getCatalogTrainerBySlug(slug: string) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== "trainee") {
    return { error: "Brak uprawnień do tej operacji." }
  }

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
      return { success: true as const, data: null }
    }

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
  } catch (error) {
    console.error("[GET_CATALOG_TRAINER_BY_SLUG_ERROR]:", new Date().toLocaleString("pl-PL"), error)
    return { error: "Nie udało się pobrać danych. Spróbuj odświeżyć stronę." }
  }
}
