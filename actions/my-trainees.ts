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

    return { success: true, data: cooperations };
  } catch (error) {
    return { error: "Nie udało się pobrać danych. Spróbuj odświeżyć stronę." };
  }
}