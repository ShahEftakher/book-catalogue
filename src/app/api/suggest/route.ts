import { NextResponse, type NextRequest } from "next/server";
import { isOwner } from "@/lib/auth";
import { suggest } from "@/lib/books";

const KINDS = ["author", "publisher", "tag"] as const;

export async function GET(req: NextRequest) {
  if (!(await isOwner())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const kind = req.nextUrl.searchParams.get("kind");
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (!KINDS.includes(kind as (typeof KINDS)[number])) {
    return NextResponse.json({ error: "Bad kind" }, { status: 400 });
  }
  return NextResponse.json(await suggest(kind as (typeof KINDS)[number], q.slice(0, 100)));
}
