import { describe, expect, it } from "vitest";
import { isAllowedCoverUrl, proxiedCoverUrl } from "./cover-proxy";

describe("cover proxy allow-list", () => {
  it("allows known cover hosts", () => {
    expect(isAllowedCoverUrl("https://covers.openlibrary.org/b/isbn/9780141036144-L.jpg")).toBe(true);
    expect(isAllowedCoverUrl("https://ia800100.us.archive.org/view_archive.php?x=1")).toBe(true);
    expect(isAllowedCoverUrl("https://books.google.com/books/content?id=1")).toBe(true);
    expect(isAllowedCoverUrl("https://abc.public.blob.vercel-storage.com/covers/x.jpg")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isAllowedCoverUrl("https://evil.example.com/x.jpg")).toBe(false);
    expect(isAllowedCoverUrl("https://covers.openlibrary.org.evil.com/x.jpg")).toBe(false);
    expect(isAllowedCoverUrl("http://localhost:3000/api/auth/session")).toBe(false);
    expect(isAllowedCoverUrl("file:///etc/passwd")).toBe(false);
    expect(isAllowedCoverUrl("not a url")).toBe(false);
  });

  it("builds a same-origin URL", () => {
    expect(proxiedCoverUrl("https://covers.openlibrary.org/a b.jpg")).toBe(
      "/api/cover?u=https%3A%2F%2Fcovers.openlibrary.org%2Fa%20b.jpg",
    );
  });
});
