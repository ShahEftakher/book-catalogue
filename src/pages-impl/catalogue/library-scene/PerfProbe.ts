"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";

/**
 * Inside the Canvas: measures the frame rate for a few seconds after start-up and reports a
 * device that can't keep up (or loses the WebGL context), so the page can switch to the grid.
 */
export function PerfProbe({ onSlow }: { onSlow: () => void }) {
  const gl = useThree((s) => s.gl);
  const m = useRef({ start: 0, frames: 0, done: false });

  // A background tab throttles frames; that says nothing about the device, so restart the clock
  useEffect(() => {
    const reset = () => {
      if (document.visibilityState !== "visible") m.current.start = 0;
    };
    document.addEventListener("visibilitychange", reset);
    return () => document.removeEventListener("visibilitychange", reset);
  }, []);

  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener("webglcontextlost", onSlow);
    return () => canvas.removeEventListener("webglcontextlost", onSlow);
  }, [gl, onSlow]);

  useFrame(() => {
    const s = m.current;
    if (s.done) return;
    const now = performance.now();
    if (document.visibilityState !== "visible") return;
    if (!s.start) {
      s.start = now + 2500; // let textures upload and shaders compile first
      s.frames = 0;
    }
    if (now < s.start) return;
    s.frames++;
    const elapsed = now - s.start;
    if (elapsed > 4000) {
      s.done = true;
      if ((s.frames / elapsed) * 1000 < 20) onSlow();
    }
  });
  return null;
}
