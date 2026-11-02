"use client";

import Link from "next/link";
import { ArrowRightIcon, XIcon } from "lucide-react";
import { RatingStars } from "@/components/RatingStars";
import { StatusBadge } from "@/components/StatusBadge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import type { BookListItem } from "@/lib/books";
import { FORMAT_LABELS } from "@/lib/constants";

function Details({ book }: { book: BookListItem }) {
  const authors = book.authors.map((a) => a.name).join(", ");
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {book.status && <StatusBadge status={book.status} />}
        {book.rating != null && <RatingStars rating={book.rating} />}
      </div>
      <p className="text-sm text-muted-foreground">
        {[book.publishedYear, book.formats.map((f) => FORMAT_LABELS[f]).join(", ")].filter(Boolean).join(" · ")}
      </p>
      {authors && (
        <p lang={book.language} className="text-sm">
          {authors}
        </p>
      )}
    </>
  );
}

/** What you see when a book is opened: a side card on larger screens, a bottom sheet on phones. */
export function DetailsPanel({ book, mobile, onClose }: { book: BookListItem | null; mobile: boolean; onClose: () => void }) {
  if (mobile) {
    return (
      <Sheet open={!!book} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {book && (
            <div className="flex flex-col gap-3 pt-4">
              <SheetTitle lang={book.language} className="pr-8 font-heading text-xl">
                {book.title}
              </SheetTitle>
              {book.titleLatin && <SheetDescription className="-mt-2 italic">{book.titleLatin}</SheetDescription>}
              <Details book={book} />
              <Link href={`/books/${book.id}`} className={buttonVariants({ size: "lg", className: "mt-1 w-full" })}>
                Open book page <ArrowRightIcon />
              </Link>
            </div>
          )}
        </SheetContent>
      </Sheet>
    );
  }
  if (!book) return null;
  return (
    <aside
      aria-label="Book details"
      className="animate-in fade-in slide-in-from-right-4 absolute top-40 right-4 z-20 flex w-80 flex-col gap-3 rounded-xl border bg-card/95 p-5 text-card-foreground shadow-xl backdrop-blur duration-300"
    >
      <div className="flex items-start justify-between gap-2">
        <h2 lang={book.language} className="text-xl leading-snug">
          {book.title}
        </h2>
        <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={onClose}>
          <XIcon />
        </Button>
      </div>
      {book.titleLatin && <p className="-mt-2 text-sm text-muted-foreground italic">{book.titleLatin}</p>}
      <Details book={book} />
      <Link href={`/books/${book.id}`} className={buttonVariants({ className: "mt-1" })}>
        Open book page <ArrowRightIcon />
      </Link>
    </aside>
  );
}
