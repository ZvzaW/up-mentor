import NextAuth from "next-auth"
import type { JWT } from "next-auth/jwt"
import Credentials from "next-auth/providers/credentials"
import { authConfig } from "./auth.config"
import { prisma } from "@/lib/prisma"
import * as argon2 from "argon2"
import crypto from "node:crypto"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user || !user.password) return null
        const isValid = await argon2.verify(
          user.password,
          credentials.password as string
        )
        if (!isValid) return null

        return {
          id: user.id,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        const refreshToken = crypto.randomBytes(40).toString("hex")
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

        await prisma.refresh_token.create({
          data: {
            user_id: user.id!,
            token: refreshToken,
            expires_at: expiresAt,
          },
        })

        return {
          ...token,
          accessToken: crypto.randomBytes(20).toString("hex"),
          accessTokenExpires: Date.now() + 15 * 60 * 1000,
          refreshToken: refreshToken,
          id: user.id!,
          role: user.role,
        }
      }

      const t = token as JWT

      if (Date.now() < t.accessTokenExpires) {
        return token
      }

      return await refreshAccessToken(t)
    },
  },
})

async function refreshAccessToken(token: JWT) {
  try {
    const storedToken = await prisma.refresh_token.findUnique({
      where: { token: token.refreshToken },
    })

    if (!storedToken || storedToken.expires_at < new Date()) {
      throw new Error("RefreshTokenExpired")
    }

    return {
      ...token,
      accessToken: crypto.randomBytes(20).toString("hex"),
      accessTokenExpires: Date.now() + 15 * 60 * 1000,
    }
  } catch {
    return { ...token, error: "RefreshTokenError" as const }
  }
}
