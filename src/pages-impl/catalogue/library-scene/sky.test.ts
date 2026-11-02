import { describe, expect, it } from "vitest";
import type { Daylight } from "@/lib/daylight";
import { skyDirection, skyState } from "./sky";

const base: Daylight = {
  phase: "day",
  progress: 0.5,
  sunAltitude: 1,
  sunAzimuth: 0,
  moonAltitude: 0.5,
  moonAzimuth: 1,
  moonIllumination: 1,
};

describe("skyState", () => {
  it("is bright with no candles at midday, dim with candles at night", () => {
    const day = skyState(base);
    const night = skyState({ ...base, phase: "night" });
    expect(day.lightIntensity).toBeGreaterThan(night.lightIntensity);
    expect(day.candles).toBe(0);
    expect(night.candles).toBe(1);
    expect(night.isNight).toBe(true);
  });

  it("blends continuously through dawn into day", () => {
    const start = skyState({ ...base, phase: "dawn", progress: 0 });
    const end = skyState({ ...base, phase: "dawn", progress: 1 });
    const day = skyState(base);
    const night = skyState({ ...base, phase: "night" });
    expect(start.sky.getHexString()).toBe(night.sky.getHexString());
    expect(end.sky.getHexString()).toBe(day.sky.getHexString());
  });

  it("dims moonlight with a thin moon", () => {
    const full = skyState({ ...base, phase: "night", moonIllumination: 1 });
    const fresh = skyState({ ...base, phase: "night", moonIllumination: 0 });
    expect(fresh.lightIntensity).toBeLessThan(full.lightIntensity);
  });
});

describe("skyDirection", () => {
  it("points south (+z) for azimuth 0 and up for altitude 90°", () => {
    const south = skyDirection(0, 0);
    expect(south.z).toBeCloseTo(1);
    expect(skyDirection(Math.PI / 2, 0).y).toBeCloseTo(1);
    // azimuth +90° = west = -x
    expect(skyDirection(0, Math.PI / 2).x).toBeCloseTo(-1);
  });
});
