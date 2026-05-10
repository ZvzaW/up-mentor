import type { Prisma } from "@prisma/client"
import { prisma } from "./prisma"
import slugifyLib from "slugify"

export function slugify(text: string): string {
  return slugifyLib(text, { lower: true, strict: true })
}

export async function generateUniqueTrainerSlug(
  name: string,
  surname: string
): Promise<string> {
  const baseSlug = slugify(`${name}-${surname}`)
  let uniqueSlug = baseSlug
  let counter = 1

  while (true) {
    const existingTrainer = await prisma.trainer.findUnique({
      where: { slug: uniqueSlug } as unknown as Prisma.trainerWhereUniqueInput,
    })

    if (!existingTrainer) {
      return uniqueSlug
    }

    uniqueSlug = `${baseSlug}-${counter}`
    counter++
  }
}

export async function generateUniqueTraineeSlug(
  name: string,
  surname: string
): Promise<string> {
  const baseSlug = slugify(`${name}-${surname}`)
  let uniqueSlug = baseSlug
  let counter = 1

  while (true) {
    const existingTrainee = await prisma.trainee.findUnique({
      where: { slug: uniqueSlug } as unknown as Prisma.traineeWhereUniqueInput,
    })

    if (!existingTrainee) {
      return uniqueSlug
    }

    uniqueSlug = `${baseSlug}-${counter}`
    counter++
  }
}
