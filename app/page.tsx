"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { login } from "@/actions/authorization"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  const searchParams = useSearchParams()
  const router = useRouter()
  const isRegistered = searchParams.get("registered") === "true"
  const isUnauthorized = searchParams.get("unauthorized") === "true"
  const isCallBack = searchParams.get("callbackUrl")
  const hasShownRegisteredToast = useRef(false)
  const hasShownUnauthorizedToast = useRef(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      const result = await login({ email, password })

      if (result?.error) {
        setLoginError(result.error)
      } else {
        window.location.href = "/dashboard"
      }
    } catch (error) {
      toast.error("Wystąpił nieoczekiwany błąd.")
    } finally {
      setIsPending(false)
    }
  }

  useEffect(() => {
    if (isRegistered && !hasShownRegisteredToast.current) {
      hasShownRegisteredToast.current = true
      toast.success("Konto utworzone pomyślnie!", {
        description: "Możesz się teraz zalogować.",
        duration: 5000,
      })
    }
  }, [isRegistered, searchParams, router])

  useEffect(() => {
    if ((isUnauthorized || isCallBack) && !hasShownUnauthorizedToast.current) {
      hasShownUnauthorizedToast.current = true

      setTimeout(() => {
        toast.warning("Sesja wygasła!", {
          description: "Zaloguj się ponownie.",
          duration: 5000,
        })
      }, 100)
    }
  }, [isUnauthorized, isCallBack, searchParams, router])

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="font-michroma text-2xl">Logowanie</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit}
            onChange={() => setLoginError(null)}
            className="space-y-6"
          >
            {/* EMAIL*/}
            <div className="space-y-1.5">
              <Label htmlFor="email">Adres e-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="anna@example.com"
                disabled={isPending}
                required
              />
            </div>

            {/* PASSWORD*/}
            <div className="space-y-1.5">
              <Label htmlFor="password">Hasło</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  disabled={isPending}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 right-3.5 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="flex justify-start pt-1 pl-1">
                <Link
                  href="/forgot-password"
                  className="text-baby-blue text-xs hover:underline"
                >
                  Zapomniałeś hasła?
                </Link>
              </div>
            </div>

            {loginError && (
              <Alert variant="destructive" className="mx-auto">
                <AlertDescription>{loginError}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="animate-spin" />
                </>
              ) : (
                "Zaloguj się"
              )}
            </Button>
          </form>

          <div className="pt-6 text-center text-sm text-zinc-400">
            Nie masz jeszcze konta?{" "}
            <Link href="/register" className="text-baby-blue hover:underline">
              Zarejestruj się
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
