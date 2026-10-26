import Link from "next/link";
import { Suspense } from "react";
import { BookCard } from "@/components/BookCard";
import { EmptyState } from "@/components/EmptyState";
import type { BookListItem, CatalogueFilters } from "@/lib/books";
import { Filters } from "./Filters";

type Props = {
  books: BookListItem[];
  filters: CatalogueFilters;
  tags: string[];
  languages: string[];
  isOwner: boolean;
};

export function CataloguePage({ books, filters, tags, languages, isOwner }: Props) {
  const filtered = !!(filters.q || filters.status || filters.format || filters.tag || filters.lang);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Library</h1>
        <p className="text-sm text-muted-foreground">
          {books.length} {books.length === 1 ? "book" : "books"}
          {filtered && " matching"}
        </p>
      </div>
      <Suspense>
        <Filters tags={tags} languages={languages} />
      </Suspense>
      {books.length === 0 ? (
        filtered ? (
          <EmptyState title="No books match">Try a different search or clear the filters.</EmptyState>
        ) : (
          <EmptyState title="The shelf is empty">
            {isOwner ? (
              <Link href="/admin/books/new" className="underline">
                Add your first book
              </Link>
            ) : (
              "Check back soon."
            )}
          </EmptyState>
        )
      ) : (
        <div className="grid grid-cols-2 gap-x-3 gap-y-5 min-[480px]:grid-cols-3 sm:gap-x-4 sm:gap-y-6 md:grid-cols-4 lg:grid-cols-6">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}
