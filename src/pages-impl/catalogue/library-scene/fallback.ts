// Plain browser helpers for the grid fallback. Kept free of three.js imports so the page can
// decide between 3D and grid without loading the 3D bundle.

export const VIEW_KEY = "library-view";
// A device that fell back gets another chance after a week (browsers and drivers improve)
const FALLBACK_DAYS = 7;

export function rememberFallback() {
  try {
    localStorage.setItem(VIEW_KEY, JSON.stringify({ view: "grid", until: Date.now() + FALLBACK_DAYS * 86_400_000 }));
  } catch {}
}

export function forgetFallback() {
  try {
    localStorage.removeItem(VIEW_KEY);
  } catch {}
}

/** True if this device recently fell back to the grid (or a test forced it with "grid"). */
export function prefersGrid(): boolean {
  try {
    const raw = localStorage.getItem(VIEW_KEY);
    if (!raw) return false;
    if (raw === "grid") return true;
    const v = JSON.parse(raw) as { view?: string; until?: number };
    return v.view === "grid" && (v.until ?? 0) > Date.now();
  } catch {
    return false;
  }
}

/** True if this browser can create a WebGL context at all. */
export function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}
