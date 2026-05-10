"use server";

import { prisma } from "@/lib/prisma"; 
import { auth } from "@/auth"
import { redirect } from "next/navigation";

export async function getMyTrainees() {
  
    const session = await auth()
    if (!session?.user?.id) {
      redirect("/?unauthorized=true")
    }
    
    if (session.user.role !== "trainer") {
        return { error: "Brak uprawnień do tej operacji." }
      }


    try {
    const cooperations = await prisma.cooperation.findMany({
      where: {
        trainer_id: session.user.id,
        status: "active", 
      },
      include: {
        trainee: {
          include: {
            user: {
              select: {
                name: true,
                surname: true,
                phone: true,
              },
            },
          },
        },
        workplace: {
          select: {
            name: true,
            street: true,
            city: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    const mappedCooperations = cooperations.map((cooperation) => ({
      key: cooperation.trainee.id,
      slug: cooperation.trainee.slug,
      name: `${cooperation.trainee.user.name} ${cooperation.trainee.user.surname}`,
      workplace: `${cooperation.workplace.name} - ul. ${cooperation.workplace.street}, ${cooperation.workplace.city}`,
    }))

    return { success: true, data: mappedCooperations };
  } catch (error) {
    return { error: "Nie udało się pobrać danych. Spróbuj odświeżyć stronę." };
  }
}

export async function getMyTraineeBySlug(slug: string) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/?unauthorized=true");
  }

  if (session.user.role !== "trainer") {
    return { error: "Brak uprawnień do tej operacji." };
  }

  try {
    const cooperation = await prisma.cooperation.findFirst({
      where: {
        trainer_id: session.user.id,
        status: "active",
        trainee: {
          slug,
        },
      },
      include: {
        trainee: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                surname: true,
                phone: true,
              },
            },
          },
        },
        workplace: {
          select: {
            name: true,
            street: true,
            building_number: true,
            flat_number: true,
            city: true,
          },
        },
      },
    });

    return { success: true, data: cooperation };
  } catch {
    return { error: "Nie udało się pobrać danych. Spróbuj odświeżyć stronę." };
  }
}

export async function updateMyTraineeNote(traineeId: string, note: string) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/?unauthorized=true");
  }

  if (session.user.role !== "trainer") {
    return { error: "Brak uprawnień do tej operacji." };
  }

  try {
    await prisma.cooperation.update({
      where: {
        trainer_id_trainee_id: {
          trainer_id: session.user.id,
          trainee_id: traineeId,
        },
      },
      data: {
        trainer_note: note.trim() ? note : null,
      },
    });

    return { success: true };
  } catch {
    return { error: "Wystąpił błąd podczas zapisywania danych. Spróbuj ponownie." };
  }
}