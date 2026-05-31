import { workplace } from "@prisma/client"

export type TrainingDTO = {
  id: string
  trainerId: string
  traineeId: string
  scheduledAt: string
  duration: number
  traineeName: string
  trainerName: string
  workplaceAddress: string
}

export type WorkplaceAddress = {
  id?: string | undefined
  street: string
  name: string
  building_number: string
  flat_number: string | null
  city: string
}

export type UserDTO = {
  id: string
  name: string
  surname: string
  email: string
  phone: string
  role: string
}

export type TrainerDTO = {
  work_description: string | null
  price_per_training: number | null
  is_public: boolean
  workplace: workplace[]
}

export type TraineeDTO = {
  id: string
  slug: string
  fullName: string
  workplace: WorkplaceAddress
}

export type TrainingListItem = {
  id: string
  date: string
  startTime: string
  durationLabel: string
  workplaceAddress: string
}

export type TrainerStatistics = {
  weeklyLoad: { day: string; h: number }[]
  monthlyComparison: { month: string; trainings: number; salary: number }[]
  hasHourlyRate: boolean
}

export type TraineeStatistics = {
  weeklyHours: { period: string; h: number }[]
  monthlyWorkouts: { period: string; trainings: number }[]
}

export type ChatMessageDTO = {
  id: string
  senderId: string
  content: string
  createdAt: string
  isOwn: boolean
}

export type ChatConversationDTO = {
  trainerId: string
  traineeId: string
  partnerName: string
}

export const EXERCISE_BODY_PARTS = [
  "Klatka piersiowa",
  "Plecy",
  "Barki",
  "Biceps",
  "Triceps",
  "Przedramiona",
  "Brzuch / Core",
  "Pośladki / Tylna część ud",
  "Uda (przód)",
  "Łydki",
  "Full body",
] as const

// ZAPIS
export type ExerciseSetInput = {
  id?: string
  exercise_id: string
  series_count: number
  reps_count: number
  weight?: number | null
  order: number
}

export type SectionInput = {
  id?: string
  body_part?: string | null
  order: number
  exercise_sets: ExerciseSetInput[]
}

export type WorkoutPlanInput = {
  name: string
  difficulty?: string | null
  description?: string | null
  sections: SectionInput[]
}

// ODCZYT
export type WorkoutPlanUserRef = {
  name: string | null
  surname: string | null
}

export type ExerciseSet = {
  id: string
  order: number
  series_count: number
  reps_count: number
  weight: number | null
  exercise: {
    name: string
    video_url: string | null
  }
}

export type Section = {
  id: string
  body_part: string | null
  order: number
  exercise_set: ExerciseSet[]
}

export type WorkoutPlanItem = {
  id: string
  name: string
  difficulty: string | null
  description: string | null
  plans_library?: {
    trainee: {
      user: WorkoutPlanUserRef | null
    } | null
  }[]
  trainer?: {
    user: WorkoutPlanUserRef | null
  } | null
  section: Section[]
}

export type WorkoutPlanFromDb = Omit<WorkoutPlanItem, "section"> & {
  section: Array<
    Omit<Section, "exercise_set"> & {
      exercise_set: Array<
        Omit<ExerciseSet, "weight" | "exercise"> & {
          weight: unknown
          exercise: Pick<ExerciseSet["exercise"], "name"> & {
            video_url?: string | null
          }
        }
      >
    }
  >
}
