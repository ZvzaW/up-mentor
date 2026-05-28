"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, MailCheck } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { requestPasswordReset } from "@/actions/password"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  emailSchema,
  type EmailValues,
} from "@/lib/validations"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: "",
    },
  })

  const handleSubmit = async (values: EmailValues) => {
    setIsPending(true)
    setError(null)

    const result = await requestPasswordReset(values.email)

    if (result?.error) {
      setError(result.error)
      setIsPending(false)
      return
    }

    setEmail(values.email)
    setIsSubmitted(true)
    setIsPending(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="font-michroma text-2xl">
            Zresetuj hasło
          </CardTitle>
          <CardDescription className="text-zinc-400">
            {isSubmitted
              ? "Sprawdź swoją skrzynkę pocztową"
              : "Podaj swój adres e-mail, aby otrzymać instrukcję do resetowania hasła"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {!isSubmitted ? (
            /*FORM*/
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-6"
                onChange={() => setError(null)}
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adres e-mail*</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="anna@example.com"
                          disabled={isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="animate-spin" />
                    </>
                  ) : (
                    "Wyślij link resetujący"
                  )}
                </Button>
              </form>
            </Form>
          ) : (
            <div className="flex flex-col items-center justify-center text-center">
              <div className="bg-baby-blue/10 mb-2 flex h-16 w-16 items-center justify-center rounded-full">
                <MailCheck className="text-baby-blue" size={30} />
              </div>

              <p className="mt-3 text-sm text-zinc-300"> Jeśli istnieje konto z podanym adresem e-mail, wysłaliśmy link do zmiany hasła. </p>
              <p className="mt-3 font-semibold ">{email}</p>
            </div>
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
