import { NextResponse } from "next/server";
import { isOwner } from "@/lib/auth";
import { lookupIsbn } from "@/lib/book-lookup";
import { findBookIdByIsbn } from "@/lib/books";
import { normalizeIsbn } from "@/lib/isbn";

export type IsbnLookupResponse =
  | { status: "exists"; bookId: string }
  | { status: "found"; result: NonNullable<Awaited<ReturnType<typeof lookupIsbn>>> }
  | { status: "not_found"; isbn13: string }
  | { status: "invalid" };

export async function GET(_req: Request, ctx: RouteContext<"/api/isbn/[isbn]">) {
  if (!(await isOwner())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isbn = normalizeIsbn(decodeURIComponent((await ctx.params).isbn));
  if (!isbn) return NextResponse.json({ status: "invalid" } satisfies IsbnLookupResponse);

  // Our own catalogue comes first — especially useful for Bangla books online sources don't know
  const existing = await findBookIdByIsbn(isbn.isbn13);
  if (existing) return NextResponse.json({ status: "exists", bookId: existing } satisfies IsbnLookupResponse);

  const result = await lookupIsbn(isbn.isbn13);
  return NextResponse.json(
    (result
      ? { status: "found", result }
      : { status: "not_found", isbn13: isbn.isbn13 }) satisfies IsbnLookupResponse,
  );
}
