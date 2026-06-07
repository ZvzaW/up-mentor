"use client"

import { useState, useEffect } from "react"
import { Calendar } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import TrainerStats from "@/components/pages/statistics/trainer-stats"
import TraineeStats from "@/components/pages/statistics/trainee-stats"
import { getStatistics } from "@/actions/statistics"
import StatsPanelSkeleton from "@/components/ui/skeleton"
import { user_role } from "@prisma/client"

type StatisticsResult = Awaited<ReturnType<typeof getStatistics>>

interface StatsPanelProps {
  role: user_role
}

export default function StatsPanel({ role }: StatsPanelProps) {
  const [result, setResult] = useState<StatisticsResult | null>(null)
  const [statsError, setStatsError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    getStatistics().then((res) => {
      if (cancelled) return

      if (res.error) {
        setStatsError(res.error)
        setResult(null)
      } else if (res.success) {
        setStatsError(null)
        setResult(res)
      }

      setIsLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [])

  const isStatsReady = !isLoading && result != null && result.success

  return (
    <section>
      <h2 className="font-michroma mb-5 hidden justify-center text-2xl text-white lg:flex">
        Statystyki
      </h2>
      <Card className="h-[707px]">
        <CardContent className="overflow-hidden">
          {statsError ? (
            <Alert variant="destructive" className="mx-auto">
              <AlertDescription>{statsError}</AlertDescription>
            </Alert>
          ) : !isStatsReady ? (
            <StatsPanelSkeleton role={role} />
          ) : (
            <>
              <div className="bg-dirty-blue flex items-center justify-between rounded-xl py-4">
                <span className="pr-2 pl-5 text-sm text-zinc-300">
                  KOLEJNY TRENING
                </span>
                <div className="bg-dirty-navy/60 text-baby-blue mr-4 flex items-center gap-2 rounded-lg px-3 py-3">
                  <Calendar size={16} />
                  <span className="mt-1 whitespace-nowrap">
                    {result.nextTraining ?? (
                      <span className="text-zinc-500">Brak</span>
                    )}
                  </span>
                </div>
              </div>

              {role === user_role.trainer ? (
                <TrainerStats data={result.trainer} />
              ) : (
                <TraineeStats data={result.trainee} />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
