"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { HalfFloatType, WebGLRenderTarget } from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { GTAOPass } from "three/examples/jsm/postprocessing/GTAOPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";

/**
 * Desktop render pipeline. Not "effects" for their own sake: ambient occlusion darkens the
 * places where things touch (books on shelves, uprights, column bases, under tables), which is
 * what stops surfaces from looking pasted on. The output pass applies the renderer's tone
 * mapping. Phones skip this; the renderer tone-maps directly there.
 *
 * Uses three's own passes (matching the installed three.js) and takes over rendering via a
 * positive useFrame priority.
 */
export function PostFx() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);

  const composer = useMemo(() => {
    // 4× MSAA in the half-float scene buffer replaces the canvas's own anti-aliasing
    const target = new WebGLRenderTarget(1, 1, { type: HalfFloatType, samples: 4 });
    const c = new EffectComposer(gl, target);
    c.addPass(new RenderPass(scene, camera));
    const ao = new GTAOPass(scene, camera, 1, 1);
    ao.updateGtaoMaterial({ radius: 1.2, distanceExponent: 1.5, thickness: 2, distanceFallOff: 1, scale: 1.2, samples: 12 });
    ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 12 });
    ao.blendIntensity = 0.85;
    // AO is soft; working at half resolution halves its cost with no visible loss
    const setSize = ao.setSize.bind(ao);
    ao.setSize = (w: number, h: number) => setSize(Math.ceil(w / 2), Math.ceil(h / 2));
    c.addPass(ao);
    c.addPass(new OutputPass());
    return c;
  }, [gl, scene, camera]);

  useEffect(() => {
    composer.setPixelRatio(dpr);
    composer.setSize(size.width, size.height);
  }, [composer, size, dpr]);
  useEffect(() => () => composer.dispose(), [composer]);

  useFrame((_, dt) => composer.render(dt), 1);
  return null;
}
