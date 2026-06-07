import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const correlationId = req.headers.get("x-correlation-id") || crypto.randomUUID()

  const requestHeaders = new Headers(req.headers)
  requestHeaders.set("x-correlation-id", correlationId)

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  response.headers.set("x-correlation-id", correlationId)

  return response
})

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|avif|ico)).*)",
  ],
}