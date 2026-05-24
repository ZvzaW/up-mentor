import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import TrainerProfile from "@/components/pages/profile/trainer-profile"
import TraineeProfile from "@/components/pages/profile/trainee-profile"
import { TrainerDTO, UserDTO } from "@/lib/types"

export default async function ProfilePage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      trainee: true,
      trainer: {
        include: {
          workplace: true,
        },
      },
    },
  })

  if (!user) {
    redirect("/?unauthorized=true")
  }

  return (
    <div className="flex min-h-[calc(100vh-15rem)] w-full flex-col justify-center p-3">
      {user.role === "trainer" && user.trainer ? (
        <TrainerProfile
          baseData={user as UserDTO}
          specificData={user.trainer as TrainerDTO}
        />
      ) : user.role === "trainee" && user.trainee ? (
        <TraineeProfile
          baseData={user as UserDTO}
          specificData={user.trainee}
        />
      ) : (
        <p className="text-zinc-400">
          Brak szczegółowych danych profilu dla tej roli.
        </p>
      )}
    </div>
  )
}
