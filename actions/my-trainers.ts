"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { formatWorkplaceAddress } from "@/lib/utils"
import { WorkplaceAddress } from "@/lib/types"

export async function getMyTrainers() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== "trainee") {
    return { error: "Brak uprawnień do tej operacji." }
  }

  try {
    const cooperations = await prisma.cooperation.findMany({
      where: {
        trainee_id: session.user.id,
        status: "active",
      },
      include: {
        trainer: {
          include: {
            user: {
              select: {
                name: true,
                surname: true,
                phone: true,
              },
            },
          },
        },
        workplace: {
          select: {
            name: true,
            street: true,
            city: true,
            building_number: true,
            flat_number: true,
          },
        },
      },
    })

    const mappedCooperations = cooperations.map((cooperation) => ({
      key: cooperation.trainer_id,
      name: `${cooperation.trainer.user.name} ${cooperation.trainer.user.surname}`,
      workplace: formatWorkplaceAddress(cooperation.workplace as WorkplaceAddress),
      slug: cooperation.trainer.slug,
    }))

    return { success: true, data: mappedCooperations }
  } catch {
    return { error: "Nie udało się pobrać danych. Spróbuj odświeżyć stronę." }
  }
}

export async function getMyTrainerBySlug(slug: string) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== "trainee") {
    return { error: "Brak uprawnień do tej operacji." }
  }

  try {
    const cooperation = await prisma.cooperation.findFirst({
      where: {
        trainee_id: session.user.id,
        status: "active",
        trainer: {
          slug,
        },
      },
      include: {
        trainer: {
          include: {
            user: {
              select: {
                name: true,
                surname: true,
                phone: true,
              },
            },
          },
        },
        workplace: {
          select: {
            name: true,
            street: true,
            city: true,
            building_number: true,
            flat_number: true,
          },
        },
      },
    })

    return { success: true, data: cooperation }
  } catch {
    return { error: "Nie udało się pobrać danych. Spróbuj odświeżyć stronę." }
  }
}

export async function countCooperations() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== "trainee") {
    return { error: "Brak uprawnień do tej operacji." }
  }

  try {
    const count = await prisma.cooperation.count({
      where: {
        trainee_id: session.user.id,
        status: "active",
      },
    })

    return { success: true, data: count}
  } catch {
    return { error: "Nie udało się pobrać danych. Spróbuj odświeżyć stronę." }
  }
}
