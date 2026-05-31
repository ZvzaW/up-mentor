"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import {
  Settings,
  LogOut,
  Key,
  ShieldAlert,
  ChevronLeft,
  Loader2,
  Pencil,
} from "lucide-react"
import { toDateInputValue } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/common/password-input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  changePasswordSchema,
  type ChangePasswordValues,
  traineePersonalDataSchema,
  trainerPersonalDataSchema,
} from "@/lib/validations"
import { deleteAccount } from "@/actions/account"
import { changePassword } from "@/actions/password"
import { logoutAllDevices } from "@/actions/authorization"
import { updatePersonalData } from "@/actions/profile"
import { z } from "zod"

export interface SettingsDialogProps {
  baseData: {
    id: string
    name: string
    surname: string
    email: string
    phone: string
    role: string
  }
  specificData: {
    birthdate?: Date
    work_description?: string | null
    price_per_training?: number | null
    is_public?: boolean
  }
}

type ViewState = "main" | "logout" | "password" | "delete" | "edit-data"

export default function SettingsDialog({
  baseData,
  specificData,
}: SettingsDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [view, setView] = React.useState<ViewState>("main")
  const [deleteInput, setDeleteInput] = React.useState("")
  const [isPending, startTransition] = React.useTransition()
  const [isPasswordPending, startPasswordTransition] = React.useTransition()
  const [isEditPending, startEditTransition] = React.useTransition()
  const [isDeletePending, startDeleteTransition] = React.useTransition()
  const isTrainer = baseData.role === "trainer"
  const formSchema = isTrainer
    ? trainerPersonalDataSchema
    : traineePersonalDataSchema

  const passwordForm = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
      logoutOtherDevices: false,
    },
    mode: "onChange",
  })

  React.useEffect(() => {
    if (view !== "password") {
      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
        logoutOtherDevices: false,
      })
    }
  }, [view, passwordForm])

  React.useEffect(() => {
    if (view !== "delete") {
      setDeleteInput("")
    }
  }, [view])

  const editDefaultValues = React.useMemo(() => {
    const base = {
      name: baseData.name ?? "",
      surname: baseData.surname ?? "",
      phone: baseData.phone ?? "",
    }

    if (!isTrainer) {
      return {
        ...base,
        birthdate: specificData?.birthdate
          ? toDateInputValue(new Date(specificData.birthdate))
          : "",
      }
    }

    return base
  }, [
    baseData.name,
    baseData.surname,
    baseData.phone,
    isTrainer,
    specificData?.birthdate,
  ])

  const editForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: editDefaultValues,
    mode: "onChange",
  })

  React.useEffect(() => {
    if (view === "edit-data") {
      editForm.reset(editDefaultValues)
    }
  }, [view, editForm, editDefaultValues])

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      setTimeout(() => {
        setView("main")
        setDeleteInput("")
      }, 200)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="secondary">
          <Settings /> Ustawienia
        </Button>
      </DialogTrigger>
      <DialogContent>
        {/* --------------- MENU GŁÓWNE --------------- */}
        {view === "main" && (
          <div className="animate-in slide-in-from-left-8 fade-in duration-300">
            <DialogHeader>
              <DialogTitle>Ustawienia</DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-5">
              <Button
                variant="secondary"
                className="text-md border-baby-blue h-12 justify-start border-2"
                onClick={() => setView("logout")}
              >
                <LogOut className="mr-1 ml-1" />
                Wyloguj ze wszystkich urządzeń
              </Button>

              <Button
                variant="secondary"
                className="text-md border-baby-blue h-12 justify-start border-2"
                onClick={() => setView("edit-data")}
              >
                <Pencil className="mr-1 ml-1" />
                Edytuj dane
              </Button>

              <Button
                variant="secondary"
                className="text-md border-baby-blue h-12 justify-start border-2"
                onClick={() => setView("password")}
              >
                <Key className="mr-1 ml-1" />
                Zmień hasło
              </Button>

              <Button
                variant="secondary"
                className="text-md border-destructive hover:bg-destructive/20 h-12 justify-start border-2"
                onClick={() => setView("delete")}
              >
                <ShieldAlert className="mr-1 ml-1" />
                Usuń konto
              </Button>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="destructive">Zamknij</Button>
              </DialogClose>
            </DialogFooter>
          </div>
        )}

        {/* --------------- WYLOGUJ Z URZĄDZEŃ --------------- */}
        {view === "logout" && (
          <div className="animate-in slide-in-from-right-12 fade-in duration-300">
            <DialogHeader className="ml-[-15px] flex flex-row items-center">
              <Button variant="ghost" onClick={() => setView("main")}>
                <ChevronLeft className="size-5" />
              </Button>
              <DialogTitle>Wyloguj urządzenia</DialogTitle>
            </DialogHeader>
            <DialogDescription>
              {" "}
              Spowoduje to zakończenie wszystkich Twoich aktywnych sesji na
              innych przeglądarkach i urządzeniach. Będziesz musiał zalogować
              się ponownie.
            </DialogDescription>

            <DialogFooter>
              <Button
                disabled={isPending}
                onClick={() => {
                  startTransition(async () => {
                    const res = await logoutAllDevices()
                    if (res?.error) {
                      toast.error(res.error)
                    }
                  })
                }}
              >
                {isPending ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Wyloguj wszędzie"
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* --------------- ZMIEŃ HASŁO --------------- */}
        {view === "password" && (
          <div className="animate-in slide-in-from-right-12 fade-in duration-300">
            <DialogHeader className="ml-[-15px] flex flex-row items-center">
              <Button variant="ghost" onClick={() => setView("main")}>
                <ChevronLeft className="size-5" />
              </Button>
              <DialogTitle>Zmiana hasła</DialogTitle>
            </DialogHeader>

            <Form {...passwordForm}>
              <form
                onSubmit={passwordForm.handleSubmit((values) => {
                  startPasswordTransition(async () => {
                    passwordForm.clearErrors("currentPassword")
                    const res = await changePassword(values)
                    if (res?.error) {
                      if (res.error === "Obecne hasło jest nieprawidłowe") {
                        passwordForm.setError("currentPassword", {
                          message: res.error,
                        })
                        return
                      }

                      toast.error(res.error)
                      return
                    }

                    toast.success("Hasło zostało zmienione!")
                    passwordForm.reset()
                    setView("main")
                  })
                })}
              >
                <div className="flex flex-col gap-5">
                  <p className="text-xs text-zinc-400">
                    Hasło ma się składać z minimum 8 znaków: małe i wielkie
                    litery, cyfry
                  </p>

                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Obecne hasło</FormLabel>
                        <FormControl>
                          <PasswordInput
                            autoComplete="current-password"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e)
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nowe hasło</FormLabel>
                        <FormControl>
                          <PasswordInput
                            autoComplete="new-password"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e)
                              if (
                                "confirmNewPassword" in
                                passwordForm.formState.errors
                              ) {
                                passwordForm.trigger("confirmNewPassword")
                              }
                              if (
                                "currentPassword" in
                                passwordForm.formState.errors
                              ) {
                                passwordForm.trigger("currentPassword")
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={passwordForm.control}
                    name="confirmNewPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Potwierdź nowe hasło</FormLabel>
                        <FormControl>
                          <PasswordInput
                            autoComplete="new-password"
                            {...field}
                          />
                        </FormControl>

                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={passwordForm.control}
                    name="logoutOtherDevices"
                    render={({ field }) => (
                      <FormItem className="ml-1 flex flex-row gap-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(checked) =>
                              field.onChange(Boolean(checked))
                            }
                          />
                        </FormControl>
                        <FormLabel className="text-sm text-zinc-300">
                          Wyloguj mnie z innych urządzeń po zmianie hasła
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setView("main")}
                    disabled={isPasswordPending}
                  >
                    Anuluj
                  </Button>
                  <Button type="submit" disabled={isPasswordPending}>
                    {isPasswordPending ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      "Zapisz"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        )}

        {/* --------------- USUŃ KONTO --------------- */}
        {view === "delete" && (
          <div className="animate-in slide-in-from-right-12 fade-in duration-300">
            <DialogHeader className="ml-[-15px] flex flex-row items-center">
              <Button variant="ghost" onClick={() => setView("main")}>
                <ChevronLeft className="size-5" />
              </Button>
              <DialogTitle className="text-destructive">
                Usuwanie konta
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-destructive/10 border-destructive/30 rounded-md border p-3">
                <p className="text-destructive text-sm font-bold">
                  TEJ AKCJI NIE MOŻNA COFNĄĆ!
                </p>
                <p className="mt-1 text-sm text-zinc-400">
                  Wszystkie dane, historia treningów i inne utworzone przez
                  Ciebie rzeczy zostaną bezpowrotnie usunięte z naszej bazy
                  danych!
                </p>
              </div>

              {baseData.role === "trainer" && (
                <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3">
                  <p className="text-sm font-bold text-amber-300">
                    Zalecenie dla trenera
                  </p>
                  <p className="mt-1 text-sm text-zinc-300">
                    Przed usunięciem konta zaleca się najpierw zakończyć
                    współprace z podopiecznymi.
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm text-zinc-300">
                  Aby potwierdzić, wpisz słowo{" "}
                  <span className="font-bold text-white">delete</span>
                </label>
                <Input
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  placeholder="delete"
                  className="border-destructive/50 focus-visible:ring-destructive/50 mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="destructive"
                onClick={() => setView("main")}
                disabled={isDeletePending}
              >
                Anuluj
              </Button>
              <Button
                className="bg-gold hover:bg-gold/60"
                disabled={deleteInput !== "delete" || isDeletePending}
                onClick={() => {
                  startDeleteTransition(async () => {
                    const res = await deleteAccount()
                    if (res?.error) {
                      toast.error(res.error)
                    }
                  })
                }}
              >
                {isDeletePending ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Usuń konto"
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* --------------- EDYCJA DANYCH --------------- */}
        {view === "edit-data" && (
          <div className="animate-in slide-in-from-right-12 fade-in duration-300">
            <DialogHeader className="ml-[-15px] flex flex-row items-center">
              <Button variant="ghost" onClick={() => setView("main")}>
                <ChevronLeft className="size-5" />
              </Button>
              <DialogTitle>Edycja danych</DialogTitle>
            </DialogHeader>

            <Form {...editForm}>
              <form
                onSubmit={editForm.handleSubmit((values) => {
                  startEditTransition(async () => {
                    const res = await updatePersonalData(values)
                    if (res?.error) {
                      toast.error(res.error)
                      return
                    }

                    toast.success("Zapisano dane!")
                    editForm.reset(editDefaultValues)
                    setView("main")
                  })
                })}
              >
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FormField
                    control={editForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Imię</FormLabel>
                        <FormControl>
                          <Input autoComplete="given-name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="surname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nazwisko</FormLabel>
                        <FormControl>
                          <Input autoComplete="family-name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FormField
                    control={editForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Numer telefonu</FormLabel>
                        <FormControl>
                          <Input
                            autoComplete="tel"
                            inputMode="tel"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {baseData.role === "trainee" && (
                    <FormField
                      control={editForm.control}
                      name={"birthdate" as any}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data urodzenia</FormLabel>
                          <FormControl>
                            <Input
                              className="appearance-none"
                              type="date"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="destructive"
                    className="min-w-[100px]"
                    onClick={() => setView("main")}
                    disabled={isEditPending}
                  >
                    Anuluj
                  </Button>

                  <Button
                    type="submit"
                    className="min-w-[100px]"
                    disabled={isEditPending || !editForm.formState.isValid}
                  >
                    {isEditPending ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      "Zapisz"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
