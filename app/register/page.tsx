"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/common/password-input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import {
  registerTraineeSchema,
  registerTrainerSchema,
  type RegisterTraineeFormValues,
  type RegisterTrainerFormValues,
} from "@/lib/validations"
import { registerAction } from "@/actions/authorization"

const PASSWORD_MAX_LENGTH = 30

export default function RegisterPage() {
  const [activeTab, setActiveTab] = useState<"trainee" | "trainer">("trainee")
  const [traineeError, setTraineeError] = useState<string | null>(null)
  const [trainerError, setTrainerError] = useState<string | null>(null)

  const traineeForm = useForm<RegisterTraineeFormValues>({
    resolver: zodResolver(registerTraineeSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      surname: "",
      email: "",
      phone: "",
      birthdate: "",
      password: "",
      terms: false,
    },
  })

  const trainerForm = useForm<RegisterTrainerFormValues>({
    resolver: zodResolver(registerTrainerSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      surname: "",
      email: "",
      phone: "",
      password: "",
      workplaceName: "",
      street: "",
      buildingNumber: "",
      flatNumber: "",
      city: "",
      terms: false,
    },
  })

  const traineePasswordValue = traineeForm.watch("password") || ""
  const trainerPasswordValue = trainerForm.watch("password") || ""
  const [isPending, setIsPending] = useState(false)

  const handleTabChange = (value: string) => {
    const tab = value === "trainer" ? "trainer" : "trainee"
    setActiveTab(tab)
    setTraineeError(null)
    setTrainerError(null)

    if (tab === "trainee") {
      traineeForm.reset()
    } else {
      trainerForm.reset()
    }
  }

  const onSubmitTrainee = async (data: RegisterTraineeFormValues) => {
    setTraineeError(null)
    setIsPending(true)
    try {
      const result = await registerAction(data, "trainee")
      if (result?.error) {
        setTraineeError(result.error)
      }
    } finally {
      setIsPending(false)
    }
  }

  const onSubmitTrainer = async (data: RegisterTrainerFormValues) => {
    setTrainerError(null)
    setIsPending(true)
    try {
      const result = await registerAction(data, "trainer")
      if (result?.error) {
        setTrainerError(result.error)
      }
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-7 sm:p-10">
      <Card className="w-full max-w-lg">
        <CardHeader className={`text-center`}>
          <CardTitle className="font-michroma pb-2 text-2xl">
            Zarejestruj się
          </CardTitle>
          <CardDescription>Dołącz jako trener lub podopieczny</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="mb-6 grid w-full grid-cols-2">
              <TabsTrigger value="trainee">Podopieczny</TabsTrigger>
              <TabsTrigger value="trainer">Trener</TabsTrigger>
            </TabsList>

            {/* TRAINEE TAB */}
            <TabsContent value="trainee">
              <Form {...traineeForm}>
                <form
                  className="space-y-6"
                  onSubmit={traineeForm.handleSubmit(onSubmitTrainee)}
                  onChange={() => {
                    if (traineeError) setTraineeError(null)
                  }}
                >
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={traineeForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Imię*</FormLabel>
                          <FormControl>
                            <Input placeholder="Anna" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={traineeForm.control}
                      name="surname"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nazwisko*</FormLabel>
                          <FormControl>
                            <Input placeholder="Kowalska" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={traineeForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adres e-mail*</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="anna@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-4">
                    <FormField
                      control={traineeForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Numer telefonu*</FormLabel>
                          <FormControl>
                            <Input type="tel" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={traineeForm.control}
                      name="birthdate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data urodzenia*</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              className="appearance-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={traineeForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hasło*</FormLabel>
                        <FormControl>
                          <PasswordInput
                            maxLength={PASSWORD_MAX_LENGTH}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="flex justify-between">
                          <span>
                            Min. 8 znaków: małe i wielkie litery, cyfry
                          </span>
                          <span className="mr-1">
                            {traineePasswordValue.length}/{PASSWORD_MAX_LENGTH}
                          </span>
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={traineeForm.control}
                    name="terms"
                    render={({ field }) => (
                      <FormItem className="ml-1 flex items-center gap-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="mb-0">
                          Wyrażam zgodę na przetwarzanie danych.*
                        </FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {traineeError && (
                    <Alert variant="destructive" className="mx-auto">
                      <AlertDescription>{traineeError}</AlertDescription>
                    </Alert>
                  )}
                  <Button className="w-full" type="submit" disabled={isPending}>
                    {isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      "Utwórz konto podopiecznego"
                    )}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            {/*------------------------------------------------------------------------------------- */}
            {/* TRAINER TAB */}
            <TabsContent value="trainer">
              <Form {...trainerForm}>
                <form
                  className="space-y-6"
                  onSubmit={trainerForm.handleSubmit(onSubmitTrainer)}
                  onChange={() => {
                    if (trainerError) setTrainerError(null)
                  }}
                >
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={trainerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Imię*</FormLabel>
                          <FormControl>
                            <Input placeholder="Anna" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={trainerForm.control}
                      name="surname"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nazwisko*</FormLabel>
                          <FormControl>
                            <Input placeholder="Kowalska" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={trainerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adres e-mail*</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="anna@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={trainerForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Numer telefonu*</FormLabel>
                        <FormControl>
                          <Input type="tel" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={trainerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hasło*</FormLabel>
                        <FormControl>
                          <PasswordInput
                            maxLength={PASSWORD_MAX_LENGTH}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="flex justify-between">
                          <span>
                            Min. 8 znaków: małe i wielkie litery, cyfry
                          </span>
                          <span className="mr-1">
                            {trainerPasswordValue.length}/{PASSWORD_MAX_LENGTH}
                          </span>
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="border-gold mt-2 space-y-4 rounded-md border p-3.5">
                    <div className="w-full text-center">
                      <p className="text-gold mb-1 font-semibold">
                        {" "}
                        Miejsce pracy{" "}
                      </p>
                      <p className="text-xs text-zinc-400">
                        Kolejne miejsca pracy możesz dodać po zalogowaniu do
                        systemu.
                      </p>
                    </div>

                    <FormField
                      control={trainerForm.control}
                      name="workplaceName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nazwa miejsca*</FormLabel>
                          <FormControl>
                            <Input
                              className="border-gold"
                              placeholder="np. Siłownia X"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={trainerForm.control}
                      name="street"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ulica*</FormLabel>
                          <FormControl>
                            <Input className="border-gold" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex items-end gap-2">
                      <FormField
                        control={trainerForm.control}
                        name="buildingNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nr bud.*</FormLabel>
                            <FormControl>
                              <Input className="border-gold" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="text-md pb-1 text-center">/</div>

                      <FormField
                        control={trainerForm.control}
                        name="flatNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nr lokalu</FormLabel>
                            <FormControl>
                              <Input className="border-gold" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={trainerForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Miasto*</FormLabel>
                          <FormControl>
                            <Input className="border-gold" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={trainerForm.control}
                    name="terms"
                    render={({ field }) => (
                      <FormItem className="ml-1 flex items-center gap-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="mb-0">
                          Wyrażam zgodę na przetwarzanie danych.*
                        </FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {trainerError && (
                    <Alert variant="destructive" className="mx-auto">
                      <AlertDescription>{trainerError}</AlertDescription>
                    </Alert>
                  )}

                  <Button className="w-full" type="submit" disabled={isPending}>
                    {isPending ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      "Utwórz konto trenera"
                    )}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>

          <div className="pt-6 text-center text-sm text-zinc-400">
            Masz już konto?{" "}
            <Link href="/" className="text-baby-blue hover:underline">
              Zaloguj się
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
