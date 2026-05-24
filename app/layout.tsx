import type { Metadata } from "next"
import { Mina, Michroma } from "next/font/google"
import { AuthProvider } from "@/components/providers/session-provider"
import "./globals.css"
import { auth } from "@/auth"
import { Toaster } from "sonner"

const mina = Mina({
  subsets: ["latin", "latin-ext"],
  variable: "--font-mina",
  weight: "400",
})

const michroma = Michroma({
  subsets: ["latin", "latin-ext"],
  weight: "400",
  variable: "--font-michroma",
})

export const metadata: Metadata = {
  title: "UpMentor",
  description: "Aplikacja dla trenerów personalnych i podopiecznych",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  return (
    <html lang="pl">
      <body
        className={`${mina.className} ${michroma.variable} overflow-x-hidden antialiased`}
      >
        <AuthProvider session={session}>
          {children}
          <Toaster richColors theme="dark" position="top-right" />
        </AuthProvider>
      </body>
    </html>
  )
}
