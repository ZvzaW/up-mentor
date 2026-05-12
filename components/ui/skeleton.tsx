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

export { Skeleton }
