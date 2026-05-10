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
const baseEmail = z
  .string()
  .trim()
  .min(1, "Adres e-mail jest wymagany")
  .pipe(z.email("Podaj poprawny adres e-mail"))
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
});

export type CoachingRequestInput = z.input<typeof coachingRequestSchema>;

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
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)), 
})
export type TrainerCardValues = z.infer<typeof trainerCardSchema>
export type TrainerCardInput = z.input<typeof trainerCardSchema>;

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
    .min(1, "Wybierz ocenę od 1 do 5")
    .max(5, "Wybierz ocenę od 1 do 5"),
  comment: z
    .string()
    .trim()
    .max(2000, "Komentarz może mieć maksymalnie 2000 znaków")
    .or(z.literal(""))        
  .nullable()              
  .transform((val) => val === "" ? null : val)
})
export type TrainerOpinionFormValues = z.infer<typeof trainerOpinionSchema>

// --- MORE SCHEMAS ---

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
