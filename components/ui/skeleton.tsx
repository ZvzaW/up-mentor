import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-baby-blue/30 animate-pulse rounded-md", className)}
      {...props}
    />
  )
}

export function SkeletonTable() {
  return (
    <div className="flex w-full flex-col gap-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <div className="flex gap-4" key={index}>
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonOpinions() {
  return (
    <div className="space-y-2 text-sm">
      <div className="ml-1 flex items-center gap-2">
        <Skeleton className="h-4 w-30 rounded" />
        <Skeleton className="h-4 w-12 rounded" />
      </div>
      <div className="bg-dirty-blue/50 rounded-xl p-2">
        <div className="custom-scrollbar max-h-75 space-y-4 overflow-y-auto p-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="border-b border-zinc-600 pb-4 last:border-0 last:pb-0"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Skeleton className="h-4 w-36 max-w-[60%] rounded" />
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((__, starIndex) => (
                    <Skeleton
                      key={starIndex}
                      className="size-4 shrink-0 rounded-sm"
                    />
                  ))}
                </div>
              </div>
              <Skeleton className="mt-1 mb-3 h-2.5 w-28 rounded" />

              <Skeleton className="h-4 w-full rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function SkeletonList() {
  return (
    <div className="flex w-full flex-col gap-8">
      {Array.from({ length: 5 }).map((_, index) => (
        <div className="flex flex-col gap-4" key={index}>
          <Skeleton className="h-1" />
          <Skeleton className="h-10" />
        </div>
      ))}
    </div>
  )
}

export { Skeleton }

function NextTrainingSkeleton() {
  return (
    <div>
      <Skeleton className="h-20 rounded-xl" />
    </div>
  )
}

function TrainerChartsSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="mt-10 h-1" />
      <div className="space-y-4">
        <Skeleton className="mx-auto h-4 w-44 rounded" />
        <Skeleton className="h-[200px] w-full rounded-xl" />
      </div>
      <Skeleton className="h-1" />
      <div className="grid grid-cols-[5fr_6fr] gap-3">
        <div className="mt-1 space-y-3">
          <Skeleton className="mx-auto h-8 w-28 rounded" />
          <Skeleton className="h-[140px] w-full rounded-xl" />
        </div>
        <div className="space-y-3">
          <Skeleton className="mx-auto mt-2 mb-6 h-4 w-20 rounded" />
          <Skeleton className="h-[140px] w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}

function TraineeChartsSkeleton() {
  return (
    <div className="space-y-12">
      <Skeleton className="mt-10 h-1" />
      <div className="space-y-3">
        <Skeleton className="mx-auto h-4 w-56 rounded" />
        <Skeleton className="h-[145px] w-full rounded-xl" />
      </div>
      <Skeleton className="h-1" />
      <div className="space-y-3">
        <Skeleton className="mx-auto h-4 w-40 rounded" />
        <Skeleton className="h-[145px] w-full rounded-xl" />
      </div>
    </div>
  )
}

export default function StatsPanelSkeleton({ role }: { role: string }) {
  return (
    <div
      className="space-y-0"
      aria-busy="true"
      aria-label="Ładowanie statystyk"
    >
      <NextTrainingSkeleton />
      {role === "trainer" ? (
        <TrainerChartsSkeleton />
      ) : (
        <TraineeChartsSkeleton />
      )}
    </div>
  )
}
