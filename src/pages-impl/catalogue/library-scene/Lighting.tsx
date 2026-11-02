"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  Color,
  type DirectionalLight,
  FogExp2,
  type HemisphereLight,
  Object3D,
  type PointLight,
  Vector3,
} from "three";
import { useDaylight } from "@/components/DaylightProvider";
import { ROOM } from "./helix";
import { CANDLES, chandeliers, type Quality } from "./Room";
import { flameMaterial, glassMaterial, roseMaterial, skyMaterial } from "./materials";
import { skyState } from "./sky";

/**
 * Sun by day, moon by night, warm light at dawn and dusk, candles after dark. The sky state
 * comes from the real time over Dhaka; colours ease towards it so phase changes feel natural.
 */
export function Lighting({ focusY, quality }: { focusY: { current: number }; quality: Quality }) {
  const daylight = useDaylight();
  const target = useMemo(() => skyState(daylight), [daylight]);
  const scene = useThree((s) => s.scene);

  const sun = useRef<DirectionalLight>(null);
  const hemi = useRef<HemisphereLight>(null);
  const reading = useRef<PointLight>(null);
  const candles = useRef<(PointLight | null)[]>([]);
  const sunTarget = useMemo(() => new Object3D(), []);
  const hanging = useRef<(PointLight | null)[]>([]);
  const glass = useMemo(() => new Color(), []);

  // Current (eased) values
  const cur = useRef({
    sky: target.sky.clone(),
    light: target.light.clone(),
    fog: target.fog.clone(),
    intensity: target.lightIntensity,
    fill: target.fill,
    candles: target.candles,
    dir: target.direction.clone(),
  });

  useEffect(() => {
    scene.fog = new FogExp2(cur.current.fog.getHex(), quality === "high" ? 0.012 : 0.016);
    scene.background = cur.current.fog.clone();
  }, [scene, quality]);

  const tmp = useMemo(() => new Vector3(), []);
  useFrame((state, dt) => {
    const c = cur.current;
    const k = 1 - Math.exp(-dt * 1.5);
    c.sky.lerp(target.sky, k);
    c.light.lerp(target.light, k);
    c.fog.lerp(target.fog, k);
    c.intensity += (target.lightIntensity - c.intensity) * k;
    c.fill += (target.fill - c.fill) * k;
    c.candles += (target.candles - c.candles) * k;
    c.dir.lerp(target.direction, k).normalize();

    skyMaterial.color.copy(c.sky);
    // Stained glass: bright and true by day, a dim blue glow by night
    const lum = c.sky.r * 0.3 + c.sky.g * 0.6 + c.sky.b * 0.1;
    glass.copy(c.sky).lerp(WHITE, 0.55).multiplyScalar(0.3 + lum);
    glassMaterial.color.copy(glass);
    roseMaterial.color.copy(glass);
    if (scene.fog) (scene.fog as FogExp2).color.copy(c.fog);
    if (scene.background) (scene.background as Color).copy(c.fog);

    // The light follows the camera's height so shadows stay crisp where you're looking
    const y = focusY.current;
    sunTarget.position.set(0, y, 0);
    if (sun.current) {
      sun.current.color.copy(c.light);
      sun.current.intensity = c.intensity;
      sun.current.position.copy(tmp.copy(c.dir).multiplyScalar(40)).add(sunTarget.position);
      sun.current.target = sunTarget;
    }
    if (hemi.current) {
      // Sky fill by day; after dark the hundreds of candles give the room a warm glow instead
      hemi.current.color.copy(c.light).lerp(c.sky, 0.5).lerp(CANDLELIGHT, c.candles * 0.7);
      hemi.current.intensity = c.fill * 2.4 + c.candles * 0.55;
    }
    // A soft "reading light" just above the viewer, so covers facing you are always legible.
    // It fades with distance, leaving the far walls to the windows, lanterns and chandeliers
    if (reading.current) {
      reading.current.position.copy(state.camera.position).add(tmp.set(0, 2.5, 0));
      reading.current.color.set("#ffe9c8").lerp(c.light, 0.2);
      reading.current.intensity = 16 + c.candles * 6;
    }

    // Candles flicker. The library keeps a few lit even by day; after dusk they carry the room
    const t = state.clock.elapsedTime;
    const lit = Math.max(c.candles, 0.3);
    const flicker = (i: number) => 1 + Math.sin(t * 9 + i * 3) * 0.08 + Math.sin(t * 23 + i) * 0.05;
    candles.current.forEach((p, i) => {
      if (p) p.intensity = lit * 18 * flicker(i);
    });
    // The two chandeliers on the storey you're looking at light the books around you
    const storey = Math.max(0, Math.floor((y - 2) / ROOM.storeyHeight));
    chandeliers(storey).forEach(([x, cy, z], i) => {
      const p = hanging.current[i];
      if (!p) return;
      p.position.set(x, cy, z);
      p.intensity = lit * 60 * flicker(i + 5);
    });
    flameMaterial.color.setRGB(1, 0.62, 0.28).multiplyScalar(0.6 + c.candles * 0.4);
  });

  const shadowSize = quality === "high" ? 2048 : 1024;
  return (
    <>
      <hemisphereLight ref={hemi} args={["#ffffff", "#2a1a10", 0.4]} />
      <directionalLight
        ref={sun}
        castShadow
        shadow-mapSize={[shadowSize, shadowSize]}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
        shadow-camera-near={1}
        shadow-camera-far={90}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
      <primitive object={sunTarget} />
      <pointLight ref={reading} distance={20} decay={1.2} />
      {CANDLES.map((p, i) => (
        <pointLight
          key={i}
          ref={(el) => {
            candles.current[i] = el;
          }}
          position={[p[0], p[1] + 0.1, p[2]]}
          color="#ffa24a"
          distance={14}
          decay={2}
          intensity={0}
        />
      ))}
      {[0, 1].map((i) => (
        <pointLight
          key={`c${i}`}
          ref={(el) => {
            hanging.current[i] = el;
          }}
          color="#ffb060"
          distance={26}
          decay={1.6}
          intensity={0}
        />
      ))}
    </>
  );
}

const WHITE = new Color("#ffffff");
const CANDLELIGHT = new Color("#ffc58a");
