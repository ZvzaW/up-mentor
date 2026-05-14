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
              <Skeleton className="mt-1 h-2.5 w-28 rounded mb-3" />

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
