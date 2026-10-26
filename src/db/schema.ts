import { relations, sql } from "drizzle-orm";
import {
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { BOOK_FORMATS, BOOK_SOURCES, READING_STATUSES } from "../lib/constants";

export const bookFormat = pgEnum("book_format", BOOK_FORMATS);

export const readingStatus = pgEnum("reading_status", READING_STATUSES);

export const bookSource = pgEnum("book_source", BOOK_SOURCES);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const publishers = pgTable(
  "publishers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    nameLatin: text("name_latin"),
  },
  (t) => [uniqueIndex("publishers_name_uq").on(t.name)],
);

export const authors = pgTable(
  "authors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Name in the original script, e.g. হুমায়ূন আহমেদ
    name: text("name").notNull(),
    // Romanized, e.g. Humayun Ahmed — lets Latin-keyboard searches find Bangla authors
    nameLatin: text("name_latin"),
  },
  (t) => [
    uniqueIndex("authors_name_uq").on(t.name),
    index("authors_name_trgm").using("gin", sql`lower(${t.name}) gin_trgm_ops`),
    index("authors_name_latin_trgm").using("gin", sql`lower(${t.nameLatin}) gin_trgm_ops`),
  ],
);

export const books = pgTable(
  "books",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    isbn13: text("isbn13"),
    isbn10: text("isbn10"),
    // Kindle editions are identified by ASIN (v2 Kindle import)
    asin: text("asin"),
    title: text("title").notNull(),
    titleLatin: text("title_latin"),
    subtitle: text("subtitle"),
    publisherId: uuid("publisher_id").references(() => publishers.id, { onDelete: "set null" }),
    publishedYear: integer("published_year"),
    edition: text("edition"),
    pages: integer("pages"),
    language: text("language").notNull().default("en"),
    description: text("description"),
    coverUrl: text("cover_url"),
    // A single book can be owned in several formats (e.g. paperback + kindle)
    formats: bookFormat("formats").array().notNull().default(sql`ARRAY['paperback']::book_format[]`),
    location: text("location"),
    copies: integer("copies").notNull().default(1),
    source: bookSource("source").notNull().default("manual"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("books_isbn13_uq").on(t.isbn13),
    uniqueIndex("books_asin_uq").on(t.asin),
    index("books_title_trgm").using("gin", sql`lower(${t.title}) gin_trgm_ops`),
    index("books_title_latin_trgm").using("gin", sql`lower(${t.titleLatin}) gin_trgm_ops`),
    index("books_created_at_idx").on(t.createdAt),
  ],
);

export const bookAuthors = pgTable(
  "book_authors",
  {
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => authors.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.bookId, t.authorId] })],
);

export const reading = pgTable("reading", {
  bookId: uuid("book_id")
    .primaryKey()
    .references(() => books.id, { onDelete: "cascade" }),
  status: readingStatus("status").notNull().default("want_to_read"),
  startedAt: date("started_at"),
  finishedAt: date("finished_at"),
  // 0.5–5.0 in half steps
  rating: numeric("rating", { precision: 2, scale: 1, mode: "number" }),
  reviewPublic: text("review_public"),
  notesPrivate: text("notes_private"),
  ...timestamps,
});

export const tags = pgTable(
  "tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
  },
  (t) => [uniqueIndex("tags_name_uq").on(t.name)],
);

export const bookTags = pgTable(
  "book_tags",
  {
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.bookId, t.tagId] })],
);

// Lending tracker (UI lands in pass 2)
export const loans = pgTable(
  "loans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    borrowerName: text("borrower_name").notNull(),
    borrowerContact: text("borrower_contact"),
    lentAt: date("lent_at").notNull().defaultNow(),
    dueAt: date("due_at"),
    returnedAt: date("returned_at"),
    note: text("note"),
    ...timestamps,
  },
  (t) => [index("loans_book_idx").on(t.bookId)],
);

export const booksRelations = relations(books, ({ one, many }) => ({
  publisher: one(publishers, { fields: [books.publisherId], references: [publishers.id] }),
  authors: many(bookAuthors),
  tags: many(bookTags),
  reading: one(reading, { fields: [books.id], references: [reading.bookId] }),
  loans: many(loans),
}));

export const bookAuthorsRelations = relations(bookAuthors, ({ one }) => ({
  book: one(books, { fields: [bookAuthors.bookId], references: [books.id] }),
  author: one(authors, { fields: [bookAuthors.authorId], references: [authors.id] }),
}));

export const bookTagsRelations = relations(bookTags, ({ one }) => ({
  book: one(books, { fields: [bookTags.bookId], references: [books.id] }),
  tag: one(tags, { fields: [bookTags.tagId], references: [tags.id] }),
}));

export const readingRelations = relations(reading, ({ one }) => ({
  book: one(books, { fields: [reading.bookId], references: [books.id] }),
}));

export const loansRelations = relations(loans, ({ one }) => ({
  book: one(books, { fields: [loans.bookId], references: [books.id] }),
}));
