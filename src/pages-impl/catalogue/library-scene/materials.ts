import { useTexture } from "@react-three/drei";
import { useMemo } from "react";
import {
  CanvasTexture,
  MeshBasicMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  type Texture,
} from "three";

const PH = "/assets/polyhaven";
export const TEXTURE_URLS = {
  stone: `${PH}/castle_wall_slates/diff.jpg`,
  stoneNormal: `${PH}/castle_wall_slates/nor.jpg`,
  floor: `${PH}/large_grey_tiles/diff.jpg`,
  floorNormal: `${PH}/large_grey_tiles/nor.jpg`,
  wood: `${PH}/worn_planks/diff.jpg`,
  woodNormal: `${PH}/worn_planks/nor.jpg`,
} as const;

const LEATHER = { map: `${PH}/brown_leather/diff.jpg`, normal: `${PH}/brown_leather/nor.jpg` };

/** A repeat-wrapped copy of a texture (copies share the image, so this is cheap). */
export function tiled(tex: Texture, x: number, y: number, color = false): Texture {
  const t = tex.clone();
  t.wrapS = t.wrapT = RepeatWrapping;
  t.repeat.set(x, y);
  if (color) t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

/** Poly Haven photo textures for the room (suspends until loaded). */
export function useRoomTextures() {
  const [stone, stoneNormal, floor, floorNormal, wood, woodNormal] = useTexture([
    TEXTURE_URLS.stone,
    TEXTURE_URLS.stoneNormal,
    TEXTURE_URLS.floor,
    TEXTURE_URLS.floorNormal,
    TEXTURE_URLS.wood,
    TEXTURE_URLS.woodNormal,
  ]);
  // Stable object identity, so materials built from these aren't rebuilt (and re-uploaded) every render
  return useMemo(
    () => ({ stone, stoneNormal, floor, floorNormal, wood, woodNormal }),
    [stone, stoneNormal, floor, floorNormal, wood, woodNormal],
  );
}

export function useLeatherTextures() {
  const [map, normal] = useTexture([LEATHER.map, LEATHER.normal]);
  return useMemo(() => ({ map: tiled(map, 1, 1, true), normal: tiled(normal, 1, 1) }), [map, normal]);
}

// Shared, time-of-day driven materials. Lighting updates their colours every frame.
export const skyMaterial = new MeshBasicMaterial({ color: "#cfe6f7", toneMapped: false, fog: false });
export const flameMaterial = new MeshBasicMaterial({ color: "#ffc070", toneMapped: false });

function canvas(w: number, h: number) {
  const c = typeof document === "undefined" ? null : document.createElement("canvas");
  if (!c) return null;
  c.width = w;
  c.height = h;
  return { c, x: c.getContext("2d")! };
}

function toTexture(c: HTMLCanvasElement, repeat = false) {
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

const GLASS = ["#c8a24a", "#e2c27a", "#b03a2e", "#2c4f9e", "#3f7a4a", "#d8b866", "#7a3d8c", "#efe0b0"];

/** One leaded lancet: pale diamond quarries inside a jewelled border, a figure-like roundel. */
function lancetTexture() {
  const k = canvas(256, 640);
  if (!k) return null;
  const { c, x } = k;
  const rand = seeded(7);
  x.fillStyle = "#1a1410";
  x.fillRect(0, 0, 256, 640);
  // Diamond quarries
  const q = 32;
  for (let row = -1; row < 640 / (q / 2) + 1; row++) {
    for (let col = -1; col < 256 / q + 1; col++) {
      const cx = col * q + (row % 2 ? q / 2 : 0);
      const cy = row * (q / 2);
      x.fillStyle = rand() < 0.12 ? GLASS[Math.floor(rand() * GLASS.length)] : rand() < 0.5 ? "#e8dcb4" : "#d9caa0";
      x.beginPath();
      x.moveTo(cx, cy - q / 2 + 2);
      x.lineTo(cx + q / 2 - 2, cy);
      x.lineTo(cx, cy + q / 2 - 2);
      x.lineTo(cx - q / 2 + 2, cy);
      x.fill();
    }
  }
  // Jewelled border
  for (let y = 0; y < 640; y += 22) {
    for (const bx of [4, 230]) {
      x.fillStyle = GLASS[(y / 22 + bx) % 4 === 0 ? 3 : (y / 22) % 3 === 0 ? 2 : 0];
      x.fillRect(bx, y + 2, 22, 18);
    }
  }
  // Roundels
  for (const cy of [210, 430]) {
    x.fillStyle = "#1a1410";
    x.beginPath();
    x.arc(128, cy, 70, 0, Math.PI * 2);
    x.fill();
    for (let i = 0; i < 8; i++) {
      x.fillStyle = GLASS[(i + cy) % GLASS.length];
      x.beginPath();
      x.moveTo(128, cy);
      x.arc(128, cy, 64, (i / 8) * Math.PI * 2 + 0.04, ((i + 1) / 8) * Math.PI * 2 - 0.04);
      x.fill();
    }
    x.fillStyle = "#e2c27a";
    x.beginPath();
    x.arc(128, cy, 22, 0, Math.PI * 2);
    x.fill();
  }
  grime(x, 256, 640, rand);
  return toTexture(c);
}

/** A rose window: petals of coloured glass radiating from a golden centre. */
function roseTexture() {
  const k = canvas(512, 512);
  if (!k) return null;
  const { c, x } = k;
  const rand = seeded(11);
  x.fillStyle = "#1a1410";
  x.fillRect(0, 0, 512, 512);
  const ring = (r0: number, r1: number, n: number, colours: string[], twist = 0) => {
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2 + twist + 0.03;
      const a1 = ((i + 1) / n) * Math.PI * 2 + twist - 0.03;
      x.fillStyle = colours[i % colours.length];
      x.beginPath();
      x.arc(256, 256, r1, a0, a1);
      x.arc(256, 256, r0, a1, a0, true);
      x.fill();
    }
  };
  ring(196, 250, 24, ["#2c4f9e", "#b03a2e", "#2c4f9e", "#d8b866"]);
  ring(130, 190, 12, ["#e8dcb4", "#c8a24a", "#7a3d8c", "#c8a24a"], 0.13);
  // Petals
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    x.fillStyle = i % 2 ? "#b03a2e" : "#3f7a4a";
    x.beginPath();
    x.ellipse(256 + Math.cos(a) * 90, 256 + Math.sin(a) * 90, 36, 18, a, 0, Math.PI * 2);
    x.fill();
  }
  x.fillStyle = "#1a1410";
  x.beginPath();
  x.arc(256, 256, 52, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = "#efc75e";
  x.beginPath();
  x.arc(256, 256, 46, 0, Math.PI * 2);
  x.fill();
  grime(x, 512, 512, rand);
  return toTexture(c);
}

/** Old glass is uneven: a scatter of darker and lighter flecks. */
function grime(x: CanvasRenderingContext2D, w: number, h: number, rand: () => number) {
  for (let i = 0; i < (w * h) / 60; i++) {
    x.fillStyle = rand() < 0.6 ? "rgba(20,14,8,0.18)" : "rgba(255,245,220,0.12)";
    x.fillRect(rand() * w, rand() * h, 2 + rand() * 3, 2 + rand() * 3);
  }
}

function seeded(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
}

/** Wrought-iron railing panel (transparent between the bars), tiled along the galleries. */
export function ironworkTexture() {
  const k = canvas(256, 128);
  if (!k) return null;
  const { c, x } = k;
  x.clearRect(0, 0, 256, 128);
  x.strokeStyle = x.fillStyle = "#000";
  x.lineCap = "round";
  // Top and bottom rails
  x.fillRect(0, 0, 256, 10);
  x.fillRect(0, 116, 256, 12);
  x.fillRect(0, 96, 256, 4);
  x.lineWidth = 5;
  for (let i = 0; i < 4; i++) {
    const cx = 32 + i * 64;
    // Pointed gothic arch between two bars
    x.beginPath();
    x.moveTo(cx - 28, 96);
    x.lineTo(cx - 28, 50);
    x.quadraticCurveTo(cx - 26, 22, cx, 14);
    x.quadraticCurveTo(cx + 26, 22, cx + 28, 50);
    x.lineTo(cx + 28, 96);
    x.stroke();
    // Trefoil inside the arch
    x.lineWidth = 3;
    for (const [dx, dy] of [
      [0, -10],
      [-9, 5],
      [9, 5],
    ]) {
      x.beginPath();
      x.arc(cx + dx, 46 + dy, 8, 0, Math.PI * 2);
      x.stroke();
    }
    // Scroll feet
    x.beginPath();
    x.arc(cx - 12, 82, 9, Math.PI * 0.2, Math.PI * 1.7);
    x.stroke();
    x.beginPath();
    x.arc(cx + 12, 82, 9, Math.PI * 1.3, Math.PI * 0.8, true);
    x.stroke();
    x.lineWidth = 5;
  }
  // Spear finials on the rail
  for (let i = 0; i <= 4; i++) {
    const cx = i * 64;
    x.beginPath();
    x.moveTo(cx - 5, 10);
    x.lineTo(cx, 0);
    x.lineTo(cx + 5, 10);
    x.fill();
  }
  return toTexture(c, true);
}

/** A worn Persian-style rug: red field, medallion, layered borders. */
export function rugTexture() {
  const k = canvas(384, 576);
  if (!k) return null;
  const { c, x } = k;
  const rand = seeded(23);
  const W = 384;
  const H = 576;
  x.fillStyle = "#5a1d17";
  x.fillRect(0, 0, W, H);
  const band = (inset: number, width: number, colour: string) => {
    x.strokeStyle = colour;
    x.lineWidth = width;
    x.strokeRect(inset + width / 2, inset + width / 2, W - 2 * inset - width, H - 2 * inset - width);
  };
  band(0, 14, "#1f2a44");
  band(14, 6, "#c39a52");
  band(20, 30, "#1f2a44");
  band(50, 5, "#c39a52");
  // Little motifs along the wide border
  x.fillStyle = "#b5432f";
  for (let t = 40; t < W - 30; t += 26) {
    for (const y of [35, H - 35]) {
      x.beginPath();
      x.arc(t, y, 6, 0, Math.PI * 2);
      x.fill();
    }
  }
  for (let t = 40; t < H - 30; t += 26) {
    for (const xx of [35, W - 35]) {
      x.beginPath();
      x.arc(xx, t, 6, 0, Math.PI * 2);
      x.fill();
    }
  }
  // Central medallion
  const med = (rx: number, ry: number, colour: string) => {
    x.fillStyle = colour;
    x.beginPath();
    x.moveTo(W / 2, H / 2 - ry);
    x.lineTo(W / 2 + rx, H / 2);
    x.lineTo(W / 2, H / 2 + ry);
    x.lineTo(W / 2 - rx, H / 2);
    x.fill();
  };
  med(120, 190, "#1f2a44");
  med(100, 165, "#c39a52");
  med(84, 140, "#7a2a1f");
  med(40, 66, "#1f2a44");
  x.fillStyle = "#c39a52";
  x.beginPath();
  x.arc(W / 2, H / 2, 14, 0, Math.PI * 2);
  x.fill();
  // Corner spandrels
  x.fillStyle = "#1f2a44";
  for (const [cx, cy] of [
    [60, 60],
    [W - 60, 60],
    [60, H - 60],
    [W - 60, H - 60],
  ]) {
    x.beginPath();
    x.arc(cx, cy, 46, 0, Math.PI * 2);
    x.fill();
  }
  // Wear: pile flecks
  for (let i = 0; i < 9000; i++) {
    x.fillStyle = rand() < 0.5 ? "rgba(0,0,0,0.12)" : "rgba(255,230,190,0.07)";
    x.fillRect(rand() * W, rand() * H, 1 + rand() * 2, 1 + rand() * 2);
  }
  return toTexture(c);
}

// Stained glass glows with the sky behind it: Lighting tints these by the time of day
export const glassMaterial = new MeshBasicMaterial({ map: lancetTexture(), toneMapped: false, fog: false });
export const roseMaterial = new MeshBasicMaterial({ map: roseTexture(), toneMapped: false, fog: false });
