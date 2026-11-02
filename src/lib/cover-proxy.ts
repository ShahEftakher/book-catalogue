// Which image hosts the cover proxy may fetch from (and follow redirects to).
const ALLOWED = [
  /^covers\.openlibrary\.org$/,
  /(^|\.)archive\.org$/, // Open Library cover redirects land here
  /^books\.google\.com$/,
  /^books\.googleusercontent\.com$/,
  /\.googleusercontent\.com$/,
  /\.public\.blob\.vercel-storage\.com$/,
];

export function isAllowedCoverUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    return (url.protocol === "https:" || url.protocol === "http:") && ALLOWED.some((re) => re.test(url.hostname));
  } catch {
    return false;
  }
}

/** Same-origin URL for a cover, so WebGL can use it as a texture without CORS headers. */
export function proxiedCoverUrl(coverUrl: string): string {
  return `/api/cover?u=${encodeURIComponent(coverUrl)}`;
}
