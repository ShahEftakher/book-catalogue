import { describe, expect, it } from "vitest";
import { emptyBookForm } from "../book-form";
import { bookInput } from "./book";

describe("bookInput", () => {
  it("accepts Bangla digits in number fields and drops blank authors", () => {
    const data = bookInput.parse(
      emptyBookForm({
        title: "হিমু",
        publishedYear: "১৯৯৩",
        pages: "১২০",
        authors: [{ name: "হুমায়ূন আহমেদ", nameLatin: "Humayun Ahmed" }, { name: " ", nameLatin: "" }],
      }),
    );
    expect(data.publishedYear).toBe(1993);
    expect(data.pages).toBe(120);
    expect(data.authors).toEqual([{ name: "হুমায়ূন আহমেদ", nameLatin: "Humayun Ahmed" }]);
  });

  it("rejects bad ISBNs, ratings and missing titles", () => {
    expect(bookInput.safeParse(emptyBookForm({ title: "x", isbn: "123" })).success).toBe(false);
    expect(bookInput.safeParse(emptyBookForm({ title: "x", rating: 4.3 })).success).toBe(false);
    expect(bookInput.safeParse(emptyBookForm({ title: "" })).success).toBe(false);
    expect(bookInput.safeParse(emptyBookForm({ title: "x", rating: 4.5 })).success).toBe(true);
  });
});
