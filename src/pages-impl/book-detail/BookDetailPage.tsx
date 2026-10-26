import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeftIcon, PencilIcon } from "lucide-react";
import { CoverImage } from "@/components/CoverImage";
import { RatingStars } from "@/components/RatingStars";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import type { BookDetail } from "@/lib/books";
import { FORMAT_LABELS, languageLabel } from "@/lib/constants";

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 py-2 text-sm">
      <dt className="w-24 shrink-0 text-muted-foreground sm:w-28">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

export function BookDetailPage({ book, isOwner }: { book: BookDetail; isOwner: boolean }) {
  const lang = book.language;
  const r = book.reading;
  return (
    <article className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Link href="/" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          <ArrowLeftIcon /> Library
        </Link>
        {isOwner && (
          <Link href={`/admin/books/${book.id}/edit`} className={buttonVariants({ size: "sm", variant: "outline" })}>
            <PencilIcon /> Edit
          </Link>
        )}
      </div>

      {/* Phones: small cover beside the title, details below. md+: cover column on the left. */}
      <div className="grid grid-cols-[6.5rem_1fr] gap-x-4 gap-y-5 md:grid-cols-[220px_1fr] md:gap-x-8">
        <CoverImage
          src={book.coverUrl}
          title={book.title}
          lang={lang}
          className="w-full self-start md:row-span-2"
        />

        <div className="flex min-w-0 flex-col gap-3">
          <header className="flex flex-col gap-1">
            <h1 lang={lang} className="text-xl font-semibold tracking-tight break-words sm:text-2xl">
              {book.title}
            </h1>
            {book.subtitle && (
              <p lang={lang} className="text-base text-muted-foreground sm:text-lg">
                {book.subtitle}
              </p>
            )}
            {book.titleLatin && <p className="text-sm text-muted-foreground italic">{book.titleLatin}</p>}
            {book.authors.length > 0 && (
              <p className="mt-1">
                {book.authors.map((a, i) => (
                  <span key={a.id}>
                    {i > 0 && ", "}
                    <Link href={`/?q=${encodeURIComponent(a.name)}`} lang={lang} className="hover:underline">
                      {a.name}
                    </Link>
                    {a.nameLatin && a.nameLatin !== a.name && (
                      <span className="text-sm text-muted-foreground"> ({a.nameLatin})</span>
                    )}
                  </span>
                ))}
              </p>
            )}
          </header>

          {r && (
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={r.status} />
              {r.rating != null && <RatingStars rating={r.rating} />}
              {r.finishedAt && <span className="text-sm text-muted-foreground">Finished {r.finishedAt}</span>}
              {!r.finishedAt && r.startedAt && (
                <span className="text-sm text-muted-foreground">Started {r.startedAt}</span>
              )}
            </div>
          )}

          {book.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {book.tags.map((t) => (
                <Link key={t} href={`/?tag=${encodeURIComponent(t)}`} className="max-sm:py-1">
                  <Badge variant="outline" className="max-sm:h-7 max-sm:px-3 max-sm:text-sm">
                    {t}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="col-span-2 flex min-w-0 flex-col gap-4 md:col-span-1 md:col-start-2">

          <dl className="divide-y rounded-lg border px-4 py-1">
            {book.publisher && (
              <Fact label="Publisher">
                <span lang={lang}>{book.publisher.name}</span>
                {book.publisher.nameLatin && (
                  <span className="text-muted-foreground"> ({book.publisher.nameLatin})</span>
                )}
              </Fact>
            )}
            {book.publishedYear && <Fact label="Published">{book.publishedYear}</Fact>}
            {book.edition && <Fact label="Edition"><span lang={lang}>{book.edition}</span></Fact>}
            {book.pages && <Fact label="Pages">{book.pages}</Fact>}
            <Fact label="Language">{languageLabel(book.language)}</Fact>
            {book.isbn13 && <Fact label="ISBN">{book.isbn13}</Fact>}
            <Fact label="Format">
              {book.formats.map((f) => FORMAT_LABELS[f]).join(", ")}
              {book.copies > 1 && ` · ${book.copies} copies`}
            </Fact>
            {isOwner && book.location && <Fact label="Shelf">{book.location}</Fact>}
          </dl>

          {r?.reviewPublic && (
            <section className="flex flex-col gap-1">
              <h2 className="font-medium">Review</h2>
              <p className="text-sm whitespace-pre-line">{r.reviewPublic}</p>
            </section>
          )}

          {book.description && (
            <section className="flex flex-col gap-1">
              <h2 className="font-medium">About this book</h2>
              <p lang={lang} className="text-sm whitespace-pre-line text-muted-foreground">
                {book.description}
              </p>
            </section>
          )}

          {isOwner && r?.notesPrivate && (
            <section className="flex flex-col gap-1 rounded-lg bg-amber-50 p-3">
              <h2 className="text-sm font-medium">Private notes (only you see these)</h2>
              <p className="text-sm whitespace-pre-line">{r.notesPrivate}</p>
            </section>
          )}
        </div>
      </div>
    </article>
  );
}
