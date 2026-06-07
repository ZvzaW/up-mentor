"use server"

import { prisma } from "@/lib/prisma"
import {
  generateUniqueTraineeSlug,
  generateUniqueTrainerSlug,
} from "@/lib/slug"
import {
  RegisterTraineeFormValues,
  registerTraineeSchema,
  RegisterTrainerFormValues,
  registerTrainerSchema,
} from "@/lib/validations"
import { Prisma, user_role } from "@prisma/client"
import * as argon2 from "argon2"
import { redirect } from "next/navigation"
import { signOut, auth } from "@/auth"
import { signIn } from "@/auth"
import { getAuthJwt } from "@/lib/auth-tokens"
import { AuthError } from "next-auth"
import { getLogger } from "@/lib/server-logger"

export async function register(
  formData: RegisterTraineeFormValues | RegisterTrainerFormValues,
  role: user_role
) {
  const logger = await getLogger()

  logger.info({role}, "Registering user")

  const schema =
    role === user_role.trainer ? registerTrainerSchema : registerTraineeSchema
  const validatedFields = schema.safeParse(formData)

  if (!validatedFields.success)
    return { error: "Nieprawidłowe dane wejściowe." }

  const data = validatedFields.data
  const hashedPassword = await argon2.hash(data.password)

  let generatedSlug = ""

  if (role === user_role.trainer) {
    generatedSlug = await generateUniqueTrainerSlug(data.name, data.surname)
  } else {
    generatedSlug = await generateUniqueTraineeSlug(data.name, data.surname)
  }

  try {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const newUser = await tx.user.create({
        data: {
          name: data.name.trim(),
          surname: data.surname.trim(),
          email: data.email.trim().toLowerCase(),
          phone: data.phone.trim(),
          password: hashedPassword,
          role: role,
        },
      })

      if (role === user_role.trainer) {
        const d = data as RegisterTrainerFormValues
        await tx.trainer.create({
          data: { id: newUser.id, slug: generatedSlug },
        })
        await tx.workplace.create({
          data: {
            trainer_id: newUser.id,
            name: d.workplaceName.trim(),
            street: d.street.trim(),
            building_number: d.buildingNumber.trim(),
            flat_number: d.flatNumber?.trim() || null,
            city: d.city.trim(),
          },
        })
      } else {
        const d = data as RegisterTraineeFormValues
        await tx.trainee.create({
          data: {
            id: newUser.id,
            birthdate: new Date(d.birthdate),
            slug: generatedSlug,
          },
        })
      }
    })

    logger.info({role}, "User registered successfully")
  } catch (error) {
    logger.error({role}, "Error registering user")

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    )
      return { error: "Ten e-mail jest już zajęty!" }
    return { error: "Wystąpił błąd podczas rejestracji, spróbuj ponownie." }
  }

  redirect("/?registered=true")
}

export async function login(data: { email: string; password: string }) {
  const logger = await getLogger()

  const email = data.email
  const password = data.password

  logger.info("Logging in user")

  if (!email || !password) {
    return { error: "Wypełnij wszystkie pola!" }
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    logger.info("User logged in successfully")
  } catch (error) {
    logger.error("Error logging in user")
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Błędny e-mail lub hasło!" }
        default:
          return { error: "Wystąpił błąd podczas logowania. Spróbuj ponownie." }
      }
    }
    throw error
  }
}

export async function logout() {
  const logger = await getLogger()

  const jwt = await getAuthJwt()
  const refreshTokenId = jwt?.refreshTokenId

  logger.info("Logging out user")

  try {
    if (refreshTokenId) {
      await prisma.refresh_token.delete({
        where: { id: refreshTokenId },
      })
    }

    logger.info("User logged out successfully")
  } catch (error) {
    logger.error("Error logging out user")
    return { error: "Wystąpił błąd podczas wylogowywania. Spróbuj ponownie." }
  }

  await signOut({ redirectTo: "/" })
}

export async function logoutAllDevices() {
  const logger = await getLogger()

  const session = await auth()
  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  const userId = session.user.id

  logger.info({ userId }, "Logging out user from all devices")

  try {
    await prisma.refresh_token.deleteMany({
      where: {
        user_id: userId,
      },
    })

    logger.info({ userId }, "User logged out from all devices successfully")
  } catch (error) {
    logger.error({ userId }, "Error logging out user from all devices")
    return {
      error:
        "Wystąpił błąd podczas wylogowywania ze wszystkich urządzeń. Spróbuj ponownie.",
    }
  }

  await signOut({ redirectTo: "/" })
}
