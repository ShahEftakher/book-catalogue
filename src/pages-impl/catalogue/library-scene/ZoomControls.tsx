"use client";

import { MinusIcon, PlusIcon, ScanIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type Rig, ZOOM, zoomBy } from "./CameraRig";

/** On-screen zoom buttons for the 3D library (mouse users, and phones without pinch habits). */
export function ZoomControls({ rig }: { rig: Rig }) {
  // Keep clicks on the buttons from starting a drag on the stage behind them
  const stop = (e: React.PointerEvent) => e.stopPropagation();
  return (
    <div
      role="group"
      aria-label="Zoom"
      onPointerDown={stop}
      className="absolute right-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-10 flex flex-col overflow-hidden rounded-xl border bg-background/80 shadow-lg backdrop-blur-md"
    >
      <Button variant="ghost" size="icon" aria-label="Zoom in" title="Zoom in (+)" onClick={() => zoomBy(rig, 1 / ZOOM.step)}>
        <PlusIcon />
      </Button>
      <Button variant="ghost" size="icon" aria-label="Zoom out" title="Zoom out (−)" onClick={() => zoomBy(rig, ZOOM.step)}>
        <MinusIcon />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Reset zoom"
        title="Reset zoom (0)"
        onClick={() => {
          rig.zoomT = 1;
          rig.lastInput = performance.now();
        }}
      >
        <ScanIcon />
      </Button>
    </div>
  );
}
