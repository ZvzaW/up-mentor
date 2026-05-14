"use client"

import { useState, useEffect, JSX } from "react"
import { useRouter } from "next/navigation"
import { Users, MessageSquare, ChevronRight, Bell, MessageCircle, Calendar, Loader2 } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import TrainerStats from "@/components/pages/statistics/trainer-stats"
import TraineeStats from "@/components/pages/statistics/trainee-stats"

import { getNotifications, getUnreadCount, markAsRead } from "@/actions/notifications"
import { SkeletonList } from "@/components/ui/skeleton"

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

const ICONS: Record<string, JSX.Element> = {
  request: <Users size={16} />,
  comment: <MessageSquare size={16} />,
  message: <MessageCircle size={16} />,
  system: <Bell size={16} />,
}

interface NotificationsPanelProps {
  unreadCount: number
  decrementCount: () => void
  groupedNotifications: Record<string, Notification[]>
  setGroupedNotifications: React.Dispatch<React.SetStateAction<Record<string, Notification[]>>>
  isLoading: boolean
  hasMore: boolean
  isLoadingMore: boolean
  loadMore: () => Promise<void>
  error: string | null
}


//PANELI POWIADOMIEŃ
function NotificationsPanel({
  unreadCount,
  decrementCount,
  groupedNotifications,
  setGroupedNotifications,
  isLoading,
  hasMore,
  isLoadingMore,
  loadMore,
  error,
}: NotificationsPanelProps) {
  const router = useRouter()

  const handleNotificationClick = async (notif: Notification) => {
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
                {hasNotifications ? (
                  Object.entries(groupedNotifications).map(([label, items]) => (
                    <div key={label} className="space-y-6">
                      <div className="flex items-center gap-4">
                        <Separator className="flex-1" />
                        <span className="text-gold text-xs font-medium uppercase">{label}</span>
                        <Separator className="flex-1" />
                      </div>

                      <div className="space-y-3">
                        {items.map((notif) => (
                          <button
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`bg-dirty-blue hover:bg-hover group flex w-full items-center justify-between rounded-xl p-4 text-left transition-all ${
                              !notif.is_read ? "border-baby-blue border-2" : ""
                            }`}
                          >
                            <div className="space-y-3 text-sm">
                              <div
                                className={`flex gap-2 font-semibold ${
                                  !notif.is_read ? "text-baby-blue" : "text-zinc-300"
                                }`}
                              >
                                {notif.title} {ICONS[notif.type] || ICONS.system}
                              </div>
                              <p className="leading-relaxed text-zinc-400">{notif.message}</p>
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
                  !error && <p className="text-center text-zinc-400">Brak powiadomień.</p>
                )}

                {hasMore && !error && (
                  <div className="flex justify-center pb-4">
                    <button
                      onClick={loadMore}
                      disabled={isLoadingMore}
                      className="text-baby-blue hover:bg-dark-navy/70 bg-dirty-navy/70 flex min-w-[140px] items-center justify-center rounded-lg px-4 py-3 text-sm"
                    >
                      {isLoadingMore ? <Loader2 className="animate-spin" /> : "Załaduj więcej"}
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


//PANEL STATYSTYK
function StatsPanel({ role }: { role?: string }) {
  return (
    <section>
      <h2 className="font-michroma mb-5 hidden justify-center text-2xl text-white lg:flex">Statystyki</h2>
      <Card className="h-[707px]">
        <CardContent>
          <div className="bg-dirty-blue flex items-center justify-between rounded-xl py-4">
            <span className="pr-2 pl-5 text-sm text-zinc-300">KOLEJNY TRENING</span>
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
}


//DASHBOARD
export default function DashboardPage({ userRole }: { userRole?: string }) {
  const [mobileTab, setMobileTab] = useState<"notifications" | "stats">("notifications")
  const [unreadCount, setUnreadCount] = useState(0)

  const [groupedNotifications, setGroupedNotifications] = useState<Record<string, Notification[]>>({})
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)


  useEffect(() => {
    getUnreadCount().then((res) => {
      if (!res.error) {
        setUnreadCount(res.count || 0)
      }
    })

    setIsLoading(true)
    setError(null)
    getNotifications(0).then((res) => {
      if (res.error) {
        setError(res.error)
      } else {
        setGroupedNotifications((res.grouped as Record<string, Notification[]>) || {})
        setHasMore(res.hasMore ?? false)
        setPage(0)
      }
      setIsLoading(false)
    })
  }, [])

  const decrementCount = () => {
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const loadMore = async () => {
    if (isLoadingMore || !hasMore) return
    setIsLoadingMore(true)

    const nextPage = page + 1
    const res = await getNotifications(nextPage)

    if (res.error) {
      setError(res.error)
    } else {
      setGroupedNotifications((prev) => {
        const updated = { ...prev }
        const newGrouped = (res.grouped as Record<string, Notification[]>) || {}

        Object.entries(newGrouped).forEach(([label, items]) => {
          const merged = [...(updated[label] || []), ...items]
          updated[label] = Array.from(new Map(merged.map((n) => [n.id, n])).values())
        })

        return updated
      })
      setHasMore(res.hasMore ?? false)
      setPage(nextPage)
    }

    setIsLoadingMore(false)
  }

  const notificationProps = {
    unreadCount,
    decrementCount,
    groupedNotifications,
    setGroupedNotifications,
    isLoading,
    hasMore,
    isLoadingMore,
    loadMore,
    error,
  }

  return (
    <div className="flex min-h-[calc(100vh-20rem)] w-full flex-col justify-center p-3">
      {/* Widok Mobilny (Zakładki) */}
      <div className="block lg:hidden">
        <Tabs value={mobileTab} onValueChange={(v) => setMobileTab(v as any)} className="w-full">
          <TabsList className="bg-dark-navy font-michroma border-baby-blue/40 z-1 mb-8 grid w-full grid-cols-2 border">
            <TabsTrigger value="notifications" className="text-xs">
              Powiadomienia <span className="ml-1">{unreadCount > 99 ? "99+" : unreadCount}</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="text-xs">
              Statystyki
            </TabsTrigger>
          </TabsList>
          <TabsContent value="notifications">
            <NotificationsPanel {...notificationProps} />
          </TabsContent>
          <TabsContent value="stats">
            <StatsPanel role={userRole} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Widok Desktop (Grid) */}
      <div className="hidden gap-12 lg:grid lg:grid-cols-2">
        <NotificationsPanel {...notificationProps} />
        <StatsPanel role={userRole} />
      </div>
    </div>
  )
}