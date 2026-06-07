"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { formatDate } from "@/lib/utils"
import { redirect } from "next/navigation"
import { notification } from "@prisma/client"
import { getLogger } from "@/lib/server-logger"

export async function getNotifications(page: number = 0) {
  const logger = await getLogger()

  const session = await auth()
  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  const userId = session.user.id

  logger.info({ userId, page }, "Fetching notifications")

  try {
    const limit = 15
    const notifications = await prisma.notification.findMany({
      where: { user_id: userId },
      take: limit + 1,
      skip: page * limit,
      orderBy: { created_at: "desc" },
    })

    const hasMore = notifications.length > limit
    const notificationsToDisplay = hasMore
      ? notifications.slice(0, limit)
      : notifications
    const grouped = groupNotificationsByDate(notificationsToDisplay)

    logger.info({ userId, page }, "Notifications fetched successfully")
    return { grouped, hasMore }
  } catch {
    logger.error({ userId, page }, "Error fetching notifications")
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
  const logger = await getLogger()

  const session = await auth()
  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  const userId = session.user.id

  logger.info({ userId }, "Fetching unread notifications count")

  try {
    const count = await prisma.notification.count({
      where: {
        user_id: userId,
        is_read: false,
      },
    })

    logger.info(
      { userId, count },
      "Unread notifications count fetched successfully"
    )
    return { count, error: null }
  } catch {
    logger.error({ userId }, "Error fetching unread notifications count")
    return {
      count: 0,
      error: "Nie udało się pobrać danych. Spróbuj odświeżyć stronę",
    }
  }
}

export async function markAsRead(id: string) {
  const logger = await getLogger()

  const session = await auth()
  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  const userId = session.user.id

  logger.info({ userId, notificationId: id }, "Marking notification as read")

  try {
    await prisma.notification.update({
      where: {
        id: id,
        user_id: userId,
      },
      data: { is_read: true },
    })

    logger.info(
      { userId, notificationId: id },
      "Notification marked as read successfully"
    )
    return { error: null }
  } catch {
    logger.error(
      { userId, notificationId: id },
      "Error marking notification as read"
    )
    return {
      error: "Coś poszło nie tak przy odczytywaniu powiadomienia.",
    }
  }
}

export async function markAsUnread(id: string) {
  const logger = await getLogger()

  const session = await auth()
  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  const userId = session.user.id

  logger.info({ userId, notificationId: id }, "Marking notification as unread")

  try {
    await prisma.notification.update({
      where: {
        id: id,
        user_id: userId,
      },
      data: { is_read: false },
    })

    logger.info(
      { userId, notificationId: id },
      "Notification marked as unread successfully"
    )
    return { error: null }
  } catch {
    logger.error(
      { userId, notificationId: id },
      "Error marking notification as unread"
    )
    return {
      error:
        "Wystąpił błąd podczas aktualizacji powiadomienia. Spróbuj ponownie.",
    }
  }
}

export async function deleteNotification(id: string) {
  const logger = await getLogger()

  const session = await auth()
  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  const userId = session.user.id

  logger.info({ userId, notificationId: id }, "Deleting notification")

  try {
    await prisma.notification.delete({
      where: {
        id: id,
        user_id: userId,
      },
    })

    logger.info(
      { userId, notificationId: id },
      "Notification deleted successfully"
    )
    return { success: true }
  } catch {
    logger.error({ userId, notificationId: id }, "Error deleting notification")
    return {
      error: "Wystąpił błąd podczas usuwania powiadomienia. Spróbuj ponownie.",
    }
  }
}
