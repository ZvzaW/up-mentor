import { decode } from "next-auth/jwt"
import type { JWT } from "next-auth/jwt"
import { cookies } from "next/headers"
import crypto from "node:crypto"

const SESSION_COOKIE =
  process.env.NODE_ENV === "production"
    ? "__Secure-authjs.session-token"
    : "authjs.session-token"

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex")
}

export async function getAuthJwt(): Promise<JWT | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE)

  if (!sessionCookie?.value || !process.env.AUTH_SECRET) {
    return null
  }

  const token = await decode({
    token: sessionCookie.value,
    secret: process.env.AUTH_SECRET,
    salt: SESSION_COOKIE,
  })

  return token as JWT | null
}
