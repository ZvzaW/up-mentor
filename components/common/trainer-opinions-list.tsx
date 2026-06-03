"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Star } from "lucide-react"
import { cn, formatDate } from "@/lib/utils"
import { SkeletonOpinions } from "@/components/ui/skeleton"

function StarRating({ rate }: { rate: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`Ocena ${rate} na 5`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          className={cn(
            "size-4 shrink-0",
            index < rate
              ? "fill-gold text-gold"
              : "text-gold/30 fill-transparent"
          )}
          aria-hidden
        />
      ))}
    </div>
  )
}

export type TrainerReview = {
  traineeId: string
  name: string
  createdAt: Date
  rate: number
  comment: string | null
}

type TrainerOpinionsListProps = {
  reviews: TrainerReview[]
  averageRate: number | null
  isLoading?: boolean
  error?: string | null
}

export function TrainerOpinionsList({
  reviews,
  averageRate,
  isLoading,
  error,
}: TrainerOpinionsListProps) {
  if (isLoading) return <SkeletonOpinions />

  if (error) {
    return (
      <div className="space-y-2 text-sm">
        <Alert variant="destructive" className="mx-auto my-12">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-2 text-sm">
      {averageRate ? (
        <p className="ml-1 text-zinc-400">
          Średnia z {reviews.length} ocen:{" "}
          <span className="text-gold font-bold">{`${averageRate.toFixed(1)} / 5`}</span>
        </p>
      ) : null}
      <div className="bg-dirty-blue/50 rounded-xl p-2">
        {reviews.length === 0 ? (
          <p className="py-4 text-center text-zinc-400">Brak opinii.</p>
        ) : (
          <ul className="custom-scrollbar max-h-75 space-y-4 overflow-y-auto p-2">
            {reviews.map((review) => (
              <li
                key={review.traineeId}
                className="border-b border-zinc-600 pb-4 last:border-0 last:pb-0"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-zinc-200">{review.name}</span>
                  <StarRating rate={review.rate} />
                </div>
                <span className="text-[10px] text-zinc-400 italic">
                  {formatDate(new Date(review.createdAt))}
                </span>
                {review.comment ? (
                  <p className="mt-3 break-words text-gray-400">
                    {review.comment}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
