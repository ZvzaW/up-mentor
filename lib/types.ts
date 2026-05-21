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