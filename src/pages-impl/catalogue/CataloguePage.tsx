import type { BookListItem, CatalogueFilters } from "@/lib/books";
import { LibraryView } from "./LibraryView";

type Props = {
  books: BookListItem[];
  filters: CatalogueFilters;
  tags: string[];
  languages: string[];
  isOwner: boolean;
};

export function CataloguePage({ books, filters, tags, languages, isOwner }: Props) {
  const filtered = !!(filters.q || filters.status || filters.format || filters.tag || filters.lang);
  return <LibraryView books={books} filtered={filtered} tags={tags} languages={languages} isOwner={isOwner} />;
}
