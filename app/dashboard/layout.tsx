import { auth } from "@/auth"
import Navbar from "@/components/layout/navbar"
import LogoutTrigger from "@/components/auth/logout-trigger"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  const userRole = (session?.user as any)?.role || ""

  const hasAuthError = session?.error === "RefreshTokenError"

  return (
    <div className="flex min-h-screen flex-col">
      {hasAuthError && <LogoutTrigger />}

      <Navbar role={userRole} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
