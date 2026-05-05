"use client"

import { useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import Navbar from "@/components/layout/navbar" 

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()

  useEffect(() => {
    if (session?.error === "RefreshTokenError") {
      signOut({ callbackUrl: "/" })
    }
  }, [session])

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="border-baby-blue h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"></div>
      </div>
    )
  }

  const userRole = session?.user?.role || ""

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar role={userRole} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}