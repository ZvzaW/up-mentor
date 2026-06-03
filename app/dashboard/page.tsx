"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import NotificationsPanel from "@/components/pages/dashboard/notifications-panel"
import StatsPanel from "@/components/pages/dashboard/stats-panel"
import {
  getNotifications,
  getUnreadCount,
} from "@/actions/notifications"
import { notification } from "@prisma/client"

export default function DashboardPage() {
  const { data: session } = useSession()
  const userRole = session?.user?.role ?? ""

  const [mobileTab, setMobileTab] = useState<"notifications" | "stats">(
    "notifications"
  )
  const [unreadCount, setUnreadCount] = useState(0)

  const [groupedNotifications, setGroupedNotifications] = useState<
    Record<string, notification[]>
  >({})
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    getUnreadCount().then((res) => {
      if (!cancelled && !res.error) {
        setUnreadCount(res.count || 0)
      }
    })

    getNotifications(0).then((res) => {
      if (cancelled) return
      if (res.error) {
        setError(res.error)
      } else {
        setGroupedNotifications(
          (res.grouped as Record<string, notification[]>) || {}
        )
        setHasMore(res.hasMore ?? false)
        setPage(0)
      }
      setIsLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [])

  const decrementCount = () => {
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const incrementCount = () => {
    setUnreadCount((prev) => prev + 1)
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
        const newGrouped = (res.grouped as Record<string, notification[]>) || {}

        Object.entries(newGrouped).forEach(([label, items]) => {
          const merged = [...(updated[label] || []), ...items]
          updated[label] = Array.from(
            new Map(merged.map((n) => [n.id, n])).values()
          )
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
    incrementCount,
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
      <div className="block lg:hidden">
        <Tabs
          value={mobileTab}
          onValueChange={(v) => setMobileTab(v as "notifications" | "stats")}
          className="w-full"
        >
          <TabsList className="bg-dark-navy font-michroma border-baby-blue/40 z-1 mb-8 grid w-full grid-cols-2 border">
            <TabsTrigger value="notifications" className="text-xs">
              Powiadomienia{" "}
              <span className="ml-1">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
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

      <div className="hidden gap-12 lg:grid lg:grid-cols-2">
        <NotificationsPanel {...notificationProps} />
        <StatsPanel role={userRole} />
      </div>
    </div>
  )
}
