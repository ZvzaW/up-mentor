"use client";

import { useState, useEffect } from "react";
import { getTrainerOpinions } from "@/actions/trainer-opinion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Star } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { SkeletonTable } from "@/components/ui/skeleton";

function StarRating({ rate }: { rate: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`Ocena ${rate} na 5`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          className={cn(
            "size-4 shrink-0",
            index < rate ? "fill-gold text-gold" : "fill-transparent text-gold/30"
          )}
          aria-hidden
        />
      ))}
    </div>
  );
}

type TrainerOpinionsListProps = {
  trainerId: string;
};

type TrainerReview = {
  traineeId: string;
  name: string;
  createdAt: Date;
  rate: number;
  comment: string | null;
};


export function TrainerOpinionsList({ trainerId }: TrainerOpinionsListProps) {
  const [reviews, setReviews] = useState<TrainerReview[]>([]);
  const [averageRate, setAverageRate] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    let isMounted = true;

    const fetchOpinions = async () => {
      setIsLoading(true);
      const result = await getTrainerOpinions(trainerId);

      if (!isMounted) return;

      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        setReviews(result.data.reviews);
        setAverageRate(result.data.averageRate ?? null);
      }
      setIsLoading(false);
    };

    fetchOpinions();

    return () => {
      isMounted = false;
    };
  }, [trainerId]);


  if (isLoading) {
    return (
        <SkeletonTable />
    );
  }

  return (
    <div className="space-y-2 text-sm">
      {error && (
        <Alert variant="destructive" className="mx-auto my-12">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!error && (
        <>
          {averageRate ? (
            <p className=" text-zinc-400 ml-1">
              Średnia z {reviews.length} ocen: <span className="font-bold text-gold">{`${averageRate.toFixed(1)} / 5`}</span>
            </p>
          ) : null}
          <div className="bg-dirty-blue/50 rounded-xl p-2">
            {reviews.length === 0 ? (
              <p className="text-zinc-400 text-center py-4">Brak opinii.</p>
            ) : (
              <ul className="custom-scrollbar max-h-75 space-y-4 overflow-y-auto p-2">
                {reviews.map((review) => (
                  <li
                    key={review.traineeId}
                    className="border-b border-zinc-600 pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-zinc-200 font-bold">{review.name}</span>
                      <StarRating rate={review.rate} />
                    </div>
                    <span className="text-[10px] text-zinc-400 italic"> {formatDate(new Date(review.createdAt))} </span>
                    {review.comment ? <p className="mt-3 text-gray-400 break-words">{review.comment}</p> : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}