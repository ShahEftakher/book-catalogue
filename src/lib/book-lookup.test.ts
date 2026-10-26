import { describe, expect, it } from "vitest";
import { mapGoogleBooks, mapOpenLibrary, mergeResults } from "./book-lookup";

const ISBN = "9780141036144";

describe("book lookup mapping", () => {
  it("maps Open Library data", () => {
    const r = mapOpenLibrary(ISBN, {
      [`ISBN:${ISBN}`]: {
        title: "Nineteen Eighty-Four",
        authors: [{ name: "George Orwell" }],
        publishers: [{ name: "Penguin" }],
        publish_date: "June 2008",
        number_of_pages: 355,
        cover: { large: "https://covers.openlibrary.org/b/id/1-L.jpg" },
      },
    });
    expect(r).toMatchObject({
      source: "openlibrary",
      title: "Nineteen Eighty-Four",
      authors: ["George Orwell"],
      publisher: "Penguin",
      publishedYear: 2008,
      pages: 355,
    });
  });

  it("returns null when Open Library has no entry", () => {
    expect(mapOpenLibrary(ISBN, {})).toBeNull();
    expect(mapOpenLibrary(ISBN, null)).toBeNull();
  });

  it("maps Google Books data and upgrades the thumbnail to https", () => {
    const r = mapGoogleBooks(ISBN, {
      items: [
        {
          volumeInfo: {
            title: "1984",
            authors: ["George Orwell"],
            publishedDate: "2008-07-03",
            language: "en",
            description: "A dystopia.",
            imageLinks: { thumbnail: "http://books.google.com/x?id=1&edge=curl" },
          },
        },
      ],
    });
    expect(r?.coverUrl).toBe("https://books.google.com/x?id=1");
    expect(r?.publishedYear).toBe(2008);
    expect(r?.language).toBe("en");
  });

  it("prefers Open Library and fills gaps from Google", () => {
    const ol = mapOpenLibrary(ISBN, {
      [`ISBN:${ISBN}`]: { title: "Nineteen Eighty-Four", authors: [] },
    });
    const google = mapGoogleBooks(ISBN, {
      items: [{ volumeInfo: { title: "1984", authors: ["George Orwell"], description: "A dystopia." } }],
    });
    const merged = mergeResults(ol, google);
    expect(merged?.title).toBe("Nineteen Eighty-Four");
    expect(merged?.authors).toEqual(["George Orwell"]);
    expect(merged?.description).toBe("A dystopia.");
    expect(merged?.source).toBe("openlibrary");
  });
});
