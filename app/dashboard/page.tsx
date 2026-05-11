"use client"

import { useState, useMemo, JSX } from "react"
import { useSession } from "next-auth/react"
import useSWR from "swr"
import useSWRInfinite from "swr/infinite"
import { useRouter } from "next/navigation"
import { Users, MessageSquare, ChevronRight, Bell, MessageCircle, Calendar, Loader2 } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import TrainerStats from "@/components/pages/statistics/trainer-stats"
import TraineeStats from "@/components/pages/statistics/trainee-stats"

import { getNotifications, getUnreadCount, markAsRead } from "@/actions/notifications"

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

const countFetcher = async () => {
  const res = await getUnreadCount()
  if (res.error) throw new Error(res.error)
  return res.count || 0
}

const notificationFetcher = async (page: number) => {
  const res = await getNotifications(page)
  if (res.error) throw new Error(res.error)
  return res
}

// POWIADOMIENIA
function NotificationsPanel({ unreadCount, mutateCount }: { unreadCount: number, mutateCount: () => void }) {
  const router = useRouter()

  const { data: pagesData, error, size, setSize, isValidating, mutate: mutateList } = useSWRInfinite(
    (pageIndex, previousPageData) => {
      if (previousPageData && !previousPageData.hasMore) return null
      return `notifications-page-${pageIndex}`
    },
    (key) => notificationFetcher(parseInt(key.split("-").pop() || "0")),
    { revalidateFirstPage: false, revalidateOnFocus: false, persistSize: true }
  )

  const notificationsGrouped = useMemo(() => {
    if (!pagesData) return {}

    return pagesData.reduce<Record<string, Notification[]>>((acc, page) => {
      if (!page?.grouped) return acc

      Object.entries(page.grouped as Record<string, Notification[]>).forEach(([label, items]) => {
        const merged = [...(acc[label] || []), ...items]
        acc[label] = Array.from(new Map(merged.map((n) => [n.id, n])).values())
      })

      return acc
    }, {})
  }, [pagesData])

  const handleNotificationClick = (notif: Notification) => {
    if (notif.redirect_url) router.push(notif.redirect_url)

    if (!notif.is_read) {
      markAsRead(notif.id).then(() => {
        mutateCount()
        mutateList()
      })
    }
  }

  const isLoadingInitialData = !pagesData && !error
  const isLoadingMore = isLoadingInitialData || (size > 0 && pagesData && typeof pagesData[size - 1] === "undefined")
  const hasMore = pagesData?.[pagesData.length - 1]?.hasMore ?? true
  const hasNotifications = Object.keys(notificationsGrouped).length > 0

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
                              <div className={`flex gap-2 font-semibold ${!notif.is_read ? "text-baby-blue" : "text-zinc-300"}`}>
                                {notif.title} {ICONS[notif.type] || ICONS.system}
                              </div>
                              <p className="leading-relaxed text-zinc-400">{notif.message}</p>
                            </div>
                            <ChevronRight className={`shrink-0 ${!notif.is_read ? "text-baby-blue" : "text-zinc-300"}`} />
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

// STATYSTYKI
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

//DASHBOARD PAGE
export default function DashboardPage() {
  const { data: session } = useSession()
  const [mobileTab, setMobileTab] = useState<"notifications" | "stats">("notifications")


  const { data: unreadCount = 0, mutate: mutateCount } = useSWR("unread-count", countFetcher, {
    revalidateOnFocus: false,
  })

  return (
    <div className="flex min-h-[calc(100vh-20rem)] w-full flex-col justify-center p-3">
      {/* Widok Mobilny (Zakładki) */}
      <div className="block lg:hidden">
        <Tabs value={mobileTab} onValueChange={(v) => setMobileTab(v as any)} className="w-full">
          <TabsList className="bg-dark-navy font-michroma border-baby-blue/40 z-1 mb-8 grid w-full grid-cols-2 border">
            <TabsTrigger value="notifications" className="text-xs">
              Powiadomienia <span>{unreadCount > 99 ? "99+" : unreadCount}</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="text-xs">Statystyki</TabsTrigger>
          </TabsList>
          <TabsContent value="notifications">
            <NotificationsPanel unreadCount={unreadCount} mutateCount={mutateCount} />
          </TabsContent>
          <TabsContent value="stats">
            <StatsPanel role={session?.user?.role} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Widok Desktop (Grid) */}
      <div className="hidden gap-12 lg:grid lg:grid-cols-2">
        <NotificationsPanel unreadCount={unreadCount} mutateCount={mutateCount} />
        <StatsPanel role={session?.user?.role} />
      </div>
    </div>
  )
}