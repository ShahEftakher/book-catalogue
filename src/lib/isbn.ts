import { toAsciiDigits } from "./bn";

/** Strips hyphens/spaces, converts Bangla digits and upper-cases a trailing x. */
export function cleanIsbn(input: string): string {
  return toAsciiDigits(input)
    .replace(/[\s\-‐‑–—]/g, "")
    .toUpperCase();
}

export function isValidIsbn10(isbn: string): boolean {
  if (!/^\d{9}[\dX]$/.test(isbn)) return false;
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    const v = isbn[i] === "X" ? 10 : Number(isbn[i]);
    sum += v * (10 - i);
  }
  return sum % 11 === 0;
}

function isbn13CheckDigit(first12: string): number {
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(first12[i]) * (i % 2 === 0 ? 1 : 3);
  return (10 - (sum % 10)) % 10;
}

export function isValidIsbn13(isbn: string): boolean {
  if (!/^97[89]\d{10}$/.test(isbn)) return false;
  return isbn13CheckDigit(isbn.slice(0, 12)) === Number(isbn[12]);
}

export function isbn10To13(isbn10: string): string {
  const first12 = "978" + isbn10.slice(0, 9);
  return first12 + isbn13CheckDigit(first12);
}

/** Only 978-prefixed ISBN-13s have an ISBN-10 equivalent. */
export function isbn13To10(isbn13: string): string | null {
  if (!isbn13.startsWith("978")) return null;
  const core = isbn13.slice(3, 12);
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(core[i]) * (10 - i);
  const check = (11 - (sum % 11)) % 11;
  return core + (check === 10 ? "X" : String(check));
}

export type NormalizedIsbn = { isbn13: string; isbn10: string | null };

/** Parses any ISBN-10/13 input (hyphens, spaces, Bangla digits allowed). Null if invalid. */
export function normalizeIsbn(input: string): NormalizedIsbn | null {
  const isbn = cleanIsbn(input);
  if (isValidIsbn13(isbn)) return { isbn13: isbn, isbn10: isbn13To10(isbn) };
  if (isValidIsbn10(isbn)) return { isbn13: isbn10To13(isbn), isbn10: isbn };
  return null;
}

/** A scanned EAN-13 is a book barcode only in the 978/979 "Bookland" range. */
export function isBookBarcode(code: string): boolean {
  return isValidIsbn13(cleanIsbn(code));
}
