"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import {
  coachingRequestSchema,
  type CoachingRequestInput,
} from "@/lib/validations"
import { redirect } from "next/navigation"
import { formatWorkplaceAddress } from "@/lib/utils"
import { WorkplaceAddress } from "@/lib/types"

export async function sendCoachingRequest(data: CoachingRequestInput) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== "trainee") {
    return { error: "Brak uprawnień do tej operacji." }
  }

  const validated = coachingRequestSchema.safeParse(data)
  if (!validated.success) {
    return { error: "Nieprawidłowe dane wejściowe." }
  }

  const traineeId = session.user.id
  const { trainer_id, workplace_id, message } = validated.data

  try {
    const existingRequest = await prisma.coaching_request.findUnique({
      where: {
        trainer_id_trainee_id: { trainer_id, trainee_id: traineeId },
      },
    })

    if (existingRequest) {
      return { error: "Wysłałeś już prośbę o współpracę do tego trenera." }
    }

    const existingCooperation = await prisma.cooperation.findUnique({
      where: {
        trainer_id_trainee_id: { trainer_id, trainee_id: traineeId },
      },
    })

    if (existingCooperation) {
      return { error: "Posiadasz już aktywną współpracę z tym trenerem." }
    }

    await prisma.coaching_request.create({
      data: {
        trainee_id: traineeId,
        trainer_id: trainer_id,
        workplace_id: workplace_id,
        message: message,
      },
    })

    revalidatePath("/dashboard/trainers/catalog")
    return { success: true }
  } catch {
    return {
      error: "Wystąpił błąd podczas wysyłania prośby. Spróbuj ponownie.",
    }
  }
}

export async function deleteCoachingRequest(trainerId: string) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== "trainee") {
    return { error: "Brak uprawnień do tej operacji." }
  }

  const traineeId = session.user.id

  try {
    await prisma.coaching_request.delete({
      where: {
        trainer_id_trainee_id: {
          trainer_id: trainerId,
          trainee_id: traineeId,
        },
      },
    })

    revalidatePath("/dashboard/trainers/catalog")
    return { success: true }
  } catch {
    return { error: "Wystąpił błąd podczas usuwania danych. Spróbuj ponownie." }
  }
}

export async function getCooperationStatus(trainerId: string) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  const traineeId = session.user.id

  const [request, cooperation] = await Promise.all([
    prisma.coaching_request.findUnique({
      where: {
        trainer_id_trainee_id: { trainer_id: trainerId, trainee_id: traineeId },
      },
    }),
    prisma.cooperation.findUnique({
      where: {
        trainer_id_trainee_id: { trainer_id: trainerId, trainee_id: traineeId },
      },
    }),
  ])

  return {
    hasRequest: !!request,
    hasCooperation: !!cooperation,
  }
}

export async function getPendingRequests() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== "trainer") {
    return { error: "Brak uprawnień do tej operacji." }
  }

  const trainerId = session.user.id

  try {
    const requests = await prisma.coaching_request.findMany({
      where: {
        trainer_id: trainerId,
        status: "pending",
      },
      include: {
        trainee: {
          include: {
            user: {
              select: { name: true, surname: true },
            },
          },
        },
        workplace: {
          select: {
            name: true,
            city: true,
            street: true,
            building_number: true,
            flat_number: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    })

    const mappedRequests = requests.map((req) => ({
      traineeId: req.trainee_id,
      workplaceId: req.workplace_id,
      name: `${req.trainee.user.name} ${req.trainee.user.surname}`,
      message: req.message,
      createdAt: req.created_at,
      workplace: formatWorkplaceAddress(req.workplace as WorkplaceAddress),
    }))

    return { success: true, data: mappedRequests }
  } catch {
    return { error: "Nie udało się pobrać danych. Spróbuj odświeżyć stronę." }
  }
}

export async function acceptRequest(traineeId: string, workplaceId: string) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== "trainer") {
    return { error: "Brak uprawnień do tej operacji." }
  }

  const trainerId = session.user.id

  try {
    await prisma.$transaction([
      prisma.cooperation.create({
        data: {
          trainer_id: trainerId,
          trainee_id: traineeId,
          workplace_id: workplaceId,
          status: "active",
        },
      }),
      prisma.coaching_request.delete({
        where: {
          trainer_id_trainee_id: {
            trainer_id: trainerId,
            trainee_id: traineeId,
          },
        },
      }),
    ])

    revalidatePath("/dashboard/trainees")
    return { success: true }
  } catch {
    return {
      error: "Wystąpił błąd podczas akceptacji prośby. Spróbuj ponownie.",
    }
  }
}

export async function rejectRequest(traineeId: string) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  if (session.user.role !== "trainer") {
    return { error: "Brak uprawnień do tej operacji." }
  }

  const trainerId = session.user.id

  try {
    await prisma.coaching_request.delete({
      where: {
        trainer_id_trainee_id: {
          trainer_id: trainerId,
          trainee_id: traineeId,
        },
      },
    })

    revalidatePath("/dashboard/trainees")
    return { success: true }
  } catch {
    return {
      error: "Wystąpił błąd podczas odrzucania prośby. Spróbuj ponownie.",
    }
  }
}
