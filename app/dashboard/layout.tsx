import { auth } from "@/auth"
import Navbar from "@/components/layout/navbar"
import LogoutTrigger from "@/components/auth/logout-trigger"
import { DashboardRoleProvider } from "@/components/providers/dashboard-role-provider"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user?.role) {
    redirect("/?unauthorized=true")
  }
  const userRole = session.user.role

  const hasAuthError = session?.error === "RefreshTokenError"

  return (
    <DashboardRoleProvider role={userRole}>
      <div className="flex min-h-screen flex-col">
        {hasAuthError && <LogoutTrigger />}

        <Navbar role={userRole} />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </DashboardRoleProvider>
  )
}
