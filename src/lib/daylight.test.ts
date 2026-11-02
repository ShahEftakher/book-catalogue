import { describe, expect, it } from "vitest";
import { dhakaTime, getDaylight } from "./daylight";

// Dhaka is UTC+6: 12:00 local = 06:00Z
const at = (iso: string) => new Date(iso);

describe("getDaylight (Dhaka)", () => {
  it("winter: night, dawn, day, dusk at the right local times", () => {
    // 21 Dec: civil dawn ~06:13, sunrise ~06:38, sunset ~17:16, civil dusk ~17:41
    expect(getDaylight(at("2026-12-20T21:00:00Z")).phase).toBe("night"); // 03:00
    expect(getDaylight(at("2026-12-21T00:25:00Z")).phase).toBe("dawn"); // 06:25
    expect(getDaylight(at("2026-12-21T06:00:00Z")).phase).toBe("day"); // 12:00
    expect(getDaylight(at("2026-12-21T11:30:00Z")).phase).toBe("dusk"); // 17:30
    expect(getDaylight(at("2026-12-21T12:30:00Z")).phase).toBe("night"); // 18:30
  });

  it("summer: longer days", () => {
    // 21 Jun: civil dawn ~04:48, sunrise ~05:12, sunset ~18:48, civil dusk ~19:13
    expect(getDaylight(at("2026-06-20T23:00:00Z")).phase).toBe("dawn"); // 05:00
    expect(getDaylight(at("2026-06-21T12:00:00Z")).phase).toBe("day"); // 18:00
    expect(getDaylight(at("2026-06-21T13:00:00Z")).phase).toBe("dusk"); // 19:00
    expect(getDaylight(at("2026-06-21T13:30:00Z")).phase).toBe("night"); // 19:30
  });

  it("reports sun above the horizon at noon and below at midnight", () => {
    expect(getDaylight(at("2026-12-21T06:00:00Z")).sunAltitude).toBeGreaterThan(0.5);
    expect(getDaylight(at("2026-12-20T18:00:00Z")).sunAltitude).toBeLessThan(0);
  });

  it("progress stays within 0..1 across a whole day", () => {
    for (let m = 0; m < 24 * 60; m += 7) {
      const d = getDaylight(new Date(Date.UTC(2026, 9, 31, 18, 0) + m * 60_000));
      expect(d.progress).toBeGreaterThanOrEqual(0);
      expect(d.progress).toBeLessThanOrEqual(1);
    }
  });

  it("night progress runs from dusk towards dawn", () => {
    const early = getDaylight(at("2026-12-21T12:30:00Z")).progress; // 18:30
    const late = getDaylight(at("2026-12-21T23:30:00Z")).progress; // 05:30 next day
    expect(early).toBeLessThan(0.2);
    expect(late).toBeGreaterThan(0.8);
  });
});

describe("dhakaTime", () => {
  it("builds a Dhaka wall-clock time on the same Dhaka day", () => {
    expect(dhakaTime("06:10", at("2026-11-01T10:00:00Z"))?.toISOString()).toBe("2026-11-01T00:10:00.000Z");
    // 23:00Z on Oct 31 is already Nov 1 in Dhaka
    expect(dhakaTime("21:00", at("2026-10-31T23:00:00Z"))?.toISOString()).toBe("2026-11-01T15:00:00.000Z");
    expect(dhakaTime("25:00")).toBeNull();
    expect(dhakaTime("noon")).toBeNull();
  });
});
