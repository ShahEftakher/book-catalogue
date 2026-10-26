import "server-only";
import { and, asc, desc, eq, inArray, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { authors, bookAuthors, books, bookTags, publishers, reading, tags } from "@/db/schema";
import { normalizeOptional, normalizeText, toAsciiDigits } from "./bn";
import type { BookFormat, ReadingStatus } from "./constants";
import { normalizeIsbn } from "./isbn";
import type { BookData } from "./validation/book";

export type CatalogueFilters = {
  q?: string;
  status?: ReadingStatus;
  format?: BookFormat;
  tag?: string;
  lang?: string;
  sort?: "added" | "title" | "author" | "rating" | "year";
};

export type AuthorRef = { id: string; name: string; nameLatin: string | null };

export type BookListItem = {
  id: string;
  title: string;
  titleLatin: string | null;
  language: string;
  coverUrl: string | null;
  publishedYear: number | null;
  formats: BookFormat[];
  status: ReadingStatus | null;
  rating: number | null;
  authors: AuthorRef[];
};

const firstAuthorName = sql<string>`(
  select a.name from ${bookAuthors} ba join ${authors} a on a.id = ba.author_id
  where ba.book_id = ${books.id} order by ba.position limit 1
)`;

function searchCondition(raw: string): SQL | undefined {
  const q = normalizeText(raw).toLowerCase();
  if (!q) return undefined;
  const like = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  const isbn = normalizeIsbn(q);
  const digits = toAsciiDigits(q).replace(/\D/g, "");
  return sql`(
    lower(${books.title}) like ${like}
    or lower(${books.titleLatin}) like ${like}
    or lower(${books.subtitle}) like ${like}
    or word_similarity(${q}, lower(coalesce(${books.titleLatin}, ${books.title}))) > 0.5
    ${isbn ? sql`or ${books.isbn13} = ${isbn.isbn13}` : sql``}
    ${digits.length >= 4 ? sql`or ${books.isbn13} like ${`%${digits}%`}` : sql``}
    or exists (
      select 1 from ${bookAuthors} ba join ${authors} a on a.id = ba.author_id
      where ba.book_id = ${books.id}
        and (lower(a.name) like ${like} or lower(a.name_latin) like ${like}
             or word_similarity(${q}, lower(coalesce(a.name_latin, a.name))) > 0.5)
    )
  )`;
}

async function authorsFor(bookIds: string[]): Promise<Map<string, AuthorRef[]>> {
  const map = new Map<string, AuthorRef[]>();
  if (bookIds.length === 0) return map;
  const rows = await db
    .select({
      bookId: bookAuthors.bookId,
      id: authors.id,
      name: authors.name,
      nameLatin: authors.nameLatin,
    })
    .from(bookAuthors)
    .innerJoin(authors, eq(authors.id, bookAuthors.authorId))
    .where(inArray(bookAuthors.bookId, bookIds))
    .orderBy(asc(bookAuthors.position));
  for (const { bookId, ...author } of rows) {
    map.set(bookId, [...(map.get(bookId) ?? []), author]);
  }
  return map;
}

export async function listBooks(filters: CatalogueFilters): Promise<BookListItem[]> {
  const conditions: (SQL | undefined)[] = [];
  if (filters.q) conditions.push(searchCondition(filters.q));
  if (filters.status) conditions.push(eq(reading.status, filters.status));
  if (filters.format) conditions.push(sql`${filters.format} = any(${books.formats})`);
  if (filters.lang) conditions.push(eq(books.language, filters.lang));
  if (filters.tag) {
    conditions.push(sql`exists (
      select 1 from ${bookTags} bt join ${tags} t on t.id = bt.tag_id
      where bt.book_id = ${books.id} and t.name = ${filters.tag}
    )`);
  }

  // ICU Bangla collation sorts Bengali titles in alphabet order (and Latin ones sensibly too)
  const order = {
    added: [desc(books.createdAt)],
    title: [sql`${books.title} collate "bn-x-icu"`],
    author: [sql`${firstAuthorName} collate "bn-x-icu" nulls last`, sql`${books.title} collate "bn-x-icu"`],
    rating: [sql`${reading.rating} desc nulls last`, desc(books.createdAt)],
    year: [sql`${books.publishedYear} desc nulls last`],
  }[filters.sort ?? "added"];

  const rows = await db
    .select({
      id: books.id,
      title: books.title,
      titleLatin: books.titleLatin,
      language: books.language,
      coverUrl: books.coverUrl,
      publishedYear: books.publishedYear,
      formats: books.formats,
      status: reading.status,
      rating: reading.rating,
    })
    .from(books)
    .leftJoin(reading, eq(reading.bookId, books.id))
    .where(and(...conditions))
    .orderBy(...order)
    .limit(500);

  const byBook = await authorsFor(rows.map((r) => r.id));
  return rows.map((r) => ({ ...r, authors: byBook.get(r.id) ?? [] }));
}

export async function getBook(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const book = await db.query.books.findFirst({
    where: eq(books.id, id),
    with: {
      publisher: true,
      reading: true,
      authors: { with: { author: true }, orderBy: asc(bookAuthors.position) },
      tags: { with: { tag: true } },
    },
  });
  if (!book) return null;
  return {
    ...book,
    authors: book.authors.map((a) => a.author),
    tags: book.tags.map((t) => t.tag.name).sort(),
  };
}
export type BookDetail = NonNullable<Awaited<ReturnType<typeof getBook>>>;

export async function findBookIdByIsbn(isbn13: string): Promise<string | null> {
  const row = await db.query.books.findFirst({
    where: eq(books.isbn13, isbn13),
    columns: { id: true },
  });
  return row?.id ?? null;
}

export async function listTags(): Promise<string[]> {
  const rows = await db.select({ name: tags.name }).from(tags).orderBy(asc(tags.name));
  return rows.map((r) => r.name);
}

export async function listLanguages(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ language: books.language })
    .from(books)
    .orderBy(asc(books.language));
  return rows.map((r) => r.language);
}

export type Suggestion = { name: string; nameLatin: string | null };

/** Autocomplete over the owner's own authors/publishers/tags (original or romanized). */
export async function suggest(
  kind: "author" | "publisher" | "tag",
  raw: string,
): Promise<Suggestion[]> {
  const q = normalizeText(raw).toLowerCase();
  if (!q) return [];
  const like = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  if (kind === "tag") {
    const rows = await db
      .select({ name: tags.name })
      .from(tags)
      .where(sql`lower(${tags.name}) like ${like}`)
      .orderBy(asc(tags.name))
      .limit(10);
    return rows.map((r) => ({ name: r.name, nameLatin: null }));
  }
  const table = kind === "author" ? authors : publishers;
  return db
    .select({ name: table.name, nameLatin: table.nameLatin })
    .from(table)
    .where(
      sql`lower(${table.name}) like ${like} or lower(${table.nameLatin}) like ${like}
          or word_similarity(${q}, lower(coalesce(${table.nameLatin}, ${table.name}))) > 0.5`,
    )
    .orderBy(
      sql`greatest(similarity(lower(${table.name}), ${q}), similarity(lower(coalesce(${table.nameLatin}, '')), ${q})) desc`,
    )
    .limit(10);
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Finds an author/publisher by exact name (or romanized name) or creates it. */
async function upsertNamed(
  tx: Tx,
  table: typeof authors | typeof publishers,
  name: string,
  nameLatin: string | null,
): Promise<string> {
  const existing = await tx
    .select({ id: table.id, nameLatin: table.nameLatin })
    .from(table)
    .where(
      nameLatin
        ? sql`${table.name} = ${name} or lower(${table.nameLatin}) = ${nameLatin.toLowerCase()}`
        : eq(table.name, name),
    )
    .limit(1);
  if (existing[0]) {
    if (nameLatin && !existing[0].nameLatin) {
      await tx.update(table).set({ nameLatin }).where(eq(table.id, existing[0].id));
    }
    return existing[0].id;
  }
  const [row] = await tx.insert(table).values({ name, nameLatin }).returning({ id: table.id });
  return row.id;
}

export class DuplicateIsbnError extends Error {
  constructor(public existingId: string) {
    super("A book with this ISBN is already in the catalogue");
  }
}

/** Creates (no id) or updates a book with its authors, publisher, tags and reading state. */
export async function saveBook(data: BookData, id?: string): Promise<string> {
  const isbn = data.isbn ? normalizeIsbn(data.isbn) : null;
  if (isbn) {
    const existing = await findBookIdByIsbn(isbn.isbn13);
    if (existing && existing !== id) throw new DuplicateIsbnError(existing);
  }

  return db.transaction(async (tx) => {
    const publisherName = normalizeOptional(data.publisherName);
    const publisherId = publisherName
      ? await upsertNamed(tx, publishers, publisherName, normalizeOptional(data.publisherNameLatin))
      : null;

    const values = {
      isbn13: isbn?.isbn13 ?? null,
      isbn10: isbn?.isbn10 ?? null,
      title: normalizeText(data.title),
      titleLatin: normalizeOptional(data.titleLatin),
      subtitle: normalizeOptional(data.subtitle),
      publisherId,
      publishedYear: data.publishedYear ?? null,
      edition: normalizeOptional(data.edition),
      pages: data.pages ?? null,
      language: data.language,
      description: data.description?.trim() || null,
      coverUrl: data.coverUrl ?? null,
      formats: data.formats,
      location: normalizeOptional(data.location),
      copies: data.copies ?? 1,
    };

    let bookId: string;
    if (id) {
      await tx.update(books).set(values).where(eq(books.id, id));
      bookId = id;
      await tx.delete(bookAuthors).where(eq(bookAuthors.bookId, id));
      await tx.delete(bookTags).where(eq(bookTags.bookId, id));
    } else {
      const [row] = await tx
        .insert(books)
        .values({ ...values, source: data.source })
        .returning({ id: books.id });
      bookId = row.id;
    }

    const seenAuthors = new Set<string>();
    for (const [position, author] of data.authors.entries()) {
      const authorId = await upsertNamed(
        tx,
        authors,
        normalizeText(author.name),
        normalizeOptional(author.nameLatin),
      );
      if (seenAuthors.has(authorId)) continue;
      seenAuthors.add(authorId);
      await tx.insert(bookAuthors).values({ bookId, authorId, position });
    }

    const tagNames = [...new Set(data.tags.map((t) => normalizeText(t)).filter(Boolean))];
    for (const name of tagNames) {
      await tx.insert(tags).values({ name }).onConflictDoNothing();
      const [tag] = await tx.select({ id: tags.id }).from(tags).where(eq(tags.name, name));
      await tx.insert(bookTags).values({ bookId, tagId: tag.id }).onConflictDoNothing();
    }

    const readingValues = {
      status: data.status,
      startedAt: data.startedAt ?? null,
      finishedAt: data.finishedAt ?? null,
      rating: data.rating ?? null,
      reviewPublic: data.reviewPublic ?? null,
      notesPrivate: data.notesPrivate ?? null,
    };
    await tx
      .insert(reading)
      .values({ bookId, ...readingValues })
      .onConflictDoUpdate({ target: reading.bookId, set: readingValues });

    return bookId;
  });
}

export async function setCoverUrl(id: string, coverUrl: string): Promise<void> {
  await db.update(books).set({ coverUrl }).where(eq(books.id, id));
}

export async function deleteBook(id: string): Promise<void> {
  await db.delete(books).where(eq(books.id, id));
}
