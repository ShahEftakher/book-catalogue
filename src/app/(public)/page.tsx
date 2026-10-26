import { isOwner } from "@/lib/auth";
import { listBooks, listLanguages, listTags, type CatalogueFilters } from "@/lib/books";
import { BOOK_FORMATS, READING_STATUSES } from "@/lib/constants";
import { CataloguePage } from "@/pages-impl/catalogue/CataloguePage";

const SORTS = ["added", "title", "author", "rating", "year"] as const;

function pick<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : undefined;
}

export default async function Page({ searchParams }: PageProps<"/">) {
  const sp = await searchParams;
  const filters: CatalogueFilters = {
    q: typeof sp.q === "string" ? sp.q.slice(0, 200) : undefined,
    status: pick(sp.status, READING_STATUSES),
    format: pick(sp.format, BOOK_FORMATS),
    tag: typeof sp.tag === "string" ? sp.tag : undefined,
    lang: typeof sp.lang === "string" ? sp.lang : undefined,
    sort: pick(sp.sort, SORTS),
  };
  const [books, tags, languages, owner] = await Promise.all([
    listBooks(filters),
    listTags(),
    listLanguages(),
    isOwner(),
  ]);
  return (
    <CataloguePage
      books={books}
      filters={filters}
      tags={tags}
      languages={languages}
      isOwner={owner}
    />
  );
}
