"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";

/**
 * Inside the Canvas: measures the frame rate for a few seconds after start-up and reports a
 * device that can't keep up (below `minFps`, or losing the WebGL context: reported as 0 fps), so
 * the scene can drop to its lighter tier, or the page to the grid.
 */
export function PerfProbe({ minFps, onSlow }: { minFps: number; onSlow: (fps: number) => void }) {
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
    const lost = () => onSlow(0);
    canvas.addEventListener("webglcontextlost", lost);
    return () => canvas.removeEventListener("webglcontextlost", lost);
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
      const fps = (s.frames / elapsed) * 1000;
      if (fps < minFps) onSlow(fps);
    }
  });
  return null;
}
