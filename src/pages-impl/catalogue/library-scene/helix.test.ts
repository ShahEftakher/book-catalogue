import { describe, expect, it } from "vitest";
import { HELIX, bindingColor, hashUnit, helixPlacement, helixTop, indexAtHeight, storeyCount } from "./helix";

describe("helix layout", () => {
  it("places books on a circle of the helix radius, climbing steadily", () => {
    for (const i of [0, 1, 7, 40]) {
      const p = helixPlacement(i);
      expect(Math.hypot(p.x, p.z)).toBeCloseTo(HELIX.radius, 5);
      expect(p.y).toBeCloseTo(HELIX.baseY + i * HELIX.yStep, 5);
    }
  });

  it("turns each book's front cover outward", () => {
    const p = helixPlacement(5);
    // +z rotated by rotY must match the outward direction
    expect(Math.sin(p.rotY)).toBeCloseTo(Math.cos(p.angle), 5);
    expect(Math.cos(p.rotY)).toBeCloseTo(Math.sin(p.angle), 5);
  });

  it("maps camera height back to the nearest book", () => {
    expect(indexAtHeight(helixPlacement(12).y, 100)).toBe(12);
    expect(indexAtHeight(-50, 100)).toBe(0);
    expect(indexAtHeight(999, 100)).toBe(99);
    expect(indexAtHeight(5, 0)).toBe(0);
  });

  it("adds storeys as the collection grows", () => {
    expect(storeyCount(5)).toBe(3);
    expect(storeyCount(500)).toBeGreaterThan(storeyCount(100));
    expect(helixTop(1)).toBe(HELIX.baseY);
  });

  it("derives stable per-book variation from the id", () => {
    expect(hashUnit("abc")).toBe(hashUnit("abc"));
    expect(hashUnit("abc")).not.toBe(hashUnit("abd"));
    expect(bindingColor("abc")).toMatch(/^#[0-9a-f]{6}$/);
  });
});
