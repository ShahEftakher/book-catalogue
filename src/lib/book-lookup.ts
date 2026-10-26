import "server-only";
import { guessLanguage, normalizeOptional } from "./bn";
import type { BookSource } from "./constants";

/** Book metadata found online, shaped to pre-fill the book form. */
export type LookupResult = {
  source: Extract<BookSource, "openlibrary" | "google">;
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

const TIMEOUT_MS = 6000;

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "User-Agent": "book-catalogue (personal project)" },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function parseYear(date: string | undefined): number | undefined {
  const m = date?.match(/\b(1[5-9]\d\d|20\d\d)\b/);
  return m ? Number(m[1]) : undefined;
}

type OpenLibraryData = Record<
  string,
  {
    title?: string;
    subtitle?: string;
    authors?: { name: string }[];
    publishers?: { name: string }[];
    publish_date?: string;
    number_of_pages?: number;
    cover?: { small?: string; medium?: string; large?: string };
    notes?: string | { value: string };
  }
>;

export function mapOpenLibrary(isbn13: string, data: OpenLibraryData | null): LookupResult | null {
  const book = data?.[`ISBN:${isbn13}`];
  if (!book?.title) return null;
  return {
    source: "openlibrary",
    isbn13,
    title: book.title,
    subtitle: book.subtitle,
    authors: (book.authors ?? []).map((a) => a.name),
    publisher: book.publishers?.[0]?.name,
    publishedYear: parseYear(book.publish_date),
    pages: book.number_of_pages,
    coverUrl: book.cover?.large ?? book.cover?.medium,
  };
}

type GoogleBooksData = {
  items?: {
    volumeInfo: {
      title?: string;
      subtitle?: string;
      authors?: string[];
      publisher?: string;
      publishedDate?: string;
      pageCount?: number;
      language?: string;
      description?: string;
      imageLinks?: { thumbnail?: string; smallThumbnail?: string };
    };
  }[];
};

export function mapGoogleBooks(isbn13: string, data: GoogleBooksData | null): LookupResult | null {
  const info = data?.items?.[0]?.volumeInfo;
  if (!info?.title) return null;
  const thumb = info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail;
  return {
    source: "google",
    isbn13,
    title: info.title,
    subtitle: info.subtitle,
    authors: info.authors ?? [],
    publisher: info.publisher,
    publishedYear: parseYear(info.publishedDate),
    pages: info.pageCount || undefined,
    language: info.language,
    description: info.description,
    // Google serves http thumbnails with a page curl; https + no edge curl looks better
    coverUrl: thumb?.replace(/^http:/, "https:").replace("&edge=curl", ""),
  };
}

/** Open Library first; Google Books fills in anything Open Library is missing. */
export function mergeResults(
  primary: LookupResult | null,
  fallback: LookupResult | null,
): LookupResult | null {
  if (!primary) return fallback;
  if (!fallback) return primary;
  const merged: LookupResult = { ...primary };
  for (const key of Object.keys(fallback) as (keyof LookupResult)[]) {
    const value = merged[key];
    if (value === undefined || (Array.isArray(value) && value.length === 0)) {
      (merged as Record<string, unknown>)[key] = fallback[key];
    }
  }
  return merged;
}

/** Looks a (valid, normalised) ISBN-13 up online. Returns null when nobody knows it. */
export async function lookupIsbn(isbn13: string): Promise<LookupResult | null> {
  const googleKey = process.env.GOOGLE_BOOKS_API_KEY;
  const [ol, google] = await Promise.all([
    fetchJson<OpenLibraryData>(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn13}&format=json&jscmd=data`,
    ),
    fetchJson<GoogleBooksData>(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn13}${googleKey ? `&key=${googleKey}` : ""}`,
    ),
  ]);

  const result = mergeResults(mapOpenLibrary(isbn13, ol), mapGoogleBooks(isbn13, google));
  if (!result) return null;

  result.title = normalizeOptional(result.title) ?? result.title;
  result.authors = result.authors.map((a) => normalizeOptional(a)).filter((a): a is string => !!a);
  result.language ??= guessLanguage(result.title);
  return result;
}
