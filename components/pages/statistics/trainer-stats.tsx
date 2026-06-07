"use client"

import { Separator } from "@/components/ui/separator"
import { useEffect, useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  ResponsiveContainer,
  LabelList,
  Rectangle,
} from "recharts"
import type { BarShapeProps, RenderableText } from "recharts"
import type { TrainerStatistics } from "@/lib/types"

interface TrainerStatsProps {
  data?: TrainerStatistics
}

export default function TrainerStats({ data }: TrainerStatsProps) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  const weeklyLoadData = data?.weeklyLoad ?? []
  const monthlyComparisonData = data?.monthlyComparison ?? []
  const hasHourlyRate = data?.hasHourlyRate ?? false

  return (
    <div className="space-y-8">
      {/*Wykres 1: OBCIAZENIE TYGODNIOWE*/}
      <Separator className="mt-8" />

      <div className="space-y-4">
        <h3 className="text-center text-sm text-zinc-300 uppercase">
          Obciążenie tygodniowe
        </h3>
        <div className="bg-dirty-blue h-[200px] w-full rounded-xl px-4 py-3">
          {ready && weeklyLoadData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={weeklyLoadData}
                margin={{ top: 24, right: 0, left: 0, bottom: 0 }}
              >
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#a1a1aa", fontSize: 12 }}
                  dy={6}
                />
                <Bar dataKey="h" fill="#8CA0D0" radius={[4, 4, 0, 0]}>
                  <LabelList
                    dataKey="h"
                    position="top"
                    fill="#e5e5e5"
                    fontSize={12}
                    formatter={(label: RenderableText) => `${label ?? ""}h`}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : null}
        </div>
      </div>

      <Separator />

      {/*ZESTAWIENIE*/}
      <div className="grid grid-cols-[5fr_6fr] gap-3">
        {/*Wykres 2: TRENINGI ZREALIZOWANE*/}
        <div className="space-y-3">
          <h3 className="text-center text-sm text-zinc-300 uppercase">
            Treningi <br /> zrealizowane
          </h3>
          <div className="bg-dirty-blue h-[140px] rounded-xl px-3 py-3">
            {ready && monthlyComparisonData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyComparisonData}
                  margin={{ top: 20, right: 0, left: 0, bottom: 0 }}
                >
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#a1a1aa", fontSize: 12 }}
                    dy={6}
                  />
                  <Bar
                    dataKey="trainings"
                    shape={(props: BarShapeProps) => {
                      const { index, ...rest } = props
                      const fill = index === 1 ? "#F0DAA7" : "#8CA0D0"
                      return (
                        <Rectangle
                          {...rest}
                          fill={fill}
                          radius={[4, 4, 0, 0]}
                        />
                      )
                    }}
                  >
                    <LabelList
                      dataKey="trainings"
                      position="top"
                      fill="white"
                      fontSize={12}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </div>

        {/*Wykres 3: ZAROBEK*/}
        <div className="space-y-3">
          <h3 className="mt-2 mb-6 text-center text-sm text-zinc-300 uppercase">
            Zarobek
          </h3>
          <div className="bg-dirty-blue h-[140px] rounded-xl px-3 py-3">
            {!hasHourlyRate ? (
              <p className="flex h-full items-center justify-center px-2 text-center text-xs leading-relaxed text-zinc-400">
                Wykres niedostępny — ustaw stawkę za godzinę treningu w profilu.
              </p>
            ) : ready && monthlyComparisonData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyComparisonData}
                  margin={{ top: 25, right: 0, left: 0, bottom: 0 }}
                >
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#a1a1aa", fontSize: 12 }}
                    dy={6}
                  />
                  <Bar
                    dataKey="salary"
                    shape={(props: BarShapeProps) => {
                      const { index, ...rest } = props
                      const fill = index === 1 ? "#F0DAA7" : "#8CA0D0"
                      return (
                        <Rectangle
                          {...rest}
                          fill={fill}
                          radius={[4, 4, 0, 0]}
                        />
                      )
                    }}
                  >
                    <LabelList
                      dataKey="salary"
                      position="top"
                      fill="white"
                      fontSize={12}
                      formatter={(label: RenderableText) => `${label ?? ""}zł`}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
