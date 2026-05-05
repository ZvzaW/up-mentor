import { getTrainerOpinions } from "@/actions/trainer-opinion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Star } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

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

export async function TrainerOpinionsList({ trainerId }: TrainerOpinionsListProps) {
  const result = await getTrainerOpinions(trainerId);
  const reviews: TrainerReview[] = result.success ? result.data.reviews : [];
  const averageRate =  result.data?.averageRate;

  return (
    <div className="space-y-2 text-sm">
      {result.error && (
        <Alert variant="destructive" className="mx-auto my-12">
          <AlertDescription>{result.error}</AlertDescription>
        </Alert>
      )}

      {!result.error && (
        <>
          {averageRate ? (
            <p className=" text-zinc-400 ml-1">
              Średnia z {reviews.length} ocen: <span className="font-bold text-gold">{`${averageRate.toFixed(1)} / 5`}</span>
            </p>
          ) : null}
          <div className="bg-dirty-blue/40 rounded-xl p-2">
            {reviews.length === 0 ? (
              <p className="text-zinc-400 text-center">Brak opinii.</p>
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
