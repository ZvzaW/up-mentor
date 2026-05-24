"use client"

import { useEffect, useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  LabelList,
  Rectangle,
} from "recharts"
import { Separator } from "@/components/ui/separator"
import type { TraineeStatistics } from "@/lib/types"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface TraineeStatsProps {
  data?: TraineeStatistics
}

export default function TraineeStats({ data }: TraineeStatsProps) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  const weeklyHoursData = data?.weeklyHours ?? []
  const monthlyWorkoutsData = data?.monthlyWorkouts ?? []

  return (
    <div className="space-y-12">
      <Separator className="mt-12" />

      {/* Wykres 1: CZAS NA TRENINGI*/}
      <div className="space-y-3">
        <h3 className="text-center text-sm text-zinc-300 uppercase">
          Czas przeznaczony na treningi
        </h3>

        <div className="bg-dirty-blue h-[145px] w-full rounded-xl p-6">
          {ready && weeklyHoursData.length > 0 ? (
            
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={1}
              minHeight={1}
            >
              <BarChart
                data={weeklyHoursData}
                layout="vertical"
                margin={{ top: 0, right: 50, left: 0, bottom: 0 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  dataKey="period"
                  type="category"
                  dx={-14}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#a1a1aa", fontSize: 12 }}
                  width={100}
                />
                <Bar
                  dataKey="h"
                  barSize={25}
                  shape={(props: any) => {
                    const { index, ...rest } = props
                    const fill = index === 0 ? "#F0DAA7" : "#8CA0D0"
                    return (
                      <Rectangle {...rest} fill={fill} radius={[0, 4, 4, 0]} />
                    )
                  }}
                >
                  <LabelList
                    dataKey="h"
                    position="right"
                    formatter={(value) => (value == null ? "" : `${value}h`)}
                    fill="white"
                    fontSize={12}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            
          ) : null}
        </div>
      </div>

      <Separator />

      {/* Wykres 2: ZREALIZOWANE TRENINGI*/}
      <div className="space-y-3">
        <h3 className="text-center text-sm text-zinc-300 uppercase">
          Zrealizowane treningi
        </h3>
       <div className="bg-dirty-blue h-[145px] w-full rounded-xl p-6">
          {ready && monthlyWorkoutsData.length > 0 ? ( 
            
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={1}
              minHeight={1}
            >
              <BarChart
                data={monthlyWorkoutsData}
                layout="vertical"
                margin={{ top: 0, right: 44, left: 0, bottom: 0 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  dataKey="period"
                  type="category"
                  dx={-14}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#a1a1aa", fontSize: 12 }}
                  width={100}
                />
                <Bar
                  dataKey="trainings"
                  barSize={25}
                  shape={(props: any) => {
                    const { index, ...rest } = props
                    const fill = index === 0 ? "#F0DAA7" : "#8CA0D0"
                    return (
                      <Rectangle {...rest} fill={fill} radius={[0, 4, 4, 0]} />
                    )
                  }}
                >
                  <LabelList
                    dataKey="trainings"
                    position="right"
                    fill="white"
                    fontSize={12}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            
          ) : null}
        </div>
      </div>
    </div>
  )
}
