import { describe, expect, it } from "vitest";
import { guessLanguage, hasBangla, normalizeOptional, normalizeText, toAsciiDigits } from "./bn";

describe("bn", () => {
  it("converts Bengali digits", () => {
    expect(toAsciiDigits("১৯৭১ সাল, page 12")).toBe("1971 সাল, page 12");
  });

  it("detects Bengali script", () => {
    expect(hasBangla("হিমু")).toBe(true);
    expect(hasBangla("Himu")).toBe(false);
    expect(guessLanguage("পথের পাঁচালী")).toBe("bn");
    expect(guessLanguage("Sapiens")).toBe("en");
  });

  it("normalizes to NFC and collapses whitespace", () => {
    // য় written as য + nukta (decomposed) must equal the precomposed য়
    const decomposed = "হুমায়ূন";
    const composed = "হুমায়ূন";
    expect(normalizeText(decomposed)).toBe(normalizeText(composed));
    expect(normalizeText("  a   b \n c ")).toBe("a b c");
  });

  it("maps blank optional text to null", () => {
    expect(normalizeOptional("   ")).toBeNull();
    expect(normalizeOptional(undefined)).toBeNull();
    expect(normalizeOptional(" x ")).toBe("x");
  });
});
