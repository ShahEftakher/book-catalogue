import Link from "next/link";
import { CoverImage } from "@/components/CoverImage";
import { RatingStars } from "@/components/RatingStars";
import { StatusBadge } from "@/components/StatusBadge";
import type { BookListItem } from "@/lib/books";

export function BookCard({ book }: { book: BookListItem }) {
  const authorNames = book.authors.map((a) => a.name).join(", ");
  return (
    <Link href={`/books/${book.id}`} className="group flex flex-col gap-2">
      <div className="relative">
        <CoverImage
          src={book.coverUrl}
          title={book.title}
          lang={book.language}
          className="transition group-hover:shadow-md group-hover:brightness-95"
        />
        {book.status && book.status !== "want_to_read" && (
          <StatusBadge status={book.status} className="absolute top-2 left-2 shadow-sm" />
        )}
      </div>
      <div className="min-w-0">
        <h3 lang={book.language} className="line-clamp-2 text-sm font-medium leading-snug">
          {book.title}
        </h3>
        {authorNames && (
          <p lang={book.language} className="truncate text-xs text-muted-foreground">
            {authorNames}
          </p>
        )}
        {book.rating != null && <RatingStars rating={book.rating} className="mt-1" />}
      </div>
    </Link>
  );
}
