import { DefaultSession } from "next-auth"
import { user_role } from "@prisma/client"

declare module "next-auth" {
  interface User {
    role: user_role
  }

  interface Session {
    error?: "RefreshTokenError"
    user: {
      id: string
      role: user_role
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken: string
    refreshToken: string
    refreshTokenId: string
    accessTokenExpires: number
    role: user_role
    id: string
    error?: "RefreshTokenError"
  }
}
