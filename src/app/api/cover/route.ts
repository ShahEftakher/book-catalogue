import { type NextRequest } from "next/server";
import { isAllowedCoverUrl } from "@/lib/cover-proxy";

const MAX_BYTES = 2 * 1024 * 1024;
const MAX_REDIRECTS = 3;

const fetchOnce = (url: string) => fetch(url, { redirect: "manual", signal: AbortSignal.timeout(10_000) });

/**
 * GET /api/cover?u=<cover url>: re-serves a book cover from an allow-listed host on our own
 * origin. WebGL textures need CORS, which Google Books images don't send.
 */
export async function GET(req: NextRequest) {
  let url = req.nextUrl.searchParams.get("u") ?? "";
  if (!isAllowedCoverUrl(url)) return new Response("Not allowed", { status: 400 });

  try {
    // Follow redirects by hand so every hop is checked against the allow-list
    let res: Response | null = null;
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      res = await fetchOnce(url).catch(() => fetchOnce(url)); // one retry: archive.org is flaky
      const next = res.headers.get("location");
      if (res.status < 300 || res.status >= 400 || !next) break;
      url = new URL(next, url).toString();
      if (!isAllowedCoverUrl(url)) return new Response("Not allowed", { status: 400 });
    }
    const type = res?.headers.get("content-type") ?? "";
    if (!res?.ok || !type.startsWith("image/")) return new Response("Not found", { status: 404 });
    const body = await res.arrayBuffer();
    if (body.byteLength > MAX_BYTES) return new Response("Too large", { status: 413 });
    return new Response(body, {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Upstream error", { status: 502 });
  }
}
