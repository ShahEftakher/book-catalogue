import { StarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Read-only star rating supporting half stars. */
export function RatingStars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center", className)} aria-label={`Rated ${rating} of 5`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const fill = rating >= n ? 100 : rating >= n - 0.5 ? 50 : 0;
        return (
          <span key={n} className="relative inline-block size-4">
            <StarIcon className="absolute size-4 text-stone-300" />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill}%` }}>
              <StarIcon className="size-4 fill-amber-400 text-amber-400" />
            </span>
          </span>
        );
      })}
    </span>
  );
}
