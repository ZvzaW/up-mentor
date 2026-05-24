"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { formatDate } from "@/lib/utils"
import { redirect } from "next/navigation"
import { notification } from "@prisma/client"
export async function getNotifications(page: number = 0) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  try {
    const limit = 15
    const notifications = await prisma.notification.findMany({
      where: { user_id: session.user.id },
      take: limit + 1,
      skip: page * limit,
      orderBy: { created_at: "desc" },
    })

    const hasMore = notifications.length > limit
    const notificationsToDisplay = hasMore
      ? notifications.slice(0, limit)
      : notifications
    const grouped = groupNotificationsByDate(notificationsToDisplay)

    return { grouped, hasMore }
  } catch {
    return {
      grouped: {},
      hasMore: false,
      error: "Nie udało się pobrać danych. Spróbuj odświeżyć stronę",
    }
  }
}

function groupNotificationsByDate(notifications: notification[]) {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const groups: Record<string, notification[]> = {}

  notifications.forEach((notif) => {
    const date = new Date(notif.created_at)
    let label = ""

    const isToday = date.toDateString() === today.toDateString()
    const isYesterday = date.toDateString() === yesterday.toDateString()

    if (isToday) {
      label = "DZISIAJ"
    } else if (isYesterday) {
      label = "WCZORAJ"
    } else {
      const dayName = date
        .toLocaleDateString("pl-PL", { weekday: "short" })
        .replace(".", "")
      label = `${dayName}, ${formatDate(date)}`
    }

    if (!groups[label]) groups[label] = []
    groups[label].push(notif)
  })

  return groups
}

export async function getUnreadCount() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  try {
    const count = await prisma.notification.count({
      where: {
        user_id: session.user.id,
        is_read: false,
      },
    })

    return { count, error: null }
  } catch {
    return {
      count: 0,
      error: "Nie udało się pobrać danych. Spróbuj odświeżyć stronę",
    }
  }
}

export async function markAsRead(id: string) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  try {
    await prisma.notification.update({
      where: {
        id: id,
        user_id: session.user.id,
      },
      data: { is_read: true },
    })

    return { error: null }
  } catch {
    return {
      error: "Coś poszło nie tak przy odczytywaniu powiadomienia.",
    }
  }
}
