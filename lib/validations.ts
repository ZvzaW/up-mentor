import { z } from "zod"

const isAtLeast15 = (dateString: string) => {
  const birth = new Date(dateString)
  if (isNaN(birth.getTime())) return false

  const today = new Date()
  const fifteenYearsAgo = new Date(
    today.getFullYear() - 15,
    today.getMonth(),
    today.getDate()
  )

  return birth <= fifteenYearsAgo
}

// --- BASE SCHEMAS ---

export const passwordSchema = z
  .string()
  .min(8, "Hasło musi mieć co najmniej 8 znaków")
  .max(30, "Hasło może mieć maksymalnie 30 znaków")
  .refine((val) => /[a-z]/.test(val) && /[A-Z]/.test(val) && /\d/.test(val), {
    message: "Hasło musi zawierać małe i wielkie litery oraz cyfry",
  })

const baseName = z
  .string()
  .trim()
  .min(1, "Imię jest wymagane")
  .regex(/^[\p{L} \-]+$/u, "Imię może zawierać tylko litery")

const baseSurname = z
  .string()
  .trim()
  .min(1, "Nazwisko jest wymagane")
  .regex(/^[\p{L} \-]+$/u, "Nazwisko może zawierać tylko litery")

export const baseEmail = z
  .string()
  .trim()
  .min(1, "Adres e-mail jest wymagany")
  .pipe(z.email("Podaj poprawny adres e-mail"))

export const emailSchema = z.object({
  email: baseEmail,
})
export type EmailValues = z.infer<typeof emailSchema>

const basePhone = z
  .string()
  .trim()
  .min(1, "Numer telefonu jest wymagany")
  .regex(/^[0-9\s+()-]{9,30}$/, "Podaj poprawny numer telefonu")

const baseBirthdate = z
  .string()
  .min(1, "Data urodzenia jest wymagana")
  .refine((val) => isAtLeast15(val), {
    message: "Musisz mieć co najmniej 15 lat",
  })

const baseTerms = z
  .boolean()
  .refine((val) => val === true, { message: "Musisz wyrazić zgodę" })

const baseWorkplaceName = z
  .string()
  .trim()
  .min(1, "Nazwa miejsca jest wymagana")

const baseStreet = z.string().trim().min(1, "Ulica jest wymagana")

const baseBuildingNumber = z
  .string()
  .trim()
  .min(1, "Numer budynku jest wymagany")

const baseFlatNumber = z
  .string()
  .trim()
  .max(10, "Numer mieszkania jest zbyt długi")
  .optional()
  .or(z.literal(""))

const baseCity = z.string().trim().min(1, "Miasto jest wymagane")

const basePlanName = z
  .string()
  .trim()
  .min(1, "Nazwa planu treningowego jest wymagana")
  .max(255, "Nazwa może mieć maksymalnie 255 znaków")

// --- MAIN SCHEMAS ---

// TRAINEE
export const registerTraineeSchema = z.object({
  name: baseName,
  surname: baseSurname,
  email: baseEmail,
  phone: basePhone,
  birthdate: baseBirthdate,
  password: passwordSchema,
  terms: baseTerms,
})
export type RegisterTraineeFormValues = z.infer<typeof registerTraineeSchema>

export const traineePersonalDataSchema = z.object({
  name: baseName,
  surname: baseSurname,
  phone: basePhone,
  birthdate: baseBirthdate,
})

export type TraineePersonalDataValues = z.infer<
  typeof traineePersonalDataSchema
>

export const coachingRequestSchema = z.object({
  trainer_id: z.string(),
  workplace_id: z.string().min(1, "Wybierz miejsce treningów z listy."),
  message: z
    .string()
    .trim()
    .max(1000, "Wiadomość może mieć maksymalnie 1000 znaków.")
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),
})

export type CoachingRequestInput = z.input<typeof coachingRequestSchema>

// TRAINER
export const registerTrainerSchema = z.object({
  name: baseName,
  surname: baseSurname,
  email: baseEmail,
  phone: basePhone,
  password: passwordSchema,
  workplaceName: baseWorkplaceName,
  street: baseStreet,
  buildingNumber: baseBuildingNumber,
  flatNumber: baseFlatNumber,
  city: baseCity,
  terms: baseTerms,
})
export type RegisterTrainerFormValues = z.infer<typeof registerTrainerSchema>

export const trainerPersonalDataSchema = z.object({
  name: baseName,
  surname: baseSurname,
  phone: basePhone,
})
export type TrainerPersonalDataValues = z.infer<
  typeof trainerPersonalDataSchema
>

export const trainerCardSchema = z.object({
  price_per_training: z
    .number()
    .int()
    .min(0, "Cena nie może być ujemna")
    .nullable()
    .optional(),

  work_description: z
    .string()
    .trim()
    .max(2000, "Opis może mieć maksymalnie 2000 znaków")
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),
})
export type TrainerCardValues = z.infer<typeof trainerCardSchema>
export type TrainerCardInput = z.input<typeof trainerCardSchema>

// WORKPLACE
export const editWorkplaceSchema = z.object({
  id: z.string(),
  name: baseWorkplaceName,
  street: baseStreet,
  building_number: baseBuildingNumber,
  flat_number: baseFlatNumber,
  city: baseCity,
})
export type EditWorkplaceFormValues = z.infer<typeof editWorkplaceSchema>

export const createWorkplaceSchema = z.object({
  name: baseWorkplaceName,
  street: baseStreet,
  building_number: baseBuildingNumber,
  flat_number: baseFlatNumber,
  city: baseCity,
})
export type CreateWorkplaceFormValues = z.infer<typeof createWorkplaceSchema>

export const trainerOpinionSchema = z.object({
  trainer_id: z.string(),
  rate: z
    .number()
    .int()
    .min(0)
    .max(5)
    .refine((n) => n >= 1, { message: "Wybierz ocenę od 1 do 5" }),
  comment: z
    .string()
    .trim()
    .max(2000, "Komentarz może mieć maksymalnie 2000 znaków")
    .or(z.literal(""))
    .nullable()
    .transform((val) => (val === "" ? null : val)),
})
export type TrainerOpinionFormValues = z.infer<typeof trainerOpinionSchema>

export const trainerExerciseFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nazwa ćwiczenia jest wymagana")
    .max(255, "Nazwa może mieć maksymalnie 255 znaków"),
  body_part: z
    .string()
    .min(1, "Wybierz partię ciała z listy")
    .max(100, "Maksymalnie 100 znaków"),
  video_url: z
    .string()
    .trim()
    .max(2000)
    .refine(
      (val) =>
        val === "" ||
        z
          .string()
          .url({ message: "Podaj poprawny adres URL (http/https)" })
          .safeParse(val).success,
      { message: "Podaj poprawny adres URL (http/https)" }
    ),
})
export type TrainerExerciseFormInput = {
  name: string
  body_part: string
  video_url: string
}

export type TrainerExerciseFormValues = z.infer<
  typeof trainerExerciseFormSchema
>

export const editTrainerExerciseSchema = trainerExerciseFormSchema.extend({
  id: z.string(),
})
export type EditTrainerExerciseFormValues = z.infer<
  typeof editTrainerExerciseSchema
>

//--------------------------------------------------------------------------------
const ExerciseSetSchema = z.object({
  id: z.string().optional(),
  exercise_id: z.string().min(1, "Wybierz ćwiczenie"),
  series_count: z
    .number()
    .int("Liczba serii musi być liczbą całkowitą")
    .min(1, "Minimum 1 seria")
    .max(50, "Maksymalnie 50 serii"),
  reps_count: z
    .number()
    .int("Liczba powtórzeń musi być liczbą całkowitą")
    .min(1, "Minimum 1 powtórzenie")
    .max(1000, "Maksymalnie 1000 powtórzeń"),
  weight: z
    .number()
    .min(0, "Waga nie może być ujemna")
    .max(999.99, "Maksymalna waga to 999,99 kg")
    .nullable(),
  order: z.number().int().min(1),
})

const SectionSchema = z.object({
  id: z.string().optional(),
  body_part: z
    .string()
    .max(100, "Partia ciała może mieć maksymalnie 100 znaków")
    .optional()
    .nullable(),
  order: z.number().int().min(1),
  exercise_sets: z
    .array(ExerciseSetSchema)
    .min(1, "Sekcja musi zawierać co najmniej jedno ćwiczenie")
    .max(50, "Sekcja może zawierać maksymalnie 50 ćwiczeń"),
})

export const WorkoutPlanPayloadSchema = z.object({
  name: basePlanName,
  difficulty: z
    .string()
    .max(100, "Poziom może mieć maksymalnie 100 znaków")
    .nullish()
    .transform((v) => (v?.trim() ? v.trim() : null)),
  description: z
    .string()
    .max(1000, "Opis może mieć maksymalnie 1000 znaków")
    .nullish()
    .transform((v) => (v?.trim() ? v.trim() : null)),
  sections: z
    .array(SectionSchema)
    .min(1, "Plan musi zawierać co najmniej jedną sekcję")
    .max(20, "Plan może mieć maksymalnie 20 sekcji"),
})

export type WorkoutPlanPayload = z.infer<typeof WorkoutPlanPayloadSchema>

const ExerciseSetFormSchema = ExerciseSetSchema.extend({
  uid: z.string(),
})

const SectionFormSchema = SectionSchema.extend({
  uid: z.string(),
  exercise_sets: z
    .array(ExerciseSetFormSchema)
    .min(1, "Sekcja musi zawierać co najmniej jedno ćwiczenie")
    .max(50, "Sekcja może zawierać maksymalnie 50 ćwiczeń"),
})

export const WorkoutPlanFormSchema = z.object({
  name: basePlanName,
  difficulty: z.string().max(100, "Poziom może mieć maksymalnie 100 znaków"),
  description: z.string().max(1000, "Opis może mieć maksymalnie 1000 znaków"),
  sections: z
    .array(SectionFormSchema)
    .min(1, "Plan musi zawierać co najmniej jedną sekcję")
    .max(20, "Plan może mieć maksymalnie 20 sekcji"),
})

export type WorkoutPlanFormValues = z.infer<typeof WorkoutPlanFormSchema>

//--------------------------------------------------------------------------------
const trainingDurationSchema = z
  .number()
  .refine((v) => [0.5, 1, 1.5, 2, 2.5, 3].includes(v), {
    message: "Wybierz czas trwania z listy",
  })

export const trainingFormSchema = z.object({
  trainee_id: z.string().min(1, "Wybierz podopiecznego"),
  date: z.string().min(1, "Data jest wymagana"),
  start_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Podaj poprawną godzinę (HH:MM)"),
  duration: trainingDurationSchema,
})

export const trainingDialogSchema = trainingFormSchema.extend({
  id: z.string().optional(),
})

export const createTrainingSchema = trainingFormSchema
export const updateTrainingSchema = trainingFormSchema.extend({
  id: z.string().min(1, "Wybierz trening"),
})

export type TrainingFormValues = z.infer<typeof trainingFormSchema>
export type TrainingDialogFormValues = z.infer<typeof trainingDialogSchema>
export type CreateTrainingFormValues = z.infer<typeof createTrainingSchema>
export type UpdateTrainingFormValues = z.infer<typeof updateTrainingSchema>

// ---OTHER---
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Podaj obecne hasło"),
    newPassword: passwordSchema,
    confirmNewPassword: z.string().min(1, "Potwierdź nowe hasło"),
    logoutOtherDevices: z.boolean(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Hasła nie są identyczne",
    path: ["confirmNewPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "Nowe hasło musi być inne od obecnego",
    path: ["newPassword"],
  })
export type ChangePasswordValues = z.input<typeof changePasswordSchema>

export const resetPasswordFormSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Potwierdź nowe hasło"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są identyczne",
    path: ["confirmPassword"],
  })

export type ResetPasswordValues = z.infer<typeof resetPasswordFormSchema>

export const resetPasswordSchema = resetPasswordFormSchema.extend({
  token: z.string().trim().min(1, "Nieprawidłowy token resetowania."),
})

export const sendChatMessageSchema = z.object({
  trainerId: z.string(),
  traineeId: z.string(),
  content: z
    .string()
    .trim()
    .min(1, "Wiadomość nie może być pusta")
    .max(2000, "Wiadomość może mieć maksymalnie 2000 znaków"),
})
export type SendChatMessageValues = z.infer<typeof sendChatMessageSchema>
