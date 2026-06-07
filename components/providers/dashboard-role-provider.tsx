"use client"

import { createContext, useContext } from "react"
import  { user_role } from "@prisma/client"

interface DashboardRoleProviderProps {
  role: user_role
  children: React.ReactNode
}

const DashboardRoleContext = createContext<user_role | null>(null)

export function DashboardRoleProvider({ role, children }: DashboardRoleProviderProps) {
  return (
    <DashboardRoleContext.Provider value={role}>
      {children}
    </DashboardRoleContext.Provider>
  )
}

export function useDashboardRole() {
  return useContext(DashboardRoleContext)
}
