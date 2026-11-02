import { CanvasTexture, SRGBColorSpace } from "three";

/** The atlas is a grid of spine designs; each shelf book picks one cell. */
export const ATLAS = { cols: 16, rows: 2 } as const;
export const ATLAS_CELLS = ATLAS.cols * ATLAS.rows;

/** Deterministic pseudo-random numbers so the shelves look the same on every visit. */
function seeded(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
}

/**
 * Procedural spine designs for the thousands of decorative books on the wall shelves, drawn
 * light so each instance's binding colour tints them: raised bands, gilt rules and panels,
 * title labels, worn cloth and vellum, scuffed heads and tails.
 */
export function spineAtlas(width: number): CanvasTexture {
  const c = document.createElement("canvas");
  c.width = width;
  c.height = width / 2;
  const x = c.getContext("2d", { willReadFrequently: true })!;
  const cw = c.width / ATLAS.cols;
  const ch = c.height / ATLAS.rows;
  const rand = seeded(97);
  const gold = (a = 1) => `rgba(255,214,120,${a})`;

  for (let i = 0; i < ATLAS_CELLS; i++) {
    const ox = (i % ATLAS.cols) * cw;
    const oy = Math.floor(i / ATLAS.cols) * ch;
    x.save();
    x.translate(ox, oy);
    x.beginPath();
    x.rect(0, 0, cw, ch);
    x.clip();

    const vellum = rand() < 0.12;
    // Base: near white (tinted per instance), or a pale vellum that stays light
    x.fillStyle = vellum ? "#fff4dc" : "#e6e6e6";
    x.fillRect(0, 0, cw, ch);
    // Rounded spine: darker towards the edges
    const round = x.createLinearGradient(0, 0, cw, 0);
    round.addColorStop(0, "rgba(0,0,0,0.45)");
    round.addColorStop(0.25, "rgba(0,0,0,0.05)");
    round.addColorStop(0.5, "rgba(255,255,255,0.08)");
    round.addColorStop(0.75, "rgba(0,0,0,0.05)");
    round.addColorStop(1, "rgba(0,0,0,0.5)");
    x.fillStyle = round;
    x.fillRect(0, 0, cw, ch);
    // Grain or cloth weave
    for (let k = 0; k < (cw * ch) / 14; k++) {
      x.fillStyle = rand() < 0.5 ? `rgba(0,0,0,${rand() * 0.12})` : `rgba(255,255,255,${rand() * 0.08})`;
      x.fillRect(rand() * cw, rand() * ch, 1 + rand() * 2, 1 + rand() * 2);
    }

    const style = Math.floor(rand() * 4);
    const bands = style === 0 ? 0 : 3 + Math.floor(rand() * 3);
    const top = ch * 0.08;
    const bottom = ch * 0.92;
    // Raised bands with a lit top edge and a shadow below
    for (let b = 0; b < bands; b++) {
      const y = top + ((bottom - top) * (b + 0.5)) / bands + ch * 0.04;
      x.fillStyle = "rgba(0,0,0,0.4)";
      x.fillRect(0, y + 4, cw, 5);
      x.fillStyle = "rgba(255,255,255,0.25)";
      x.fillRect(0, y - 2, cw, 4);
      if (style !== 3) {
        x.fillStyle = gold(0.85);
        x.fillRect(cw * 0.1, y - 7, cw * 0.8, 2);
        x.fillRect(cw * 0.1, y + 11, cw * 0.8, 2);
      }
    }
    // A title label (dark or red leather) or a gilt panel with "lettering"
    if (!vellum && rand() < 0.6) {
      const ly = ch * (0.18 + rand() * 0.06);
      const lh = ch * 0.1;
      x.fillStyle = rand() < 0.5 ? "rgba(40,20,12,0.85)" : "rgba(120,30,24,0.85)";
      x.fillRect(cw * 0.12, ly, cw * 0.76, lh);
      x.strokeStyle = gold(0.9);
      x.lineWidth = 1.5;
      x.strokeRect(cw * 0.15, ly + 3, cw * 0.7, lh - 6);
      x.fillStyle = gold(0.9);
      for (let l = 0; l < 3; l++) x.fillRect(cw * (0.24 + rand() * 0.06), ly + lh * (0.3 + l * 0.18), cw * (0.4 + rand() * 0.15), 2);
    } else if (vellum) {
      x.fillStyle = "rgba(60,40,20,0.7)";
      for (let l = 0; l < 4; l++) x.fillRect(cw * 0.3, ch * (0.2 + l * 0.04), cw * (0.3 + rand() * 0.2), 2);
    }
    // Head and tail: gilt rules, rubbed edges
    x.fillStyle = gold(style === 3 ? 0.4 : 0.8);
    x.fillRect(cw * 0.08, top - 6, cw * 0.84, 2);
    x.fillRect(cw * 0.08, bottom + 4, cw * 0.84, 2);
    for (const [y, h] of [
      [0, ch * 0.04],
      [ch * 0.96, ch * 0.04],
    ]) {
      x.fillStyle = "rgba(255,240,215,0.22)";
      x.fillRect(0, y, cw, h);
    }
    x.restore();
  }

  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
