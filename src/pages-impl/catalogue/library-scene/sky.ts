import { Color, Vector3 } from "three";
import type { Daylight } from "@/lib/daylight";

/** How the library is lit at a moment in time: colours and strengths, blended across phases. */
export type SkyState = {
  sky: Color; // what you see through the windows and oculus
  light: Color; // sun or moon light colour
  lightIntensity: number;
  fill: number; // hemisphere fill strength
  fog: Color;
  candles: number; // 0 = out, 1 = full
  /** Unit vector pointing from the room towards the sun (day) or moon (night) */
  direction: Vector3;
  isNight: boolean;
};

type Key = { sky: string; light: string; lightIntensity: number; fill: number; fog: string; candles: number };

const NIGHT: Key = { sky: "#0b1230", light: "#9fb2ff", lightIntensity: 1.1, fill: 0.16, fog: "#06080f", candles: 1 };
const DAWN: Key = { sky: "#f2a27c", light: "#ffac70", lightIntensity: 2.2, fill: 0.3, fog: "#2b1f19", candles: 0.45 };
const DAY: Key = { sky: "#cfe6f7", light: "#fff2da", lightIntensity: 3.4, fill: 0.55, fog: "#3a3226", candles: 0 };
const DUSK: Key = { sky: "#e47a56", light: "#ff9454", lightIntensity: 2.2, fill: 0.28, fog: "#2b1b14", candles: 0.7 };

function mix(a: Key, b: Key, t: number) {
  const lerp = (x: number, y: number) => x + (y - x) * t;
  return {
    sky: new Color(a.sky).lerp(new Color(b.sky), t),
    light: new Color(a.light).lerp(new Color(b.light), t),
    lightIntensity: lerp(a.lightIntensity, b.lightIntensity),
    fill: lerp(a.fill, b.fill),
    fog: new Color(a.fog).lerp(new Color(b.fog), t),
    candles: lerp(a.candles, b.candles),
  };
}

/** suncalc altitude/azimuth (azimuth 0 = south, + towards west) → world direction (south = +z, east = +x). */
export function skyDirection(altitude: number, azimuth: number): Vector3 {
  const c = Math.cos(altitude);
  return new Vector3(-Math.sin(azimuth) * c, Math.sin(altitude), Math.cos(azimuth) * c).normalize();
}

export function skyState(d: Daylight): SkyState {
  const p = d.progress;
  const base =
    d.phase === "day"
      ? mix(DAY, DAY, 0)
      : d.phase === "night"
        ? mix(NIGHT, NIGHT, 0)
        : d.phase === "dawn"
          ? p < 0.5
            ? mix(NIGHT, DAWN, p * 2)
            : mix(DAWN, DAY, (p - 0.5) * 2)
          : p < 0.5
            ? mix(DAY, DUSK, p * 2)
            : mix(DUSK, NIGHT, (p - 0.5) * 2);

  const isNight = d.phase === "night";
  // Light comes from the sun, or the moon at night. Keep it high enough to reach in through
  // the oculus and windows even when the real body is near the horizon.
  const [alt, az] = isNight ? [d.moonAltitude, d.moonAzimuth] : [d.sunAltitude, d.sunAzimuth];
  const direction = skyDirection(Math.max(alt, 0.35), az);
  const lightIntensity = isNight ? base.lightIntensity * (0.45 + 0.55 * d.moonIllumination) : base.lightIntensity;

  return { ...base, lightIntensity, direction, isNight };
}
