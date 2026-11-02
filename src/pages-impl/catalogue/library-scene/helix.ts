// Geometry shared by the helix of books, the room and the camera rig. Units are metres.

export const BOOK = { width: 0.82, height: 1.2, depth: 0.2, board: 0.03 } as const;

export const HELIX = {
  radius: 4.6,
  angleStep: 0.42, // ≈15 books per turn
  yStep: 0.36,
  baseY: 1.2, // first book sits a little above the floor
} as const;

export const ROOM = {
  radius: 30,
  storeyHeight: 15,
  minStoreys: 3,
  galleryDepth: 4.5, // walkway width on the upper storeys
  bays: 12, // columns split each storey into 12 bays; every third bay has a window
} as const;

export type Placement = { x: number; y: number; z: number; rotY: number; angle: number };

/** Where book `i` stands: on the helix, cover facing outward. */
export function helixPlacement(i: number): Placement {
  const angle = i * HELIX.angleStep;
  const x = Math.cos(angle) * HELIX.radius;
  const z = Math.sin(angle) * HELIX.radius;
  // Object3D's +z (the front cover) should point along the outward direction (cos, sin)
  return { x, y: HELIX.baseY + i * HELIX.yStep, z, rotY: Math.atan2(Math.cos(angle), Math.sin(angle)), angle };
}

export function helixTop(count: number): number {
  return HELIX.baseY + Math.max(0, count - 1) * HELIX.yStep;
}

/** Enough storeys to house the helix with headroom (the room grows with the collection). */
export function storeyCount(count: number): number {
  return Math.max(ROOM.minStoreys, Math.ceil((helixTop(count) + 8) / ROOM.storeyHeight));
}

/** The book index level with a camera at height `y`. */
export function indexAtHeight(y: number, count: number): number {
  return Math.min(Math.max(0, Math.round((y - HELIX.baseY) / HELIX.yStep)), Math.max(0, count - 1));
}

/** Small deterministic per-book variation (tilt, colour) from its id. */
export function hashUnit(id: string, salt = 0): number {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return ((h >>> 0) % 10000) / 10000;
}

// Leather binding colours for books (and decorative shelf spines)
export const BINDINGS = ["#5a1d14", "#1d3a2e", "#2b2a4a", "#5b3a14", "#3a1a2a", "#1e2f3d", "#6b2a1f", "#2f3b1c", "#4a2c17", "#24323a"];

export function bindingColor(id: string): string {
  return BINDINGS[Math.floor(hashUnit(id, 7) * BINDINGS.length)];
}
