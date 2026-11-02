"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import type { PerspectiveCamera } from "three";
import { HELIX, ROOM } from "./helix";

/** Mutable camera controls, written by input handlers and read every frame. */
export type Rig = {
  spin: number; // angle around the helix
  spinV: number; // spin velocity (rad/s), for inertia and idle drift
  spinTarget: number | null; // keyboard navigation eases towards a book
  travel: number; // eased height
  travelT: number; // target height
  zoom: number; // eased zoom: 1 = default, < 1 closer, > 1 further out
  zoomT: number; // target zoom (buttons, pinch, ctrl/⌘ + scroll, + and - keys)
  lastInput: number; // ms timestamp, for idle drift
  frozen: boolean; // a book is open
};

export const ZOOM = { min: 0.5, max: 4, step: 1.25 } as const;

/** Multiply the target zoom (e.g. by ZOOM.step to zoom out), clamped to the allowed range. */
export function zoomBy(rig: Rig, factor: number) {
  rig.zoomT = Math.min(ZOOM.max, Math.max(ZOOM.min, rig.zoomT * factor));
  rig.lastInput = performance.now();
}

// The camera stays inside the ring of gallery columns; beyond that, zooming out widens the lens
const MAX_DIST = ROOM.radius - ROOM.galleryDepth - 3;
const MAX_FOV = 88;

export function createRig(): Rig {
  return { spin: Math.PI / 2, spinV: 0, spinTarget: null, travel: HELIX.baseY, travelT: HELIX.baseY, zoom: 1, zoomT: 1, lastInput: 0, frozen: false };
}

type Props = {
  rig: Rig;
  maxTravel: number;
  portrait: boolean;
  reducedMotion: boolean;
  idleAllowed: boolean;
  onHeight: (y: number) => void;
};

/**
 * Orbits the camera around the helix (so the room turns with you) and climbs with it.
 * Portrait phones get a wider lens and a closer camera so a few books fill the width.
 */
export function CameraRig({ rig, maxTravel, portrait, reducedMotion, idleAllowed, onHeight }: Props) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;

  const baseFov = portrait ? 62 : 50;
  useEffect(() => {
    camera.fov = baseFov;
    camera.updateProjectionMatrix();
  }, [camera, baseFov]);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const r = rig;
    const idle = performance.now() - r.lastInput > 4000;

    if (r.spinTarget !== null) {
      const diff = Math.atan2(Math.sin(r.spinTarget - r.spin), Math.cos(r.spinTarget - r.spin));
      r.spin += diff * (1 - Math.exp(-dt * 6));
      if (Math.abs(diff) < 0.002) r.spinTarget = null;
      r.spinV = 0;
    } else if (!r.frozen) {
      // Gentle drift when nobody is touching anything
      const drift = idle && idleAllowed && !reducedMotion ? 0.06 : 0;
      if (idle) r.spinV += (drift - r.spinV) * (1 - Math.exp(-dt * 0.8));
      else r.spinV *= Math.exp(-dt * 3.5); // inertia after a drag
      r.spin += r.spinV * dt;
    }

    r.travelT = Math.min(Math.max(r.travelT, HELIX.baseY), maxTravel);
    // Quick ease: responsive to the wheel, still smooth between notches
    r.travel += (r.travelT - r.travel) * (reducedMotion ? 1 : 1 - Math.exp(-dt * 14));

    r.zoom += (r.zoomT - r.zoom) * (reducedMotion ? 1 : 1 - Math.exp(-dt * 6));
    const wanted = (portrait ? 11 : 8.6) * r.zoom;
    const dist = Math.min(wanted, MAX_DIST);
    const fov = Math.min(MAX_FOV, baseFov * (1 + Math.max(0, wanted / MAX_DIST - 1) * 0.9));
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    // Zoomed out, rise a little and look over the tower; on phones aim higher so the books
    // sit below the floating search bar
    const lift = Math.max(0, r.zoom - 1) * 3;
    camera.position.set(Math.cos(r.spin) * dist, r.travel + (portrait ? 1.4 : 0.9) + lift, Math.sin(r.spin) * dist);
    camera.lookAt(0, r.travel + (portrait ? 0.9 : 0.15) + lift * 0.6, 0);
    onHeight(r.travel);
  });

  return null;
}
