"use client";

import { type ThreeEvent, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  BoxGeometry,
  Color,
  DoubleSide,
  type Group,
  type Material,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  Quaternion,
  Vector2,
  Vector3,
} from "three";
import { roundedBox } from "./geometry";
import type { BookListItem } from "@/lib/books";
import { blankTexture, innerPageTexture, pageEdgeTexture, useBookFaces } from "./bookTextures";
import { BOOK, bindingColor, hashUnit, helixPlacement } from "./helix";
import { HoverLabel } from "./HoverLabel";
import type { Pbr } from "./materials";

export type BookMode = "rest" | "hover" | "selected";

type Props = {
  book: BookListItem;
  index: number;
  mode: BookMode;
  /** -1 / +1 for the two books either side of the hovered one (they lean away), else 0 */
  lean: number;
  reducedMotion: boolean;
  /** Where the opened book sits in front of the camera, in camera space */
  selectedOffset: Vector3;
  leather: Pbr;
  onPointerOver: (e: ThreeEvent<PointerEvent>) => void;
  onPointerOut: (e: ThreeEvent<PointerEvent>) => void;
  onClick: (e: ThreeEvent<MouseEvent>) => void;
};

const { width: W, height: H, depth: D, board: T } = BOOK;
const GOLD = new Color("#d9b45a");
const Z_AXIS = new Vector3(0, 0, 1);

// Every book has the same shape, so geometries are created once and shared. Boards and spine
// have softly rounded edges (they keep the box's per-face material groups) so they catch a highlight
const GEO = {
  board: roundedBox(W, H, T, 2, 0.012),
  block: new BoxGeometry(W - 0.05, H - 0.05, D - 2 * T),
  spine: roundedBox(T + 0.012, H, D, 2, 0.014),
  leaf: new PlaneGeometry(W - 0.05, H - 0.05),
};

// Page materials are identical for every book too
let pageMats: { edge: MeshStandardMaterial; inner: MeshStandardMaterial; leaf: MeshStandardMaterial } | null = null;
function sharedPageMaterials() {
  return (pageMats ??= {
    edge: new MeshStandardMaterial({ map: pageEdgeTexture(), roughness: 0.9 }),
    inner: new MeshStandardMaterial({ map: innerPageTexture(), roughness: 0.95 }),
    leaf: new MeshStandardMaterial({ map: innerPageTexture(), roughness: 0.95, side: DoubleSide }),
  });
}

/**
 * One book: back board, page block, spine, a front board on a hinge and a first leaf.
 * Rest → hover (pulled out, tilted, enlarged, name label) → selected (flies to you and opens).
 */
export function Book3D({
  book,
  index,
  mode,
  lean,
  reducedMotion,
  selectedOffset,
  leather,
  onPointerOver,
  onPointerOut,
  onClick,
}: Props) {
  const binding = bindingColor(book.id);
  const faces = useBookFaces(book, binding);
  const group = useRef<Group>(null);
  const hinge = useRef<Group>(null);
  const leaf = useRef<Group>(null);

  const home = useMemo(() => {
    const p = helixPlacement(index);
    const o = new Object3D();
    o.position.set(p.x, p.y, p.z);
    o.rotation.set(0, p.rotY, (hashUnit(book.id, 3) - 0.5) * 0.08); // slight lived-in tilt
    return { pos: o.position.clone(), quat: o.quaternion.clone(), out: new Vector3(Math.cos(p.angle), 0, Math.sin(p.angle)) };
  }, [index, book.id]);

  // Animation state lives in a ref so frames don't re-render React
  const anim = useRef({ scale: 1, scaleV: 0, open: 0, shimmerAt: -10, wasHover: false, init: false });
  const tmp = useMemo(() => ({ pos: new Vector3(), quat: new Quaternion(), face: new Object3D(), lean: new Quaternion() }), []);

  // Three materials per book (leather, cover, spine); box faces reuse them by index
  const mats = useMemo(() => {
    const leatherMat = new MeshStandardMaterial({
      ...leather,
      color: new Color(binding).multiplyScalar(3.6),
      roughness: 1, // the leather's own roughness map drives the sheen
    });
    // Start with a placeholder map so swapping in the real texture needs no shader recompile
    // Covers get the leather's grain and sheen too, so they don't read as flat printed card
    const cover = new MeshStandardMaterial({
      map: blankTexture(),
      normalMap: leather.normalMap,
      normalScale: new Vector2(0.6, 0.6),
      roughnessMap: leather.roughnessMap,
      color: binding,
      emissive: GOLD,
      emissiveIntensity: 0,
      roughness: 0.9,
    });
    const spine = new MeshStandardMaterial({ map: blankTexture(), normalMap: leather.normalMap, roughnessMap: leather.roughnessMap, color: binding, roughness: 0.9 });
    const page = sharedPageMaterials();
    const L = leatherMat;
    return {
      own: [leatherMat, cover, spine],
      cover,
      spine,
      back: L,
      block: [page.edge, page.edge, page.edge, page.edge, page.inner, page.edge] as Material[],
      spineFaces: [L, spine, L, L, L, L] as Material[],
      front: [L, L, L, L, cover, page.inner] as Material[],
      leaf: page.leaf,
    };
  }, [leather, binding]);
  useEffect(() => () => mats.own.forEach((m) => m.dispose()), [mats]);

  useEffect(() => {
    if (!faces) return;
    mats.cover.map = faces.front;
    mats.cover.color.set("#ffffff");
    mats.spine.map = faces.spine;
    mats.spine.color.set("#ffffff");
  }, [faces, mats]);

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const a = anim.current;
    const cam = state.camera;
    const t = state.clock.elapsedTime;

    let targetScale = 1;
    let openTarget = 0;
    const { pos, quat } = tmp;

    if (mode === "selected") {
      // Float in front of the camera, facing it
      pos.copy(selectedOffset).applyQuaternion(cam.quaternion).add(cam.position);
      quat.copy(cam.quaternion);
      targetScale = 1;
      openTarget = g.position.distanceTo(pos) < 0.35 ? 1 : 0;
    } else if (mode === "hover") {
      // Slide out like it's being pulled from a shelf, turn a little towards you, bob gently
      pos.copy(home.pos).addScaledVector(home.out, 0.6);
      if (!reducedMotion) pos.y += Math.sin(t * 2.2) * 0.03;
      tmp.face.position.copy(pos);
      tmp.face.lookAt(cam.position);
      quat.copy(home.quat).slerp(tmp.face.quaternion, 0.35);
      targetScale = 1.35;
    } else {
      pos.copy(home.pos);
      quat.copy(home.quat);
      if (lean) quat.multiply(tmp.lean.setFromAxisAngle(Z_AXIS, lean * 0.12));
    }

    if (mode === "hover" && !a.wasHover) a.shimmerAt = t;
    a.wasHover = mode === "hover";

    if (!a.init || reducedMotion) {
      g.position.copy(pos);
      g.quaternion.copy(quat);
      a.scale = targetScale;
      a.open = openTarget;
      a.init = true;
    } else {
      const k = 1 - Math.exp(-dt * (mode === "selected" ? 5 : 9));
      g.position.lerp(pos, k);
      g.quaternion.slerp(quat, k);
      // Spring for the scale gives a small overshoot when the book settles back
      a.scaleV += (targetScale - a.scale) * 160 * dt;
      a.scaleV *= Math.exp(-dt * 14);
      a.scale += a.scaleV * dt;
      a.open += (openTarget - a.open) * (1 - Math.exp(-dt * 3.5));
    }
    g.scale.setScalar(a.scale);

    // Cover swings open, then the first leaf turns
    if (hinge.current) hinge.current.rotation.y = -a.open * 2.7;
    if (leaf.current) leaf.current.rotation.y = -Math.max(0, (a.open - 0.35) / 0.65) * 2.45;

    // The gilt title shimmers once when the book is first hovered
    const s = (t - a.shimmerAt) / 0.7;
    mats.cover.emissiveIntensity = s >= 0 && s <= 1 ? Math.sin(s * Math.PI) * 0.35 : 0;
  });

  return (
    <group ref={group} onPointerOver={onPointerOver} onPointerOut={onPointerOut} onClick={onClick}>
      {/* Back board */}
      <mesh geometry={GEO.board} material={mats.back} position-z={-D / 2 + T / 2} castShadow receiveShadow />
      {/* Page block (its front face shows the first page under the leaf) */}
      <mesh geometry={GEO.block} material={mats.block} position-x={0.01} castShadow receiveShadow />
      {/* Spine (its -x face carries the gilt title) */}
      <mesh geometry={GEO.spine} material={mats.spineFaces} position-x={-W / 2} castShadow receiveShadow />
      {/* Front board on its hinge */}
      <group ref={hinge} position={[-W / 2, 0, D / 2 - T / 2]}>
        <mesh geometry={GEO.board} material={mats.front} position-x={W / 2} castShadow receiveShadow />
      </group>
      {/* First leaf, turned after the cover opens */}
      <group ref={leaf} position={[-W / 2 + 0.02, 0, D / 2 - T - 0.002]}>
        <mesh geometry={GEO.leaf} material={mats.leaf} position-x={(W - 0.05) / 2} />
      </group>
      {mode === "hover" && <HoverLabel book={book} />}
    </group>
  );
}
