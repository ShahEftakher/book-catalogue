import "server-only";
import { put } from "@vercel/blob";

const MAX_BYTES = 5 * 1024 * 1024;

export const blobEnabled = !!process.env.BLOB_READ_WRITE_TOKEN;

/**
 * Copies an external cover image into Vercel Blob so it survives the source going away.
 * Returns the original URL unchanged when Blob isn't configured or the copy fails.
 */
export async function persistCover(url: string, bookId: string): Promise<string> {
  if (!blobEnabled || url.includes(".blob.vercel-storage.com")) return url;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !type.startsWith("image/")) return url;
    const body = await res.arrayBuffer();
    if (body.byteLength > MAX_BYTES || body.byteLength < 1000) return url;
    const ext = type.split("/")[1]?.split(";")[0] ?? "jpg";
    const blob = await put(`covers/${bookId}.${ext}`, body, {
      access: "public",
      contentType: type,
      addRandomSuffix: true,
    });
    return blob.url;
  } catch {
    return url;
  }
}
