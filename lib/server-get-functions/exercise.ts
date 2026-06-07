import { prisma } from "@/lib/prisma"
import { cooperation_status, Prisma, user_role } from "@prisma/client"
import { getLogger } from "@/lib/server-logger"

async function exerciseVisibility(
  userId: string,
  role: user_role
): Promise<Prisma.exerciseWhereInput> {
  const predefined: Prisma.exerciseWhereInput = { trainer_id: null }

  if (role === user_role.trainer) {
    return {
      OR: [predefined, { trainer_id: userId }],
    }
  }

  if (role === user_role.trainee) {
    const cooperations = await prisma.cooperation.findMany({
      where: {
        trainee_id: userId,
        status: cooperation_status.active,
      },
      select: { trainer_id: true },
    })
    const trainerIds = [...new Set(cooperations.map((c) => c.trainer_id))]
    const or: Prisma.exerciseWhereInput[] = [predefined]
    if (trainerIds.length > 0) {
      or.push({ trainer_id: { in: trainerIds } })
    }
    return { OR: or }
  }

  return { id: { in: [] } }
}

export async function getExercises(userId: string, role: user_role) {
  const logger = await getLogger()

  logger.info({ userId, role }, "Fetching exercises")

  try {
    const visibility = await exerciseVisibility(userId, role)

    const data = await prisma.exercise.findMany({
      where: visibility,
      select: {
        id: true,
        name: true,
        body_part: true,
        video_url: true,
        trainer_id: true,
      },
      orderBy: { name: "asc" },
    })

    logger.info({ userId, role }, "Exercises fetched successfully")
    return { success: true as const, data }
  } catch {
    logger.error({ userId, role }, "Error fetching exercises")
    return { error: "Nie udało się pobrać ćwiczeń. Spróbuj odświeżyć stronę." }
  }
}
