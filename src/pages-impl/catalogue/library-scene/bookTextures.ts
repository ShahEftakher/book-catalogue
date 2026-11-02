"use client";

import { useEffect, useState } from "react";
import { CanvasTexture, SRGBColorSpace, type Texture, TextureLoader, type WebGLRenderer } from "three";
import { proxiedCoverUrl } from "@/lib/cover-proxy";

/**
 * What goes on each face of a 3D book. Today the front is the cover photo (or a generated gilt
 * cover) and the spine is generated. A later "full jacket scan" feature can supply all three
 * faces from one image without changing Book3D.
 */
export type BookFaces = { front: Texture; spine: Texture; back?: Texture };

export type TextureBook = {
  id: string;
  title: string;
  language: string;
  coverUrl: string | null;
  authors: { name: string }[];
};

// next/font gives the families hashed names; read them from the CSS variables set on <html>
function fontFamily(): string {
  const css = getComputedStyle(document.documentElement);
  const latin = css.getPropertyValue("--font-serif-latin").trim();
  const bengali = css.getPropertyValue("--font-serif-bengali").trim();
  return [latin, bengali, "Georgia", "serif"].filter(Boolean).join(", ");
}

function canvasTexture(w: number, h: number, draw: (x: CanvasRenderingContext2D) => void): CanvasTexture {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  // CPU-backed canvas: uploading it to WebGL is then a plain copy, not a slow GPU read-back
  draw(c.getContext("2d", { willReadFrequently: true })!);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function grain(x: CanvasRenderingContext2D, w: number, h: number, n: number, alpha: number) {
  for (let i = 0; i < n; i++) {
    x.fillStyle = Math.random() < 0.5 ? `rgba(0,0,0,${alpha * Math.random()})` : `rgba(255,240,210,${alpha * Math.random()})`;
    x.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
}

// Leather grain and vignette are the same for every cover: draw them once, then stamp them on
let overlay: HTMLCanvasElement | null = null;
function leatherOverlay(): HTMLCanvasElement {
  if (overlay) return overlay;
  overlay = document.createElement("canvas");
  overlay.width = CW;
  overlay.height = CH;
  const x = overlay.getContext("2d", { willReadFrequently: true })!;
  grain(x, CW, CH, 9000, 0.1);
  const v = x.createRadialGradient(CW / 2, CH / 2, CW * 0.16, CW / 2, CH / 2, CW * 1.02);
  v.addColorStop(0, "rgba(255,255,255,0.05)");
  v.addColorStop(1, "rgba(0,0,0,0.5)");
  x.fillStyle = v;
  x.fillRect(0, 0, CW, CH);
  // Wear: edges and corners rubbed lighter by years of hands, a few creases and scuffs
  for (let i = 0; i < 4; i++) {
    x.strokeStyle = `rgba(235,215,180,${0.07 - i * 0.015})`;
    x.lineWidth = 3 + i * 3;
    x.strokeRect(i * 2, i * 2, CW - i * 4, CH - i * 4);
  }
  for (const [cx, cy] of [
    [0, 0],
    [CW, 0],
    [0, CH],
    [CW, CH],
  ]) {
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, 46);
    g.addColorStop(0, "rgba(240,220,185,0.22)");
    g.addColorStop(1, "rgba(240,220,185,0)");
    x.fillStyle = g;
    x.fillRect(cx - 46, cy - 46, 92, 92);
  }
  for (let i = 0; i < 26; i++) {
    x.strokeStyle = `rgba(${Math.random() < 0.5 ? "0,0,0" : "245,225,190"},${0.04 + Math.random() * 0.06})`;
    x.lineWidth = 0.6 + Math.random();
    x.beginPath();
    const sx = Math.random() * CW;
    const sy = Math.random() * CH;
    x.moveTo(sx, sy);
    x.quadraticCurveTo(sx + (Math.random() - 0.5) * 60, sy + (Math.random() - 0.5) * 60, sx + (Math.random() - 0.5) * 120, sy + (Math.random() - 0.5) * 120);
    x.stroke();
  }
  return overlay;
}

function wrapLines(x: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (x.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  lines.push(line);
  return lines.slice(0, 5);
}

/** Gold leaf catches the light unevenly: a diagonal sheen instead of one flat yellow. */
function foil(x: CanvasRenderingContext2D, w: number, h: number) {
  const g = x.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#a8803a");
  g.addColorStop(0.3, "#f0d68a");
  g.addColorStop(0.5, "#c69a48");
  g.addColorStop(0.72, "#f5e0a0");
  g.addColorStop(1, "#9c7432");
  return g;
}
// Cover texture size: sharp enough up close, small enough to keep many books in GPU memory
const CW = 384;
const CH = 576;

/** A leather cover with a gilt frame, title and author, for books without a cover photo. */
function giltCover(book: TextureBook, binding: string): CanvasTexture {
  const family = fontFamily();
  return canvasTexture(CW, CH, (x) => {
    x.fillStyle = binding;
    x.fillRect(0, 0, CW, CH);
    x.drawImage(leatherOverlay(), 0, 0);
    const gold = foil(x, CW, CH);
    x.strokeStyle = gold;
    x.lineWidth = 4;
    x.strokeRect(22, 22, CW - 44, CH - 44);
    x.lineWidth = 1.5;
    x.strokeRect(34, 34, CW - 68, CH - 68);
    // Corner flourishes
    x.fillStyle = gold;
    for (const [cx, cy] of [
      [34, 34],
      [CW - 34, 34],
      [34, CH - 34],
      [CW - 34, CH - 34],
    ]) {
      x.beginPath();
      x.arc(cx, cy, 6, 0, Math.PI * 2);
      x.fill();
    }
    x.textAlign = "center";
    x.font = `600 42px ${family}`;
    const lines = wrapLines(x, book.title, 285);
    const top = 248 - (lines.length - 1) * 25;
    lines.forEach((l, i) => x.fillText(l, CW / 2, top + i * 51));
    x.fillRect(CW / 2 - 45, top + lines.length * 51 - 15, 90, 2);
    x.font = `italic 23px ${family}`;
    x.fillStyle = "rgba(217,180,90,0.9)";
    x.fillText(book.authors[0]?.name ?? "", CW / 2, CH - 64);
  });
}

function spine(book: TextureBook, binding: string): CanvasTexture {
  const family = fontFamily();
  return canvasTexture(64, CH, (x) => {
    x.fillStyle = binding;
    x.fillRect(0, 0, 64, CH);
    x.drawImage(leatherOverlay(), 0, 0, 64, CH, 0, 0, 64, CH);
    // Raised bands across the spine, with a highlight on top and a shadow below
    for (const y of [92, CH - 92]) {
      x.fillStyle = "rgba(0,0,0,0.35)";
      x.fillRect(0, y + 5, 64, 4);
      x.fillStyle = "rgba(255,235,200,0.18)";
      x.fillRect(0, y - 3, 64, 4);
    }
    x.fillStyle = foil(x, 64, CH);
    for (const y of [45, 54, CH - 54, CH - 45]) x.fillRect(7, y, 50, 2);
    x.save();
    x.translate(32, CH / 2);
    x.rotate(Math.PI / 2);
    x.textAlign = "center";
    x.font = `600 25px ${family}`;
    const title = book.title.length > 26 ? `${book.title.slice(0, 25)}…` : book.title;
    x.fillText(title, 0, 9);
    x.restore();
  });
}

// A 1×1 white texture: materials start with it so swapping in the real cover later is a plain
// texture change (adding a map to a material that was compiled without one wouldn't show up)
let blank: CanvasTexture | null = null;
export function blankTexture(): CanvasTexture {
  return (blank ??= canvasTexture(1, 1, (x) => {
    x.fillStyle = "#ffffff";
    x.fillRect(0, 0, 1, 1);
  }));
}

// Page textures are the same for every book
let edge: CanvasTexture | null = null;
let page: CanvasTexture | null = null;
export function pageEdgeTexture(): CanvasTexture {
  return (edge ??= canvasTexture(64, 256, (x) => {
    // Old paper: cream, not white, with fine page lines and darker, dustier ends
    x.fillStyle = "#ddcfae";
    x.fillRect(0, 0, 64, 256);
    for (let i = 0; i < 64; i++) {
      x.fillStyle = `rgba(110,88,52,${0.06 + Math.random() * 0.2})`;
      x.fillRect(i, 0, 0.6, 256);
    }
    const dust = x.createLinearGradient(0, 0, 0, 256);
    dust.addColorStop(0, "rgba(90,70,40,0.35)");
    dust.addColorStop(0.12, "rgba(90,70,40,0)");
    dust.addColorStop(0.88, "rgba(90,70,40,0)");
    dust.addColorStop(1, "rgba(90,70,40,0.35)");
    x.fillStyle = dust;
    x.fillRect(0, 0, 64, 256);
  }));
}
export function innerPageTexture(): CanvasTexture {
  return (page ??= canvasTexture(512, 768, (x) => {
    x.fillStyle = "#efe6cc";
    x.fillRect(0, 0, 512, 768);
    grain(x, 512, 768, 6000, 0.05);
    x.fillStyle = "rgba(60,45,25,0.5)";
    for (let y = 120; y < 700; y += 30) x.fillRect(60, y, 392 - Math.random() * 80, 5);
    x.strokeStyle = "rgba(140,100,40,0.55)";
    x.lineWidth = 2;
    x.strokeRect(32, 32, 448, 704);
  }));
}

// Least-recently-used cache of cover photos (GPU memory is precious on phones)
const MAX_COVERS = 80;
const covers = new Map<string, Promise<Texture>>();
const loader = new TextureLoader();

function coverPhoto(url: string): Promise<Texture> {
  const hit = covers.get(url);
  if (hit) {
    covers.delete(url);
    covers.set(url, hit);
    return hit;
  }
  const p = loader.loadAsync(proxiedCoverUrl(url)).then((t) => {
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  });
  covers.set(url, p);
  if (covers.size > MAX_COVERS) {
    const [oldest, old] = covers.entries().next().value!;
    covers.delete(oldest);
    void old.then((t) => t.dispose()).catch(() => {});
  }
  return p;
}

// Generated faces, least-recently-used first; evicted ones free their GPU memory
const MAX_GENERATED = 90;
const generated = new Map<string, BookFaces>();
function rememberGenerated(id: string, faces: BookFaces) {
  generated.delete(id);
  generated.set(id, faces);
  if (generated.size > MAX_GENERATED) {
    const [oldest, old] = generated.entries().next().value!;
    generated.delete(oldest);
    old.front.dispose();
    old.spine.dispose();
  }
}

// Uploading a texture to the GPU on first draw can take several ms. With the renderer known,
// uploads happen inside the budgeted queue below instead of all at once in one frame.
let renderer: WebGLRenderer | null = null;
export function setTextureUploader(gl: WebGLRenderer | null) {
  renderer = gl;
}
function upload(t: Texture) {
  renderer?.initTexture(t);
}

// Drawing a cover takes a few milliseconds. Do it a few per frame, within a small time
// budget, so scrolling through the helix never stalls on a burst of new books.
const jobs: (() => void)[] = [];
let pumping = false;
function schedule(job: () => void) {
  jobs.push(job);
  if (pumping) return;
  pumping = true;
  const pump = () => {
    const start = performance.now();
    while (jobs.length && performance.now() - start < 4) jobs.shift()!();
    if (jobs.length) requestAnimationFrame(pump);
    else pumping = false;
  };
  requestAnimationFrame(pump);
}

/** Upload a texture to the GPU inside the budgeted queue (one big texture per frame at most). */
export function uploadLater(t: Texture): Promise<void> {
  return new Promise((resolve) =>
    schedule(() => {
      upload(t);
      resolve();
    }),
  );
}

let fontsReady: Promise<unknown> | null = null;

/** Faces for a book: generated gilt textures at once, upgraded to the cover photo when it loads. */
export function useBookFaces(book: TextureBook, binding: string): BookFaces | null {
  const [faces, setFaces] = useState<BookFaces | null>(() => generated.get(book.id) ?? null);

  useEffect(() => {
    let cancelled = false;
    // Wait for the serif fonts (incl. Bangla) so titles don't render in a fallback font
    fontsReady ??= document.fonts.ready.then(() =>
      Promise.all([document.fonts.load(`600 56px ${fontFamily()}`, "অআ Aa")]).catch(() => {}),
    );
    void fontsReady.then(() =>
      schedule(() => {
        if (cancelled) return;
        let base = generated.get(book.id);
        if (!base) {
          base = { front: giltCover(book, binding), spine: spine(book, binding) };
          upload(base.front);
          upload(base.spine);
        }
        rememberGenerated(book.id, base);
        const faces = base;
        setFaces(faces);
        if (book.coverUrl) {
          coverPhoto(book.coverUrl)
            .then((front) =>
              schedule(() => {
                if (cancelled) return;
                upload(front);
                setFaces({ ...faces, front });
              }),
            )
            .catch(() => {});
        }
      }),
    );
    return () => {
      cancelled = true;
    };
  }, [book, binding]);

  return faces;
}
