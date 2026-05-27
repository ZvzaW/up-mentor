"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { resetPassword } from "@/actions/authorization"
import { PasswordInput } from "@/components/common/password-input"
import { Button } from "@/components/ui/button"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  resetPasswordFormSchema,
  type ResetPasswordValues,
} from "@/lib/validations"

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const token = useMemo(() => searchParams.get("token")?.trim() ?? "", [searchParams])

  const [isPending, setIsPending] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  const isTokenMissing = !token

  const handleSubmit = async (values: ResetPasswordValues) => {
    setIsPending(true)
    setError(null)

    const result = await resetPassword({
      token,
      password: values.password,
      confirmPassword: values.confirmPassword,
    })

    if (result?.error) {
      setError(result.error)
      setIsPending(false)
      return
    }

    setIsSubmitted(true)
    setIsPending(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="font-michroma text-2xl">Nowe hasło</CardTitle>
          <CardDescription >
            Ustaw nowe hasło do swojego konta
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isSubmitted ? (
            <div className="flex flex-col items-center justify-center text-center">
              <div className="bg-baby-blue/10 mb-2 flex h-16 w-16 items-center justify-center rounded-full">
                <CheckCircle2 className="text-baby-blue" size={30} />
              </div>
              <p className="mt-3 text-sm text-zinc-300">
                Hasło zostało pomyślnie zmienione. Możesz się teraz zalogować.
              </p>
            </div>
          ) : isTokenMissing ? (
            <Alert variant="destructive">
              <AlertDescription>
                Brakuje tokenu resetowania. Otwórz link z wiadomości e-mail.
              </AlertDescription>
            </Alert>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-6"
                onChange={() => setError(null)}
              >
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nowe hasło *</FormLabel>
                      <FormControl>
                        <PasswordInput
                          id="password"
                          disabled={isPending}
                          {...field}
                          onChange={(e) => {
                            setError(null)
                            field.onChange(e)
                          }}
                        />
                      </FormControl>
                      <FormDescription className="flex justify-between">
                          <span>
                            Min. 8 znaków: małe i wielkie litery, cyfry
                          </span>
                        </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Potwierdź nowe hasło *</FormLabel>
                      <FormControl>
                        <PasswordInput
                          id="confirmPassword"
                          disabled={isPending}
                          {...field}
                          onChange={(e) => {
                            setError(null)
                            field.onChange(e)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {error && (
                  <Alert variant="destructive" className="mx-auto">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                 
                <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending ? (
                  <>
                    <Loader2 className="animate-spin" />
                  </>
                ) : (
                  "Zmień hasło"
                )} 
                </Button>
              </form>
            </Form>
          )}

          <div className="mt-7 text-center">
            <Link
              href="/"
              className="hover:text-baby-blue inline-flex items-center text-sm text-zinc-400"
            >
              <ArrowLeft className="mr-2" size={16} />
              Wróć do logowania
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
