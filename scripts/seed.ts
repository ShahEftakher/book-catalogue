// Adds a few sample books (Bangla + English) to an empty catalogue: pnpm db:seed
import { config } from "dotenv";

config({ path: ".env.local" });

const SAMPLES = [
  {
    isbn: "9780141036144",
    title: "Nineteen Eighty-Four",
    authors: [{ name: "George Orwell" }],
    publisherName: "Penguin",
    publishedYear: "2008",
    pages: "355",
    language: "en",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780141036144-L.jpg",
    formats: ["paperback"],
    tags: ["fiction", "classic"],
    status: "read",
    rating: 4.5,
  },
  {
    title: "হিমু",
    titleLatin: "Himu",
    authors: [{ name: "হুমায়ূন আহমেদ", nameLatin: "Humayun Ahmed" }],
    publisherName: "অন্যপ্রকাশ",
    publisherNameLatin: "Anyaprokash",
    publishedYear: "1993",
    language: "bn",
    formats: ["hardcover"],
    tags: ["fiction", "Himu series"],
    status: "read",
    rating: 5,
  },
  {
    title: "পথের পাঁচালী",
    titleLatin: "Pather Panchali",
    authors: [{ name: "বিভূতিভূষণ বন্দ্যোপাধ্যায়", nameLatin: "Bibhutibhushan Bandyopadhyay" }],
    publishedYear: "1929",
    language: "bn",
    formats: ["paperback", "kindle"],
    tags: ["classic"],
    status: "reading",
  },
  {
    isbn: "9780062316097",
    title: "Sapiens",
    subtitle: "A Brief History of Humankind",
    authors: [{ name: "Yuval Noah Harari" }],
    publisherName: "Harper",
    publishedYear: "2015",
    language: "en",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780062316097-L.jpg",
    formats: ["kindle"],
    tags: ["non-fiction", "history"],
    status: "want_to_read",
  },
];

async function main() {
  // Imported after dotenv so the DB pool sees DATABASE_URL
  const { db } = await import("@/db");
  const { books } = await import("@/db/schema");
  const { saveBook } = await import("@/lib/books");
  const { emptyBookForm } = await import("@/lib/book-form");
  const { bookInput } = await import("@/lib/validation/book");

  const existing = await db.$count(books);
  if (existing > 0) {
    console.log(`Catalogue already has ${existing} books; not seeding.`);
  } else {
    for (const sample of SAMPLES) {
      const data = bookInput.parse({ ...emptyBookForm(), ...sample });
      await saveBook(data);
      console.log(`Added ${sample.title}`);
    }
  }
  await db.$client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
