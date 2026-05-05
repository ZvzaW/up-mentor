"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function getMyTrainers() {
  
    const session = await auth()
    if (!session?.user?.id) {
      redirect("/?unauthorized=true")
    }
    
    if (session.user.role !== "trainee") {
        return { error: "Brak uprawnień do tej operacji." }
      }
      
      
    try {
    const cooperations = await prisma.cooperation.findMany({
      where: {
        trainee_id: session.user.id,
        status: "active",
      },
      include: {
        trainer: {
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
            building_number: true,
            flat_number: true,
          },
        },
      },
    });

    return { success: true, data: cooperations };
  } catch (error) {
    return { error: "Nie udało się pobrać danych. Spróbuj odświeżyć stronę." };
  }
}

export async function getMyTrainersCount() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/?unauthorized=true");
  }

  if (session.user.role !== "trainee") {
    return { error: "Brak uprawnień do tej operacji." };
  }

  try {
    const count = await prisma.cooperation.count({
      where: {
        trainee_id: session.user.id,
        status: "active",
      },
    });

    return { success: true, data: count };
  } catch (error) {
    return { error: "Nie udało się pobrać danych. Spróbuj odświeżyć stronę." };
  }
}

export async function getMyTrainerBySlug(slug: string) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/?unauthorized=true");
  }

  if (session.user.role !== "trainee") {
    return { error: "Brak uprawnień do tej operacji." };
  }

  try {
    const cooperation = await prisma.cooperation.findFirst({
      where: {
        trainee_id: session.user.id,
        status: "active",
        trainer: {
          slug,
        },
      },
      include: {
        trainer: {
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
            building_number: true,
            flat_number: true,
          },
        },
      },
    });

    return { success: true, data: cooperation };
  } catch (error) {
    return { error: "Nie udało się pobrać danych. Spróbuj odświeżyć stronę." };
  }
}