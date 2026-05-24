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