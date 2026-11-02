"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { dhakaTime, getDaylight, type Daylight } from "@/lib/daylight";

const DaylightContext = createContext<Daylight | null>(null);

// Dev only: ?time=HH:MM previews any Dhaka time of day
function now(): Date {
  if (process.env.NODE_ENV !== "production") {
    const t = new URLSearchParams(window.location.search).get("time");
    const at = t ? dhakaTime(t) : null;
    if (at) return at;
  }
  return new Date();
}

function applyToDocument(d: Daylight) {
  const root = document.documentElement;
  root.dataset.phase = d.phase;
  root.classList.toggle("dark", d.phase === "night");
}

/**
 * Keeps the site's day / dawn / dusk / night theme in step with the real sun over Dhaka.
 * The server renders the first phase (no flash); this refreshes it every minute.
 */
export function DaylightProvider({ initial, children }: { initial: Daylight; children: ReactNode }) {
  const [daylight, setDaylight] = useState(initial);

  useEffect(() => {
    const tick = () => {
      const d = getDaylight(now());
      applyToDocument(d);
      setDaylight(d);
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  return <DaylightContext value={daylight}>{children}</DaylightContext>;
}

export function useDaylight(): Daylight {
  const d = useContext(DaylightContext);
  if (!d) throw new Error("useDaylight must be used inside DaylightProvider");
  return d;
}
