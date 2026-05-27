"use server"

import { prisma } from "@/lib/prisma"
import {
  generateUniqueTraineeSlug,
  generateUniqueTrainerSlug,
} from "@/lib/slug"
import {
  RegisterTraineeFormValues,
  emailSchema,
  registerTraineeSchema,
  RegisterTrainerFormValues,
  registerTrainerSchema,
  resetPasswordActionSchema,
} from "@/lib/validations"
import { Prisma } from "@prisma/client"
import * as argon2 from "argon2"
import { redirect } from "next/navigation"
import { signOut, auth } from "@/auth"
import { signIn } from "@/auth"
import { AuthError } from "next-auth"
import nodemailer from "nodemailer"
import crypto from "node:crypto"
import { error } from "node:console"

export async function register(
  formData: RegisterTraineeFormValues | RegisterTrainerFormValues,
  role: "trainee" | "trainer"
) {
  const schema =
    role === "trainer" ? registerTrainerSchema : registerTraineeSchema
  const validatedFields = schema.safeParse(formData)

  if (!validatedFields.success)
    return { error: "Nieprawidłowe dane wejściowe." }

  const data = validatedFields.data
  const hashedPassword = await argon2.hash(data.password)

  let generatedSlug = ""

  if (role === "trainer") {
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

      if (role === "trainer") {
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
  } catch (error: any) {
    if (error.code === "P2002") return { error: "Ten e-mail jest już zajęty!" }
    return { error: "Wystąpił błąd podczas rejestracji, spróbuj ponownie." }
  }

  redirect("/?registered=true")
}

export async function login(data: { email: string; password: string }) {
  const email = data.email
  const password = data.password

  if (!email || !password) {
    return { error: "Wypełnij wszystkie pola!" }
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    })
  } catch (error) {
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
  const session = await auth()
  const tokenToDelete = session?.refreshToken

  try {
    if (tokenToDelete) {
      await prisma.refresh_token.deleteMany({
        where: { token: tokenToDelete },
      })
    }
  } catch {
    return { error: "Wystąpił błąd podczas wylogowywania. Spróbuj ponownie." }
  }

  await signOut({ redirectTo: "/" })
}

export async function logoutAllDevices() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  try {
    await prisma.refresh_token.deleteMany({
      where: {
        user_id: session.user.id,
      },
    })
  } catch {
    return {
      error:
        "Wystąpił błąd podczas wylogowywania ze wszystkich urządzeń. Spróbuj ponownie.",
    }
  }

  await signOut({ redirectTo: "/" })
}


//-------------RESET PASSWORD-----------------

const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST,
  port: Number(process.env.MAILTRAP_PORT),
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS,
  },
})

function getBaseUrl() {
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL
  if (process.env.AUTH_URL) return process.env.AUTH_URL
  return "https://localhost:3000"
}

export async function requestPasswordReset(emailInput: string) {
  const validated = emailSchema.safeParse({
    email: emailInput,
  })

  if (!validated.success) {
    return { error: "Podaj poprawny adres e-mail." }
  }

  const email = validated.data.email.trim().toLowerCase()

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true },
  })

  if (!user) {
    return { success: true }
  }

  const rawToken = crypto.randomBytes(32).toString("hex")
  const storedToken = `reset_password_${rawToken}`
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

  try {
    await prisma.refresh_token.create({
    data: {
      user_id: user.id,
      token: storedToken,
      expires_at: expiresAt,
    },
  })

  const resetLink = `${getBaseUrl()}/reset-password?token=${rawToken}`

    await transporter.sendMail({
      from: '"Upmentor" <no-reply@upmentor.pl>',
      to: user.email,
      subject: "Reset hasła",
      html: `
        <p>Cześć ${user.name},</p>
        <p>Otrzymaliśmy prośbę o reset hasła.</p>
        <p>Kliknij poniższy link, aby ustawić nowe hasło (ważny 15 minut):</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p>Jeśli to nie Ty wysłałeś/aś te prośbę, zignoruj tę wiadomość.</p>
      `,
    })
  } catch (error) {
    console.error("[REQUEST_PASSWORD_RESET_ERROR]:", error)
    await prisma.refresh_token.deleteMany({
      where: { token: storedToken },
    })

    return { error: "Wystąpił błąd podczas wysyłania linka. Spróbuj ponownie." }
  }
}


export async function resetPassword(input: {
  token: string
  password: string
  confirmPassword: string
}) {
  const validated = resetPasswordActionSchema.safeParse(input)

  if (!validated.success) {
    return { error: "Nieprawidłowe dane wejściowe." }
  }

  const { token, password } = validated.data
  const storedToken = `reset_password_${token}`

  try { 
  const tokenRecord = await prisma.refresh_token.findUnique({
    where: { token: storedToken },
    select: { token: true, user_id: true, expires_at: true },
  })

  if (!tokenRecord || tokenRecord.expires_at < new Date()) {
    if (tokenRecord) {
      await prisma.refresh_token.deleteMany({
        where: { token: storedToken },
      })
    }
    return { error: "Link jest nieprawidłowy lub wygasł." }
  }

  const hashedPassword = await argon2.hash(password)

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: tokenRecord.user_id },
      data: { password: hashedPassword },
    })

    await tx.refresh_token.deleteMany({
      where: {
        OR: [{ user_id: tokenRecord.user_id }, { token: storedToken }],
      },
    })
    })

    return { success: true }
  } catch (error) {
    console.error("[RESET_PASSWORD_ERROR]:", error)
    return { error: "Wystąpił błąd podczas resetowania hasła. Spróbuj ponownie." }
  }
}
