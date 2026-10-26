// Helpers for Bangla (Bengali-script) text.

const BN_ZERO = 0x09e6; // ০

/** Converts Bengali digits (০–৯) to ASCII digits, leaving everything else untouched. */
export function toAsciiDigits(input: string): string {
  return input.replace(/[০-৯]/g, (d) => String(d.charCodeAt(0) - BN_ZERO));
}

/** True if the text contains any Bengali-script character. */
export function hasBangla(input: string | null | undefined): boolean {
  return !!input && /[ঀ-৿]/.test(input);
}

/**
 * Canonical form for stored and searched text: Unicode NFC (so the same Bangla word typed on
 * different keyboards compares equal), trimmed, with runs of whitespace collapsed.
 */
export function normalizeText(input: string): string {
  return input.normalize("NFC").replace(/\s+/g, " ").trim();
}

/** normalizeText that maps empty results to null, for optional DB columns. */
export function normalizeOptional(input: string | null | undefined): string | null {
  if (input == null) return null;
  const out = normalizeText(input);
  return out === "" ? null : out;
}

/** Best guess at a book's language from its title: "bn" for Bengali script, otherwise "en". */
export function guessLanguage(title: string): "bn" | "en" {
  return hasBangla(title) ? "bn" : "en";
}
