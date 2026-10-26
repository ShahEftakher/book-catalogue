// Converts between stored/looked-up books and the book form's values. Client-safe.
import { guessLanguage } from "./bn";
import type { BookSource } from "./constants";
import type { BookInput } from "./validation/book";

export type SaveResult = { ok: true; id: string } | { ok: false; error: string; existingId?: string };

export function emptyBookForm(overrides: Partial<BookInput> = {}): BookInput {
  return {
    isbn: "",
    title: "",
    titleLatin: "",
    subtitle: "",
    authors: [{ name: "", nameLatin: "" }],
    publisherName: "",
    publisherNameLatin: "",
    publishedYear: "",
    edition: "",
    pages: "",
    language: "en",
    description: "",
    coverUrl: "",
    formats: ["paperback"],
    location: "",
    copies: "1",
    tags: [],
    source: "manual",
    status: "want_to_read",
    startedAt: "",
    finishedAt: "",
    rating: undefined,
    reviewPublic: "",
    notesPrivate: "",
    ...overrides,
  };
}

export type LookupLike = {
  source: BookSource;
  isbn13: string;
  title: string;
  subtitle?: string;
  authors: string[];
  publisher?: string;
  publishedYear?: number;
  pages?: number;
  language?: string;
  description?: string;
  coverUrl?: string;
};

export function lookupToForm(r: LookupLike): BookInput {
  return emptyBookForm({
    isbn: r.isbn13,
    title: r.title,
    subtitle: r.subtitle ?? "",
    authors: r.authors.length ? r.authors.map((name) => ({ name, nameLatin: "" })) : undefined,
    publisherName: r.publisher ?? "",
    publishedYear: r.publishedYear ? String(r.publishedYear) : "",
    pages: r.pages ? String(r.pages) : "",
    language: r.language?.slice(0, 2) || guessLanguage(r.title),
    description: r.description ?? "",
    coverUrl: r.coverUrl ?? "",
    source: r.source,
  });
}

type StoredBook = {
  isbn13: string | null;
  title: string;
  titleLatin: string | null;
  subtitle: string | null;
  authors: { name: string; nameLatin: string | null }[];
  publisher: { name: string; nameLatin: string | null } | null;
  publishedYear: number | null;
  edition: string | null;
  pages: number | null;
  language: string;
  description: string | null;
  coverUrl: string | null;
  formats: BookInput["formats"];
  location: string | null;
  copies: number;
  tags: string[];
  source: BookSource;
  reading: {
    status: BookInput["status"];
    startedAt: string | null;
    finishedAt: string | null;
    rating: number | null;
    reviewPublic: string | null;
    notesPrivate: string | null;
  } | null;
};

export function bookToForm(b: StoredBook): BookInput {
  return emptyBookForm({
    isbn: b.isbn13 ?? "",
    title: b.title,
    titleLatin: b.titleLatin ?? "",
    subtitle: b.subtitle ?? "",
    authors: b.authors.length
      ? b.authors.map((a) => ({ name: a.name, nameLatin: a.nameLatin ?? "" }))
      : [{ name: "", nameLatin: "" }],
    publisherName: b.publisher?.name ?? "",
    publisherNameLatin: b.publisher?.nameLatin ?? "",
    publishedYear: b.publishedYear ? String(b.publishedYear) : "",
    edition: b.edition ?? "",
    pages: b.pages ? String(b.pages) : "",
    language: b.language,
    description: b.description ?? "",
    coverUrl: b.coverUrl ?? "",
    formats: b.formats,
    location: b.location ?? "",
    copies: String(b.copies),
    tags: b.tags,
    source: b.source,
    status: b.reading?.status ?? "want_to_read",
    startedAt: b.reading?.startedAt ?? "",
    finishedAt: b.reading?.finishedAt ?? "",
    rating: b.reading?.rating ?? undefined,
    reviewPublic: b.reading?.reviewPublic ?? "",
    notesPrivate: b.reading?.notesPrivate ?? "",
  });
}
