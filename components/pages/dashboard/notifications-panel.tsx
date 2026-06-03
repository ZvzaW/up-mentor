"use client"

import { JSX } from "react"
import { useRouter } from "next/navigation"
import {
  Users,
  MessageSquare,
  Bell,
  MessageCircle,
  Loader2,
  ClipboardList,
  Dumbbell,
  BicepsFlexed,
  MoreVertical,
  Trash2,
  Mail,
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  markAsRead,
  markAsUnread,
  deleteNotification,
} from "@/actions/notifications"
import { SkeletonList } from "@/components/ui/skeleton"
import { notification } from "@prisma/client"
import { toast } from "sonner"

const ICONS: Record<string, JSX.Element> = {
  request: <Users size={16} />,
  comment: <MessageSquare size={16} />,
  message: <MessageCircle size={16} />,
  system: <Bell size={16} />,
  survey: <ClipboardList size={16} />,
  training: <Dumbbell size={16} />,
  workout_plan: <BicepsFlexed size={16} />,
}

export interface NotificationsPanelProps {
  unreadCount: number
  decrementCount: () => void
  incrementCount: () => void
  groupedNotifications: Record<string, notification[]>
  setGroupedNotifications: React.Dispatch<
    React.SetStateAction<Record<string, notification[]>>
  >
  isLoading: boolean
  hasMore: boolean
  isLoadingMore: boolean
  loadMore: () => Promise<void>
  error: string | null
}

export default function NotificationsPanel({
  unreadCount,
  decrementCount,
  incrementCount,
  groupedNotifications,
  setGroupedNotifications,
  isLoading,
  hasMore,
  isLoadingMore,
  loadMore,
  error,
}: NotificationsPanelProps) {
  const router = useRouter()

  const handleNotificationClick = async (notif: notification) => {
    if (notif.redirect_url) router.push(notif.redirect_url)

    if (!notif.is_read) {
      setGroupedNotifications((prev) => {
        const newGrouped = { ...prev }
        for (const label in newGrouped) {
          newGrouped[label] = newGrouped[label].map((n) =>
            n.id === notif.id ? { ...n, is_read: true } : n
          )
        }
        return newGrouped
      })

      decrementCount()
      await markAsRead(notif.id)
    }
  }

  const handleMarkAsUnread = async (notif: notification) => {
    const result = await markAsUnread(notif.id)
    if (result.error) {
      toast.error(result.error)
      return
    }

    incrementCount()

    if (notif.is_read) {
      setGroupedNotifications((prev) => {
        const newGrouped = { ...prev }
        for (const label in newGrouped) {
          newGrouped[label] = newGrouped[label].map((n) =>
            n.id === notif.id ? { ...n, is_read: false } : n
          )
        }
        return newGrouped
      })
    }
  }

  const handleDeleteNotification = async (notif: notification) => {
    const result = await deleteNotification(notif.id)
    if (result.error) {
      toast.error(result.error)
      return
    }

    setGroupedNotifications((prev) => {
      const newGrouped: Record<string, notification[]> = {}
      for (const label in prev) {
        const filtered = prev[label].filter((n) => n.id !== notif.id)
        if (filtered.length > 0) newGrouped[label] = filtered
      }
      return newGrouped
    })

    if (!notif.is_read) decrementCount()
  }

  const hasNotifications = Object.keys(groupedNotifications).length > 0

  return (
    <section>
      <div className="mb-5 hidden items-center justify-center gap-3 lg:flex">
        <h2 className="font-michroma text-2xl">Powiadomienia</h2>
        <span className="border-baby-blue text-baby-blue font-michroma flex h-8 min-w-8 items-center justify-center rounded-full border-2 px-2 text-sm font-bold">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      </div>

      <Card className="h-[707px] overflow-hidden">
        <CardContent className="h-full pr-1">
          {error && (
            <Alert variant="destructive" className="mx-auto mt-[-6px] mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="custom-scrollbar h-full space-y-6 overflow-y-auto pr-5 pb-10">
            {isLoading ? (
              <SkeletonList />
            ) : (
              <>
                {hasNotifications
                  ? Object.entries(groupedNotifications).map(
                      ([label, items]) => (
                        <div key={label} className="space-y-6">
                          <div className="flex items-center gap-4">
                            <Separator className="flex-1" />
                            <span className="text-gold text-xs font-medium uppercase">
                              {label}
                            </span>
                            <Separator className="flex-1" />
                          </div>

                          <div className="space-y-3">
                            {items.map((notif) => (
                              <div
                                key={notif.id}
                                className={`bg-dirty-blue hover:bg-hover group flex w-full items-center gap-2 rounded-xl p-4 text-left transition-all ${
                                  !notif.is_read
                                    ? "border-baby-blue border-2"
                                    : ""
                                }`}
                              >
                                <button
                                  onClick={() => handleNotificationClick(notif)}
                                  className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left"
                                >
                                  <div className="min-w-0 space-y-3 text-sm">
                                    <div
                                      className={`flex gap-2 font-semibold ${
                                        !notif.is_read
                                          ? "text-baby-blue"
                                          : "text-zinc-300"
                                      }`}
                                    >
                                      {notif.title}{" "}
                                      {ICONS[notif.type] || ICONS.system}
                                    </div>
                                    <p className="text-zinc-400">
                                      {notif.message}
                                    </p>
                                  </div>
                                </button>

                                <DropdownMenu>
                                  <DropdownMenuTrigger
                                    onClick={(e) => e.stopPropagation()}
                                    aria-label="Opcje"
                                  >
                                    <MoreVertical
                                      size={16}
                                      className="text-zinc-400"
                                    />
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    className="bg-dark-navy"
                                  >
                                    {notif.is_read && (
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleMarkAsUnread(notif)
                                        }
                                        className="cursor-pointer gap-2 text-zinc-300"
                                      >
                                        <Mail size={14} />
                                        Oznacz jako nieodczytane
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleDeleteNotification(notif)
                                      }
                                      className="cursor-pointer gap-2 text-red-400"
                                    >
                                      <Trash2 size={14} />
                                      Usuń powiadomienie
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    )
                  : !error && (
                      <p className="text-center text-zinc-400">
                        Brak powiadomień.
                      </p>
                    )}

                {hasMore && !error && (
                  <div className="flex justify-center pb-4">
                    <button
                      onClick={loadMore}
                      disabled={isLoadingMore}
                      className="text-baby-blue hover:bg-dark-navy/70 bg-dirty-navy/70 flex min-w-[140px] items-center justify-center rounded-lg px-4 py-3 text-sm"
                    >
                      {isLoadingMore ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        "Załaduj więcej"
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
