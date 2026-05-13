"use client"

import { useEffect } from "react"
import { signOut } from "next-auth/react"

export default function LogoutTrigger() {
  useEffect(() => {
    signOut({ callbackUrl: "/" })
  }, [])

  return null
}