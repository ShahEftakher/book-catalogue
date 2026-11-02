"use client";

import { memo, useLayoutEffect, useMemo, useRef } from "react";
import {
  BackSide,
  BoxGeometry,
  BufferGeometry,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  InstancedMesh,
  Object3D,
  Path,
  RingGeometry,
  Shape,
  ShapeGeometry,
  SphereGeometry,
  TorusGeometry,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { BINDINGS, ROOM } from "./helix";
import { flameMaterial, glassMaterial, ironworkTexture, roseMaterial, rugTexture, skyMaterial, tiled, useRoomTextures } from "./materials";

export type Quality = "high" | "low";

const TAU = Math.PI * 2;
const BAY = TAU / ROOM.bays;
const SECTIONS = 4; // bookcase sections per bay, split by uprights
const SECTION = BAY / SECTIONS;
const SHELF_R = ROOM.radius - 0.7; // front edge of the wall shelves
const SHELF_ROWS = 6;
const SHELF_GAP = 1.7;
const CASE_TOP = 0.4 + SHELF_ROWS * SHELF_GAP + 0.5;
const OCULUS = 0.13; // angular radius of the opening at the top of the dome

/** Every third bay holds a window instead of shelves. */
export const isWindowBay = (b: number) => b % 3 === 1;

/** Mulberry32: deterministic pseudo-random numbers so the room looks the same every visit. */
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Where the reading-table candles stand (Lighting puts point lights here). */
export const CANDLES: [number, number, number][] = [0, 1, 2].map((k) => {
  const a = (k / 3) * TAU + 0.5;
  return [Math.cos(a) * 9.5, 1.32, Math.sin(a) * 9.5];
});

/** Two candle chandeliers hang on each storey, turned a little further round each time. */
export function chandeliers(storey: number): [number, number, number][] {
  return [0, Math.PI].map((off) => {
    const a = storey * 1.3 + off + 0.9;
    return [Math.cos(a) * 14, storey * ROOM.storeyHeight + 9.5, Math.sin(a) * 14];
  });
}

/** A pointed (gothic) arch, `width` wide and `height` tall, standing on y = 0. */
function lancet(width: number, height: number) {
  const s = new Shape();
  const r = width / 2;
  const spring = height - width * 0.85; // where the arch starts to curve
  s.moveTo(-r, 0);
  s.lineTo(r, 0);
  s.lineTo(r, spring);
  s.quadraticCurveTo(r, height - width * 0.3, 0, height);
  s.quadraticCurveTo(-r, height - width * 0.3, -r, spring);
  s.lineTo(-r, 0);
  return s;
}

/** Stretch a planar geometry's UVs over its bounding box, so a whole texture fits it once. */
function fitUVs(g: BufferGeometry) {
  g.computeBoundingBox();
  const { min, max } = g.boundingBox!;
  const pos = g.attributes.position;
  const uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, (pos.getX(i) - min.x) / (max.x - min.x), (pos.getY(i) - min.y) / (max.y - min.y));
  }
  return g;
}

/** Turn a part built facing +z into the room at wall angle `a`, radius `r` and height `y`. */
function place(g: BufferGeometry, a: number, r: number, y: number) {
  g.rotateY(-a - Math.PI / 2);
  g.translate(Math.cos(a) * r, y, Math.sin(a) * r);
  return g;
}

/** A curved strip of the wall from angle a0 to a1 (same angle convention as `place`). */
function wallStrip(radius: number, a0: number, a1: number, y0: number, y1: number) {
  // CylinderGeometry measures theta from +z towards +x; our angles go from +x towards +z
  const g = new CylinderGeometry(radius, radius, y1 - y0, 8, 1, true, Math.PI / 2 - a1, a1 - a0);
  g.translate(0, (y0 + y1) / 2, 0);
  return g;
}

// Memoised: the room only depends on its size and quality, not on hover/scroll state
export const Room = memo(function Room({ storeys, quality }: { storeys: number; quality: Quality }) {
  const t = useRoomTextures();
  const height = storeys * ROOM.storeyHeight;
  const inner = ROOM.radius - ROOM.galleryDepth;

  const mats = useMemo(() => {
    const circumference = TAU * ROOM.radius;
    const iron = ironworkTexture();
    iron?.repeat.set(Math.round((TAU * inner) / 1.8), 1);
    return {
      wall: { map: tiled(t.stone, circumference / 3.5, height / 3.5, true), normalMap: tiled(t.stoneNormal, circumference / 3.5, height / 3.5) },
      column: { map: tiled(t.stone, 1, ROOM.storeyHeight / 3, true), normalMap: tiled(t.stoneNormal, 1, ROOM.storeyHeight / 3) },
      // Shape geometries use world units as UVs, so a 1/3 repeat means one tile per 3 m
      trim: { map: tiled(t.stone, 1 / 3, 1 / 3, true), normalMap: tiled(t.stoneNormal, 1 / 3, 1 / 3) },
      floor: { map: tiled(t.floor, 12, 12, true), normalMap: tiled(t.floorNormal, 12, 12) },
      wood: { map: tiled(t.wood, 10, 2, true), normalMap: tiled(t.woodNormal, 10, 2) },
      vault: { map: tiled(t.wood, 36, 8, true), normalMap: tiled(t.woodNormal, 36, 8) },
      beam: { map: tiled(t.wood, 1, 12, true), normalMap: tiled(t.woodNormal, 1, 12) },
      iron,
      rug: rugTexture(),
    };
  }, [t, height, inner]);

  // Bookcases: shelf boards, a timber back, uprights between sections and a cornice, merged
  const cases = useMemo(() => {
    const parts: BufferGeometry[] = [];
    for (let s = 0; s < storeys; s++) {
      const base = s * ROOM.storeyHeight;
      for (let b = 0; b < ROOM.bays; b++) {
        if (isWindowBay(b)) continue;
        const a0 = b * BAY;
        for (let r = 0; r <= SHELF_ROWS; r++) {
          const g = new RingGeometry(SHELF_R, ROOM.radius, 12, 1, a0, BAY);
          g.rotateX(Math.PI / 2); // (cos, sin) → (x, z), matching the rest of the room
          g.translate(0, base + 0.4 + r * SHELF_GAP, 0);
          parts.push(g);
        }
        parts.push(wallStrip(ROOM.radius - 0.06, a0, a0 + BAY, base, base + CASE_TOP));
        for (let j = 0; j <= SECTIONS; j++) {
          parts.push(place(new BoxGeometry(0.28, CASE_TOP, 0.9), a0 + j * SECTION, SHELF_R + 0.35, base + CASE_TOP / 2));
        }
        // Cornice and plinth jut out a little further than the shelves
        for (const [y, h] of [
          [base + CASE_TOP - 0.25, 0.5],
          [base + 0.2, 0.4],
        ]) {
          const g = new CylinderGeometry(SHELF_R - 0.15, SHELF_R - 0.15, h, 16, 1, true, Math.PI / 2 - a0 - BAY, BAY);
          g.translate(0, y, 0);
          parts.push(g);
        }
      }
    }
    return mergeGeometries(parts.map((g) => g.toNonIndexed()));
  }, [storeys]);

  const galleries = useMemo(() => {
    const walk: BufferGeometry[] = [];
    const rail: BufferGeometry[] = [];
    for (let s = 1; s < storeys; s++) {
      const y = s * ROOM.storeyHeight;
      const floor = new RingGeometry(inner, ROOM.radius, 96);
      floor.rotateX(-Math.PI / 2);
      floor.translate(0, y, 0);
      walk.push(floor);
      // The walkway's timber edge
      const fascia = new CylinderGeometry(inner, inner, 0.6, 96, 1, true);
      fascia.translate(0, y - 0.3, 0);
      walk.push(fascia);
      // Handrail
      const hand = new TorusGeometry(inner + 0.05, 0.07, 6, 128);
      hand.rotateX(Math.PI / 2);
      hand.translate(0, y + 1.15, 0);
      walk.push(hand);
      const iron = new CylinderGeometry(inner + 0.05, inner + 0.05, 1.1, 128, 1, true);
      iron.translate(0, y + 0.55, 0);
      rail.push(iron);
    }
    if (!walk.length) return null;
    return { walk: mergeGeometries(walk.map((g) => g.toNonIndexed())), rail: mergeGeometries(rail) };
  }, [storeys, inner]);

  // Gothic windows: twin stained-glass lancets under a rose, framed in dressed stone
  const windows = useMemo(() => {
    const glass: BufferGeometry[] = [];
    const roses: BufferGeometry[] = [];
    const trim: BufferGeometry[] = [];
    const W = 2.3;
    const H = 8;
    const ROSE = 1.75;
    for (let s = 0; s < storeys; s++) {
      for (let b = 0; b < ROOM.bays; b++) {
        if (!isWindowBay(b)) continue;
        const a = b * BAY + BAY / 2;
        const y = s * ROOM.storeyHeight + 2.4;
        for (const dx of [-1.45, 1.45]) {
          glass.push(place(fitUVs(new ShapeGeometry(lancet(W, H), 12)).translate(dx, 0, 0), a, ROOM.radius - 0.05, y));
          const frame = lancet(W + 0.7, H + 0.5);
          frame.holes.push(new Path(lancet(W, H).getPoints(12)));
          trim.push(place(new ShapeGeometry(frame, 12).translate(dx, -0.1, 0.06), a, ROOM.radius - 0.05, y));
        }
        roses.push(place(new CircleGeometry(ROSE, 48).translate(0, H + ROSE + 0.5, 0), a, ROOM.radius - 0.05, y));
        trim.push(place(new RingGeometry(ROSE, ROSE + 0.4, 48).translate(0, H + ROSE + 0.5, 0.06), a, ROOM.radius - 0.05, y));
        // Sill
        trim.push(place(new BoxGeometry(6.4, 0.35, 0.7).translate(0, -0.2, 0.2), a, ROOM.radius - 0.05, y));
      }
    }
    return { glass: mergeGeometries(glass), roses: mergeGeometries(roses), trim: mergeGeometries(trim.map((g) => g.toNonIndexed())) };
  }, [storeys]);

  // Timber vault: ribs from every column up to the oculus, tied by ring beams
  const vault = useMemo(() => {
    const parts: BufferGeometry[] = [];
    const R = ROOM.radius - 0.35;
    for (let b = 0; b < ROOM.bays * 2; b++) {
      const rib = new TorusGeometry(R, b % 2 ? 0.22 : 0.38, 4, 24, Math.PI / 2 - OCULUS);
      rib.rotateY(-(b * BAY) / 2);
      rib.translate(0, height, 0);
      parts.push(rib);
    }
    for (const phi of [0, 0.45, 0.9, Math.PI / 2 - OCULUS]) {
      const ring = new TorusGeometry(R * Math.cos(phi), phi === 0 ? 0.6 : 0.3, 4, 96);
      ring.rotateX(Math.PI / 2);
      ring.translate(0, height + R * Math.sin(phi), 0);
      parts.push(ring);
    }
    return mergeGeometries(parts);
  }, [height]);

  const rugs = useMemo(
    () =>
      CANDLES.map(([x, , z]) => {
        const a = Math.atan2(z, x);
        return { x, z, a };
      }),
    [],
  );

  return (
    <group>
      {/* Ground floor flagstones */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[ROOM.radius, 96]} />
        <meshStandardMaterial {...mats.floor} color="#8f8577" roughness={0.9} />
      </mesh>

      {/* Grey castle-stone wall */}
      <mesh position-y={height / 2} receiveShadow>
        <cylinderGeometry args={[ROOM.radius, ROOM.radius, height, 128, 1, true]} />
        <meshStandardMaterial {...mats.wall} color="#cdbca6" side={BackSide} roughness={0.95} />
      </mesh>

      {/* Planked timber vault with an open oculus */}
      <mesh position-y={height} receiveShadow>
        <sphereGeometry args={[ROOM.radius, 96, 32, 0, TAU, OCULUS, Math.PI / 2 - OCULUS]} />
        <meshStandardMaterial {...mats.vault} color="#6e5442" side={BackSide} roughness={0.9} />
      </mesh>
      <mesh geometry={vault} castShadow={quality === "high"}>
        <meshStandardMaterial {...mats.beam} color="#5a4232" roughness={0.85} />
      </mesh>
      <mesh position-y={height + ROOM.radius * Math.cos(OCULUS) - 0.05} rotation-x={Math.PI / 2} material={skyMaterial}>
        <circleGeometry args={[ROOM.radius * Math.sin(OCULUS), 48]} />
      </mesh>

      {/* Dark timber bookcases and their books */}
      <mesh geometry={cases} receiveShadow castShadow={quality === "high"}>
        <meshStandardMaterial {...mats.wood} color="#8a6448" side={DoubleSide} roughness={0.75} />
      </mesh>
      <ShelfSpines storeys={storeys} quality={quality} />

      {/* Upper galleries: timber walkways behind wrought-iron railings */}
      {galleries && (
        <>
          <mesh geometry={galleries.walk} receiveShadow castShadow={quality === "high"}>
            <meshStandardMaterial {...mats.wood} color="#7a5a42" side={DoubleSide} roughness={0.8} />
          </mesh>
          <mesh geometry={galleries.rail}>
            <meshStandardMaterial map={mats.iron} color="#2a2420" metalness={0.6} roughness={0.5} alphaTest={0.5} side={DoubleSide} />
          </mesh>
        </>
      )}

      {/* Stone columns between the bays */}
      {Array.from({ length: ROOM.bays }, (_, b) => {
        const a = b * BAY;
        return (
          <mesh key={b} position={[Math.cos(a) * (inner - 0.6), height / 2, Math.sin(a) * (inner - 0.6)]} castShadow receiveShadow>
            <cylinderGeometry args={[0.6, 0.7, height, 20]} />
            <meshStandardMaterial {...mats.column} color="#cdbca6" roughness={0.95} />
          </mesh>
        );
      })}
      <Lanterns storeys={storeys} radius={inner - 1.35} />

      {/* Stained-glass windows */}
      <mesh geometry={windows.glass} material={glassMaterial} />
      <mesh geometry={windows.roses} material={roseMaterial} />
      <mesh geometry={windows.trim} receiveShadow>
        <meshStandardMaterial {...mats.trim} color="#d6d0c4" roughness={0.9} />
      </mesh>

      <Chandeliers storeys={storeys} />

      {/* Rugs under the reading tables */}
      {rugs.map(({ x, z, a }, i) => (
        <mesh key={i} position={[x, 0.012, z]} rotation={[-Math.PI / 2, 0, -a]} receiveShadow>
          <planeGeometry args={[3.4, 5.1]} />
          <meshStandardMaterial map={mats.rug} roughness={1} />
        </mesh>
      ))}

      <ReadingTables wood={mats.wood} />
      <SpiralStair wood={mats.wood} />
    </group>
  );
});

/** Thousands of decorative leather spines on the wall shelves, in one draw call. */
function ShelfSpines({ storeys, quality }: { storeys: number; quality: Quality }) {
  const ref = useRef<InstancedMesh>(null);
  const { count, matrices, colors } = useMemo(() => {
    const rand = rng(42);
    const o = new Object3D();
    const ms: number[] = [];
    const cs: number[] = [];
    const c = new Color();
    // Phones fill fewer rows (the top rows of each storey stay empty)
    const rows = quality === "high" ? SHELF_ROWS : 4;
    for (let s = 0; s < storeys; s++) {
      for (let b = 0; b < ROOM.bays; b++) {
        if (isWindowBay(b)) continue;
        for (let r = 0; r < rows; r++) {
          for (let j = 0; j < SECTIONS; j++) {
            // Leave room for the uprights between sections
            let a = b * BAY + j * SECTION + 0.009;
            const end = b * BAY + (j + 1) * SECTION - 0.009;
            while (a < end) {
              const thick = 0.16 + rand() * 0.16;
              const h = 0.95 + rand() * 0.55;
              const step = thick / (SHELF_R + 0.3);
              if (a + step > end) break;
              if (rand() < 0.04) {
                a += step * 3; // the odd gap where a book is "out"
                continue;
              }
              const y = s * ROOM.storeyHeight + 0.4 + r * SHELF_GAP + h / 2 + 0.01;
              const rr = SHELF_R + 0.32;
              o.position.set(Math.cos(a + step / 2) * rr, y, Math.sin(a + step / 2) * rr);
              o.rotation.set(0, -a, (rand() - 0.5) * 0.05);
              o.scale.set(0.5, h, thick);
              o.updateMatrix();
              ms.push(...o.matrix.elements);
              // Old bindings: mostly browns and tans, darkened with age
              c.set(BINDINGS[Math.floor(rand() * BINDINGS.length)])
                .lerp(new Color("#5a3a22"), 0.35)
                .multiplyScalar(0.6 + rand() * 0.6);
              cs.push(c.r, c.g, c.b);
              a += step + 0.002;
            }
          }
        }
      }
    }
    return { count: ms.length / 16, matrices: ms, colors: cs };
  }, [storeys, quality]);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const o = new Object3D();
    const c = new Color();
    for (let i = 0; i < count; i++) {
      o.matrix.fromArray(matrices, i * 16);
      mesh.setMatrixAt(i, o.matrix);
      mesh.setColorAt(i, c.setRGB(colors[i * 3], colors[i * 3 + 1], colors[i * 3 + 2]));
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [count, matrices, colors]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} receiveShadow frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial roughness={0.7} />
    </instancedMesh>
  );
}

/** Iron lanterns on the inner face of every column, two per storey. */
function Lanterns({ storeys, radius }: { storeys: number; radius: number }) {
  const cage = useRef<InstancedMesh>(null);
  const flame = useRef<InstancedMesh>(null);
  const spots = useMemo(() => {
    const out: [number, number, number][] = [];
    for (let s = 0; s < storeys; s++) {
      for (let b = 0; b < ROOM.bays; b++) {
        const a = b * BAY;
        for (const y of [4.2, 12.2]) out.push([Math.cos(a) * radius, s * ROOM.storeyHeight + y, Math.sin(a) * radius]);
      }
    }
    return out;
  }, [storeys, radius]);
  useLayoutEffect(() => {
    const o = new Object3D();
    spots.forEach(([x, y, z], i) => {
      o.position.set(x, y, z);
      o.rotation.set(0, Math.atan2(x, z), 0);
      o.updateMatrix();
      cage.current?.setMatrixAt(i, o.matrix);
      o.position.y = y - 0.05;
      o.updateMatrix();
      flame.current?.setMatrixAt(i, o.matrix);
    });
    if (cage.current) cage.current.instanceMatrix.needsUpdate = true;
    if (flame.current) flame.current.instanceMatrix.needsUpdate = true;
  }, [spots]);
  return (
    <>
      <instancedMesh ref={cage} args={[undefined, undefined, spots.length]} frustumCulled={false}>
        <cylinderGeometry args={[0.12, 0.2, 0.18, 6]} />
        <meshStandardMaterial color="#1c1714" metalness={0.6} roughness={0.5} />
      </instancedMesh>
      <instancedMesh ref={flame} args={[undefined, undefined, spots.length]} material={flameMaterial} frustumCulled={false}>
        <sphereGeometry args={[0.13, 8, 6]} />
      </instancedMesh>
    </>
  );
}

/** Brass ring chandeliers with candles, hanging on long chains from the vault. */
function Chandeliers({ storeys }: { storeys: number }) {
  const top = storeys * ROOM.storeyHeight;
  const { metal, candles } = useMemo(() => {
    const parts: BufferGeometry[] = [];
    const cs: [number, number, number][] = [];
    for (let s = 0; s < storeys; s++) {
      for (const [x, y, z] of chandeliers(s)) {
        const add = (g: BufferGeometry) => parts.push(g.translate(x, y, z));
        add(new TorusGeometry(1.5, 0.07, 6, 40).rotateX(Math.PI / 2));
        add(new TorusGeometry(0.8, 0.05, 6, 28).rotateX(Math.PI / 2).translate(0, -0.5, 0));
        add(new CylinderGeometry(0.06, 0.06, 1.6, 6).translate(0, 0.2, 0));
        add(new SphereGeometry(0.16, 10, 8).translate(0, -0.75, 0));
        for (let k = 0; k < 4; k++) {
          // Chains from the ring up to a single hook
          const a = (k / 4) * TAU;
          parts.push(
            new CylinderGeometry(0.025, 0.025, 2.4, 4)
              .rotateX(Math.atan2(1.5, 1.9)) // lean the top inwards…
              .rotateY(-a - Math.PI / 2) // …towards the centre
              .translate(x + Math.cos(a) * 0.75, y + 0.95, z + Math.sin(a) * 0.75),
          );
        }
        // One long chain to the vault
        const len = top - (y + 1.9);
        add(new CylinderGeometry(0.035, 0.035, len, 4).translate(0, 1.9 + len / 2, 0));
        for (let k = 0; k < 10; k++) {
          const a = (k / 10) * TAU;
          cs.push([x + Math.cos(a) * 1.5, y + 0.15, z + Math.sin(a) * 1.5]);
        }
        for (let k = 0; k < 5; k++) {
          const a = (k / 5) * TAU + 0.3;
          cs.push([x + Math.cos(a) * 0.8, y - 0.35, z + Math.sin(a) * 0.8]);
        }
      }
    }
    return { metal: mergeGeometries(parts.map((g) => g.toNonIndexed())), candles: cs };
  }, [storeys, top]);

  const wax = useRef<InstancedMesh>(null);
  const flame = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const o = new Object3D();
    candles.forEach(([x, y, z], i) => {
      o.position.set(x, y, z);
      o.updateMatrix();
      wax.current?.setMatrixAt(i, o.matrix);
      o.position.y = y + 0.2;
      o.updateMatrix();
      flame.current?.setMatrixAt(i, o.matrix);
    });
    if (wax.current) wax.current.instanceMatrix.needsUpdate = true;
    if (flame.current) flame.current.instanceMatrix.needsUpdate = true;
  }, [candles]);

  return (
    <>
      <mesh geometry={metal}>
        <meshStandardMaterial color="#9a7432" metalness={0.8} roughness={0.35} />
      </mesh>
      <instancedMesh ref={wax} args={[undefined, undefined, candles.length]} frustumCulled={false}>
        <cylinderGeometry args={[0.05, 0.05, 0.3, 8]} />
        <meshStandardMaterial color="#efe2c0" />
      </instancedMesh>
      <instancedMesh ref={flame} args={[undefined, undefined, candles.length]} material={flameMaterial} frustumCulled={false}>
        <sphereGeometry args={[0.06, 8, 6]} />
      </instancedMesh>
    </>
  );
}

type WoodMat = { map: import("three").Texture; normalMap: import("three").Texture };

/** Three reading tables around the helix, each with a candle (gives the room its scale). */
function ReadingTables({ wood }: { wood: WoodMat }) {
  return (
    <>
      {CANDLES.map(([x, , z], k) => {
        const a = Math.atan2(z, x);
        return (
          <group key={k} position={[x, 0, z]} rotation-y={-a}>
            <mesh position-y={1.05} castShadow receiveShadow>
              <boxGeometry args={[1.2, 0.08, 2.4]} />
              <meshStandardMaterial {...wood} color="#8a6448" roughness={0.6} />
            </mesh>
            {[
              [-0.5, -1.1],
              [0.5, -1.1],
              [-0.5, 1.1],
              [0.5, 1.1],
            ].map(([lx, lz], i) => (
              <mesh key={i} position={[lx, 0.52, lz]} castShadow>
                <boxGeometry args={[0.08, 1.04, 0.08]} />
                <meshStandardMaterial color="#2b1a10" />
              </mesh>
            ))}
            {/* Candle and flame */}
            <mesh position-y={1.2}>
              <cylinderGeometry args={[0.05, 0.05, 0.22, 10]} />
              <meshStandardMaterial color="#efe2c0" />
            </mesh>
            <mesh position-y={1.34} material={flameMaterial}>
              <sphereGeometry args={[0.035, 8, 8]} />
            </mesh>
            {/* An open book left on the table */}
            <mesh position={[0, 1.1, 0.5]} rotation-y={0.3}>
              <boxGeometry args={[0.7, 0.03, 0.5]} />
              <meshStandardMaterial color="#e9dfc4" />
            </mesh>
          </group>
        );
      })}
    </>
  );
}

const STAIR_CENTRE: [number, number] = [-17, 13];

/** A helical stair up to the first gallery. */
function SpiralStair({ wood }: { wood: WoodMat }) {
  const ref = useRef<InstancedMesh>(null);
  const steps = 44;
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const o = new Object3D();
    for (let i = 0; i < steps; i++) {
      const a = i * 0.36;
      o.position.set(STAIR_CENTRE[0] + Math.cos(a) * 1.3, (i + 1) * (ROOM.storeyHeight / steps), STAIR_CENTRE[1] + Math.sin(a) * 1.3);
      o.rotation.set(0, -a, 0);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <group>
      <instancedMesh ref={ref} args={[undefined, undefined, steps]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.12, 0.7]} />
        <meshStandardMaterial {...wood} color="#8a6448" roughness={0.7} />
      </instancedMesh>
      <mesh position={[STAIR_CENTRE[0], ROOM.storeyHeight / 2, STAIR_CENTRE[1]]} castShadow>
        <cylinderGeometry args={[0.22, 0.22, ROOM.storeyHeight, 12]} />
        <meshStandardMaterial color="#3b2416" />
      </mesh>
    </group>
  );
}
