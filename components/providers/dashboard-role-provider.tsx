"use client"

import { createContext, useContext } from "react"

const DashboardRoleContext = createContext<string>("")

export function DashboardRoleProvider({
  role,
  children,
}: {
  role: string
  children: React.ReactNode
}) {
  return (
    <DashboardRoleContext.Provider value={role}>
      {children}
    </DashboardRoleContext.Provider>
  )
}

export function useDashboardRole() {
  return useContext(DashboardRoleContext)
}
