import { z } from "zod";
import { BOOK_FORMATS, BOOK_SOURCES, READING_STATUSES } from "@/lib/constants";
import { toAsciiDigits } from "@/lib/bn";
import { normalizeIsbn } from "@/lib/isbn";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined));

// Number inputs arrive as strings (possibly in Bangla digits) or "" when empty.
const optionalInt = (min: number, max: number) =>
  z.preprocess(
    (v) => {
      if (v === "" || v == null) return undefined;
      if (typeof v === "string") return Number(toAsciiDigits(v).trim());
      return v;
    },
    z.number().int().min(min).max(max).optional(),
  );

const optionalDate = z
  .string()
  .optional()
  .refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), "Use YYYY-MM-DD")
  .transform((v) => (v ? v : undefined));

export const authorInput = z.object({
  name: z.string().trim(),
  nameLatin: optionalText,
});

export const bookInput = z.object({
  isbn: z
    .string()
    .optional()
    .refine((v) => !v || v.trim() === "" || normalizeIsbn(v) !== null, "Not a valid ISBN"),
  title: z.string().trim().min(1, "Title is required"),
  titleLatin: optionalText,
  subtitle: optionalText,
  // Blank author rows in the form are simply dropped
  authors: z
    .array(authorInput)
    .max(20)
    .transform((list) => list.filter((a) => a.name !== "")),
  publisherName: optionalText,
  publisherNameLatin: optionalText,
  publishedYear: optionalInt(0, 2100),
  edition: optionalText,
  pages: optionalInt(1, 100000),
  language: z.string().trim().min(2).max(8),
  description: optionalText,
  coverUrl: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || /^https?:\/\//.test(v), "Must be an http(s) URL")
    .transform((v) => (v ? v : undefined)),
  formats: z.array(z.enum(BOOK_FORMATS)).min(1, "Pick at least one format"),
  location: optionalText,
  copies: optionalInt(1, 99),
  tags: z.array(z.string().trim().min(1).max(40)).max(30),
  source: z.enum(BOOK_SOURCES).default("manual"),
  status: z.enum(READING_STATUSES),
  startedAt: optionalDate,
  finishedAt: optionalDate,
  rating: z.preprocess(
    (v) => (v === "" || v == null || v === 0 ? undefined : Number(v)),
    z
      .number()
      .min(0.5)
      .max(5)
      .refine((n) => Number.isInteger(n * 2), "Half steps only")
      .optional(),
  ),
  reviewPublic: optionalText,
  notesPrivate: optionalText,
});

export type BookInput = z.input<typeof bookInput>;
export type BookData = z.output<typeof bookInput>;
