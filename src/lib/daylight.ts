import * as SunCalc from "suncalc";
import { DHAKA } from "./constants";

export type Phase = "night" | "dawn" | "day" | "dusk";

export type Daylight = {
  phase: Phase;
  /** 0 → 1 through the current phase */
  progress: number;
  /** Radians above the horizon (negative below) */
  sunAltitude: number;
  /** Radians, suncalc convention: 0 = south, positive towards west */
  sunAzimuth: number;
  moonAltitude: number;
  moonAzimuth: number;
  /** 0 (new moon) → 1 (full moon) */
  moonIllumination: number;
};

const MIN = 60_000;
const DAY = 24 * 60 * MIN;
// How long after sunrise "dawn" lasts, and how long before sunset "dusk" starts
const GOLDEN = 30 * MIN;

/** Sun times for the Dhaka calendar day containing `date`. */
function dhakaTimes(date: Date) {
  const local = new Date(date.getTime() + DHAKA.utcOffsetHours * 3_600_000);
  const noonUtc = Date.UTC(
    local.getUTCFullYear(),
    local.getUTCMonth(),
    local.getUTCDate(),
    12 - DHAKA.utcOffsetHours,
  );
  return SunCalc.getTimes(new Date(noonUtc), DHAKA.lat, DHAKA.lng);
}

// suncalc types allow null (polar day/night); Dhaka always has every time
const ms = (d: Date | null) => (d as Date).getTime();

function span(t: number, start: number, end: number) {
  return Math.min(1, Math.max(0, (t - start) / (end - start)));
}

export function getDaylight(date: Date = new Date()): Daylight {
  const t = date.getTime();
  const today = dhakaTimes(date);
  const dawnStart = ms(today.dawn);
  const dawnEnd = ms(today.sunrise) + GOLDEN;
  const duskStart = ms(today.sunset) - GOLDEN;
  const duskEnd = ms(today.dusk);

  let phase: Phase;
  let progress: number;
  if (t >= dawnStart && t < dawnEnd) {
    phase = "dawn";
    progress = span(t, dawnStart, dawnEnd);
  } else if (t >= dawnEnd && t < duskStart) {
    phase = "day";
    progress = span(t, dawnEnd, duskStart);
  } else if (t >= duskStart && t < duskEnd) {
    phase = "dusk";
    progress = span(t, duskStart, duskEnd);
  } else {
    phase = "night";
    // Night runs from yesterday's or today's dusk to today's or tomorrow's dawn
    const [from, to] =
      t < dawnStart
        ? [ms(dhakaTimes(new Date(t - DAY)).dusk), dawnStart]
        : [duskEnd, ms(dhakaTimes(new Date(t + DAY)).dawn)];
    progress = span(t, from, to);
  }

  const sun = SunCalc.getPosition(date, DHAKA.lat, DHAKA.lng);
  const moon = SunCalc.getMoonPosition(date, DHAKA.lat, DHAKA.lng);
  return {
    phase,
    progress,
    sunAltitude: sun.altitude,
    sunAzimuth: sun.azimuth,
    moonAltitude: moon.altitude,
    moonAzimuth: moon.azimuth,
    moonIllumination: SunCalc.getMoonIllumination(date).fraction,
  };
}

/** A Date for HH:MM Dhaka time on the same Dhaka day as `base` (used by the dev ?time= override). */
export function dhakaTime(hhmm: string, base: Date = new Date()): Date | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!m) return null;
  const [h, min] = [Number(m[1]), Number(m[2])];
  if (h > 23 || min > 59) return null;
  const local = new Date(base.getTime() + DHAKA.utcOffsetHours * 3_600_000);
  return new Date(
    Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate(), h - DHAKA.utcOffsetHours, min),
  );
}
