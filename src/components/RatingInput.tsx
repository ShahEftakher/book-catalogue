"use client";

import { StarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = { value: number | undefined; onChange: (value: number | undefined) => void };

/** Five stars; the left half of a star sets a half rating. Click the same value to clear. */
export function RatingInput({ value, onChange }: Props) {
  const current = value ?? 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => {
          const fill = current >= n ? 100 : current >= n - 0.5 ? 50 : 0;
          return (
            <span key={n} className="relative inline-block size-8 sm:size-7">
              <StarIcon className="absolute size-8 sm:size-7 text-stone-300" />
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill}%` }}>
                <StarIcon className="size-8 sm:size-7 fill-amber-400 text-amber-400" />
              </span>
              {[n - 0.5, n].map((v, i) => (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={current === v}
                  aria-label={`${v} stars`}
                  onClick={() => onChange(current === v ? undefined : v)}
                  className={cn("absolute inset-y-0 w-1/2", i === 0 ? "left-0" : "right-0")}
                />
              ))}
            </span>
          );
        })}
      </div>
      <span className="w-16 text-sm text-muted-foreground">{value ? `${value} / 5` : "No rating"}</span>
    </div>
  );
}
