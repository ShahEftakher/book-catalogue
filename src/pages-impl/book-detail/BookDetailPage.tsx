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
    <div className="flex gap-3 py-1.5 text-sm">
      <dt className="w-28 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0">{children}</dd>
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

      <div className="grid gap-8 md:grid-cols-[220px_1fr]">
        <CoverImage src={book.coverUrl} title={book.title} lang={lang} className="mx-auto w-48 md:w-full" />

        <div className="flex min-w-0 flex-col gap-4">
          <header className="flex flex-col gap-1">
            <h1 lang={lang} className="text-2xl font-semibold tracking-tight">
              {book.title}
            </h1>
            {book.subtitle && (
              <p lang={lang} className="text-lg text-muted-foreground">
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
                <Link key={t} href={`/?tag=${encodeURIComponent(t)}`}>
                  <Badge variant="outline">{t}</Badge>
                </Link>
              ))}
            </div>
          )}

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
