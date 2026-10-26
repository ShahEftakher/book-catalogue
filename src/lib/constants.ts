// Shared between the DB schema, validation and client components (no server imports here).

export const BOOK_FORMATS = ["hardcover", "paperback", "ebook", "kindle", "audiobook"] as const;
export type BookFormat = (typeof BOOK_FORMATS)[number];

export const READING_STATUSES = ["want_to_read", "reading", "read", "abandoned"] as const;
export type ReadingStatus = (typeof READING_STATUSES)[number];

export const BOOK_SOURCES = ["openlibrary", "google", "photo", "manual", "import"] as const;
export type BookSource = (typeof BOOK_SOURCES)[number];

export const FORMAT_LABELS: Record<BookFormat, string> = {
  hardcover: "Hardcover",
  paperback: "Paperback",
  ebook: "E-book",
  kindle: "Kindle",
  audiobook: "Audiobook",
};

export const STATUS_LABELS: Record<ReadingStatus, string> = {
  want_to_read: "Want to read",
  reading: "Reading",
  read: "Read",
  abandoned: "Abandoned",
};

export const LANGUAGES = [
  { code: "bn", label: "Bangla" },
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "ur", label: "Urdu" },
  { code: "ar", label: "Arabic" },
  { code: "other", label: "Other" },
] as const;

export function languageLabel(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.label ?? code;
}
