"use server"

import * as argon2 from "argon2"

import { auth } from "@/auth"
import { getAuthJwt, hashToken } from "@/lib/auth-tokens"
import { prisma } from "@/lib/prisma"
import { changePasswordSchema } from "@/lib/validations"
import { redirect } from "next/navigation"
import nodemailer from "nodemailer"
import crypto from "node:crypto"
import { emailSchema } from "@/lib/validations"
import { resetPasswordSchema } from "@/lib/validations"
import { getLogger } from "@/lib/server-logger"

export async function changePassword(input: unknown) {
  const logger = await getLogger()

  const session = await auth()
  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  const userId = session.user.id

  logger.info({ userId }, "Changing password")

  const validated = changePasswordSchema.safeParse(input)
  if (!validated.success) return { error: "Nieprawidłowe dane wejściowe." }

  const { currentPassword, newPassword, logoutOtherDevices } = validated.data
  const jwt = await getAuthJwt()
  const currentRefreshTokenId = jwt?.refreshTokenId ?? null

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  })

  if (!user?.password)
    return { error: "Nie można zmienić hasła dla tego konta." }

  const ok = await argon2.verify(user.password, currentPassword)
  if (!ok) return { error: "Obecne hasło jest nieprawidłowe" }

  const hashed = await argon2.hash(newPassword)

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashed },
    })

    if (logoutOtherDevices && currentRefreshTokenId) {
      await prisma.refresh_token.deleteMany({
        where: {
          user_id: session.user.id,
          id: {
            not: currentRefreshTokenId,
          },
        },
      })
    }

    logger.info({ userId }, "Password changed successfully")
  } catch (error) {
    logger.error({ userId }, "Error changing password")
    return { error: "Wystąpił błąd podczas zmiany hasła. Spróbuj ponownie." }
  }

  return { success: true as const }
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
  const logger = await getLogger()

  logger.info("Requesting password reset")

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

  const token = crypto.randomBytes(32).toString("hex")
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

  try {
    await prisma.password_reset_token.deleteMany({
      where: { user_id: user.id },
    })

    await prisma.password_reset_token.create({
      data: {
        user_id: user.id,
        token: tokenHash,
        expires_at: expiresAt,
      },
    })

    const resetLink = `${getBaseUrl()}/reset-password?token=${token}`

    await transporter.sendMail({
      from: '"Up-Mentor" <no-reply@upmentor.pl>',
      to: user.email,
      subject: "Reset hasła",
      html: `
          <p>Cześć ${user.name},</p>
          <p>Otrzymaliśmy prośbę o reset hasła.</p>
          <p>Kliknij poniższy link, aby ustawić nowe hasło (ważny 15 minut):</p>
          <p><a href="${resetLink}">${resetLink}</a></p>
          <p>Jeśli to nie Ty wysłałeś/aś te prośbę, zignoruj tę wiadomość.</p>
          <p>Pozdrawiamy,<br/>Zespół Up-mentor</p>
        `,
    })

    logger.info("Password reset email sent successfully")
    return { success: true }
  } catch (error) {
    logger.error("Error requesting password reset")
    await prisma.password_reset_token.deleteMany({
      where: { token: tokenHash },
    })

    return { error: "Wystąpił błąd podczas wysyłania linka. Spróbuj ponownie." }
  }
}

export async function resetPassword(input: {
  token: string
  password: string
  confirmPassword: string
}) {
  const logger = await getLogger()

  logger.info("Resetting password")

  const validated = resetPasswordSchema.safeParse(input)

  if (!validated.success) {
    return { error: "Nieprawidłowe dane wejściowe." }
  }

  const { token, password } = validated.data
  const tokenHash = hashToken(token)

  try {
    const tokenRecord = await prisma.password_reset_token.findUnique({
      where: { token: tokenHash },
      select: { token: true, user_id: true, expires_at: true },
    })

    if (!tokenRecord || tokenRecord.expires_at < new Date()) {
      if (tokenRecord) {
        await prisma.password_reset_token.deleteMany({
          where: { token: tokenHash },
        })
      }
      logger.error("Token not found or expired")
      return { error: "Link jest nieprawidłowy lub wygasł." }
    }

    const hashedPassword = await argon2.hash(password)

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: tokenRecord.user_id },
        data: { password: hashedPassword },
      })

      await tx.password_reset_token.deleteMany({
        where: { user_id: tokenRecord.user_id },
      })

      await tx.refresh_token.deleteMany({
        where: { user_id: tokenRecord.user_id },
      })
    })

    logger.info("Password reset successfully")
    return { success: true }
  } catch (error) {
    logger.error("Error resetting password")
    return {
      error: "Wystąpił błąd podczas resetowania hasła. Spróbuj ponownie.",
    }
  }
}
