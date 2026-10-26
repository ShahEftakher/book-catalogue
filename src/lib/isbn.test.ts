import { describe, expect, it } from "vitest";
import {
  cleanIsbn,
  isBookBarcode,
  isValidIsbn10,
  isValidIsbn13,
  isbn10To13,
  isbn13To10,
  normalizeIsbn,
} from "./isbn";

describe("isbn", () => {
  it("validates ISBN-13 checksums", () => {
    expect(isValidIsbn13("9780141036144")).toBe(true);
    expect(isValidIsbn13("9780141036145")).toBe(false);
    expect(isValidIsbn13("1234567890123")).toBe(false);
  });

  it("validates ISBN-10 checksums including X", () => {
    expect(isValidIsbn10("0141036141")).toBe(true);
    expect(isValidIsbn10("080442957X")).toBe(true);
    expect(isValidIsbn10("0141036142")).toBe(false);
  });

  it("converts between ISBN-10 and ISBN-13", () => {
    expect(isbn10To13("0141036141")).toBe("9780141036144");
    expect(isbn13To10("9780141036144")).toBe("0141036141");
    expect(isbn13To10("9791032305690")).toBeNull();
  });

  it("cleans hyphens, spaces and Bangla digits", () => {
    expect(cleanIsbn("978-0-14-103614-4")).toBe("9780141036144");
    expect(cleanIsbn("৯৭৮ ০১৪১০৩৬১৪৪")).toBe("9780141036144");
    expect(cleanIsbn("080442957x")).toBe("080442957X");
  });

  it("normalizes any valid input to ISBN-13 (+10 when possible)", () => {
    expect(normalizeIsbn("0-14-103614-1")).toEqual({ isbn13: "9780141036144", isbn10: "0141036141" });
    expect(normalizeIsbn("৯৭৮০১৪১০৩৬১৪৪")).toEqual({ isbn13: "9780141036144", isbn10: "0141036141" });
    expect(normalizeIsbn("not an isbn")).toBeNull();
  });

  it("only accepts Bookland EAN-13 barcodes", () => {
    expect(isBookBarcode("9780141036144")).toBe(true);
    expect(isBookBarcode("5012345678900")).toBe(false);
  });
});
