"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { useSession } from "next-auth/react"
import useSWR from "swr"
import useSWRInfinite from "swr/infinite"
import {
  Users,
  MessageSquare,
  ChevronRight,
  Bell,
  MessageCircle,
  Calendar,
  Loader2,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import TrainerStats from "@/components/pages/statistics/trainer-stats"
import TraineeStats from "@/components/pages/statistics/trainee-stats"
import {
  getNotificationsAction,
  getUnreadCountAction,
  markAsReadAction,
} from "@/actions/notifications"
import { useRouter } from "next/navigation"

interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  redirect_url: string | null
  type: "request" | "comment" | "message" | "system"
  is_read: boolean
  created_at: Date
}

const countFetcher = async () => {
  const res = await getUnreadCountAction()
  if (res.error) throw new Error(res.error)
  return res.count || 0
}

const notificationFetcher = async (page: number) => {
  const res = await getNotificationsAction(page)
  if (res.error) throw new Error(res.error)
  return res
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const role = session?.user?.role
  const [mobileTab, setMobileTab] = useState<"notifications" | "stats">(
    "notifications"
  )
  const router = useRouter()

  // SWR - LICZNIK
  const { data: unreadCount = 0, mutate: mutateCount } = useSWR(
    "unread-count",
    countFetcher,
    { refreshInterval: 60000 }
  )

  // SWR - POWIADOMIENIA Z PAGINACJĄ
  const getKey = (pageIndex: number, previousPageData: any) => {
    if (previousPageData && !previousPageData.hasMore) return null
    return `notifications-page-${pageIndex}`
  }

  const {
    data: pagesData,
    error,
    size,
    setSize,
    isValidating,
    mutate: mutateList,
  } = useSWRInfinite(
    getKey,
    (key) => {
      const page = parseInt(key.split("-").pop() || "0")
      return notificationFetcher(page)
    },
    {
      revalidateFirstPage: false,
      revalidateOnFocus: false,
      persistSize: true,
    }
  )

  // REAKCJA NA ZMIANĘ LICZNIKA
  const prevCountRef = useRef(unreadCount)
  useEffect(() => {
    if (unreadCount !== prevCountRef.current) {
      mutateList()
      prevCountRef.current = unreadCount
    }
  }, [unreadCount, mutateList])

  // GRUPOWANIE POWIADOMIEN PO LABELACH (DATA)
  const notificationsGrouped = useMemo(() => {
    if (!pagesData) {
      return {}
    }

    const combined: Record<string, Notification[]> = {}

    pagesData.forEach((page) => {
      if (!page || !page.grouped) return
      Object.entries(page.grouped as Record<string, Notification[]>).forEach(
        ([label, items]) => {
          if (!combined[label]) combined[label] = []

          const existingIds = new Set(combined[label].map((n) => n.id))
          const uniqueItems = items.filter((n) => !existingIds.has(n.id))
          combined[label].push(...uniqueItems)
        }
      )
    })
    return combined
  }, [pagesData])

  const isLoadingInitialData = !pagesData && !error
  const isLoadingMore =
    isLoadingInitialData ||
    (size > 0 && pagesData && typeof pagesData[size - 1] === "undefined")
  const hasMore = pagesData?.[pagesData.length - 1]?.hasMore ?? true
  const hasNotifications = Object.keys(notificationsGrouped).length > 0

  const handleNotificationClick = async (
    notifId: string,
    isRead: boolean,
    url: string | null
  ) => {
    if (isRead) {
      if (url) {
        router.push(url)
      }
      return
    }

    // mutateCount(Math.max(0, unreadCount - 1), false)

    // if (pagesData) {
    //   const newData = pagesData.map((page) => ({
    //     ...page,
    //     grouped: Object.fromEntries(
    //       Object.entries(page.grouped as Record<string, Notification[]>).map(
    //         ([label, items]) => [
    //           label,
    //           items.map((notif) =>
    //             notif.id === notifId ? { ...notif, is_read: true } : notif
    //           ),
    //         ]
    //       )
    //     ),
    //   }))
    //   mutateList(newData, false)
    // }

    await markAsReadAction(notifId)

    setTimeout(() => {
      if (url) {
        router.push(url)
      }
    }, 50)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "request":
        return <Users size={16} />
      case "comment":
        return <MessageSquare size={16} />
      case "message":
        return <MessageCircle size={16} />
      default:
        return <Bell size={16} />
    }
  }

  const renderNotifications = () => (
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
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}
          <div className="custom-scrollbar h-full space-y-6 overflow-y-auto pr-5 pb-10">
            {isLoadingInitialData ? (
              <Loader2 className="text-baby-blue mx-auto mt-10 animate-spin" />
            ) : (
              <>
                {hasNotifications ? (
                  Object.entries(notificationsGrouped).map(([label, items]) => (
                    <div key={label} className="space-y-6">
                      <div className="flex items-center gap-4">
                        <Separator className="flex-1" />
                        <span className="text-gold text-xs font-medium uppercase">
                          {label}
                        </span>
                        <Separator className="flex-1" />
                      </div>
                      <div className="space-y-3">
                        {items.map((notif: Notification) => (
                          <button
                            key={notif.id}
                            onClick={() =>
                              handleNotificationClick(
                                notif.id,
                                notif.is_read,
                                notif.redirect_url
                              )
                            }
                            className={`bg-dirty-blue hover:bg-hover group flex w-full items-center justify-between rounded-xl p-4 text-left transition-all ${
                              !notif.is_read ? "border-baby-blue border-2" : ""
                            }`}
                          >
                            <div className="space-y-3 text-sm">
                              <div
                                className={`flex gap-2 font-semibold ${!notif.is_read ? "text-baby-blue" : "text-zinc-300"}`}
                              >
                                {notif.title} {getNotificationIcon(notif.type)}
                              </div>
                              <p className="leading-relaxed text-zinc-400">
                                {notif.message}
                              </p>
                            </div>
                            <ChevronRight
                              className={`shrink-0 ${!notif.is_read ? "text-baby-blue" : "text-zinc-300"}`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-zinc-400">Brak powiadomień.</p>
                )}

                {hasMore && !error && (
                  <div className="flex justify-center pb-4">
                    <button
                      onClick={() => setSize(size + 1)}
                      disabled={isValidating}
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

  const renderStats = () => (
    <section>
      <h2 className="font-michroma mb-5 hidden justify-center text-2xl text-white lg:flex">
        Statystyki
      </h2>
      <Card className="h-[707px]">
        <CardContent>
          <div className="bg-dirty-blue flex items-center justify-between rounded-xl py-4">
            <span className="pr-2 pl-5 text-sm text-zinc-300 uppercase">
              Kolejny trening
            </span>
            <div className="bg-dirty-navy/60 text-baby-blue mr-4 flex items-center gap-2 rounded-lg px-3 py-3">
              <Calendar size={16} />
              <span className="mt-1 whitespace-nowrap">20.20.2026, 18:00</span>
            </div>
          </div>
          {role === "trainer" ? <TrainerStats /> : <TraineeStats />}
        </CardContent>
      </Card>
    </section>
  )

  return (
    <div className="flex min-h-[calc(100vh-20rem)] w-full flex-col justify-center p-3">
      <div className="block lg:hidden">
        <Tabs
          value={mobileTab}
          onValueChange={(v) => setMobileTab(v as any)}
          className="w-full"
        >
          <TabsList className="bg-dark-navy font-michroma border-baby-blue/40 z-1 mb-8 grid w-full grid-cols-2 border">
            <TabsTrigger value="notifications" className="text-xs">
              Powiadomienia{" "}
              <span>{unreadCount > 99 ? "99+" : unreadCount}</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="text-xs">
              Statystyki
            </TabsTrigger>
          </TabsList>
          <TabsContent value="notifications">
            {renderNotifications()}
          </TabsContent>
          <TabsContent value="stats">{renderStats()}</TabsContent>
        </Tabs>
      </div>
      <div className="hidden gap-12 lg:grid lg:grid-cols-2">
        {renderNotifications()}
        {renderStats()}
      </div>
    </div>
  )
}
