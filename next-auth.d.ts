import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface User {
    role: string
  }

  interface Session {
    error?: "RefreshTokenError"
    user: {
      id: string
      role: string
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken: string
    refreshToken: string
    refreshTokenId: string
    accessTokenExpires: number
    role: string
    id: string
    error?: "RefreshTokenError"
  }
}
