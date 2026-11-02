"use client";

import { Environment } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, startTransition, useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { NeutralToneMapping, Vector3 } from "three";
import type { BookListItem } from "@/lib/books";
import { BookHelix } from "./BookHelix";
import { setTextureUploader } from "./bookTextures";
import { CameraRig, ZOOM, createRig, zoomBy } from "./CameraRig";
import { DetailsPanel } from "./DetailsPanel";
import { helixPlacement, helixTop, indexAtHeight, storeyCount } from "./helix";
import { Lighting } from "./Lighting";
import { HDRI_URL } from "./materials";
import { PostFx } from "./PostFx";
import { type Quality, Room } from "./Room";
import { PerfProbe } from "./PerfProbe";
import { ZoomControls } from "./ZoomControls";

type Props = {
  books: BookListItem[];
  onReady: () => void;
  onSlow: () => void;
};

function useViewport() {
  const [v, setV] = useState({ portrait: false, mobile: false, coarse: false, reducedMotion: false });
  useEffect(() => {
    const update = () =>
      setV({
        portrait: window.innerWidth / window.innerHeight < 0.8,
        mobile: window.innerWidth < 640,
        coarse: window.matchMedia("(pointer: coarse)").matches,
        reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return v;
}

function Ready({ onReady }: { onReady: () => void }) {
  useEffect(onReady, [onReady]);
  return null;
}

/** The 3D library: a helix of the owner's books inside a stone rotunda lit by the real sky. */
export default function LibraryScene({ books, onReady, onSlow }: Props) {
  const view = useViewport();
  // A desktop that can't hold a smooth frame rate drops to the phone tier before the grid
  const [degraded, setDegraded] = useState(false);
  const quality: Quality = view.mobile || view.coarse || degraded ? "low" : "high";
  const handleSlow = useCallback(
    (fps: number) => {
      if (quality === "high" && fps > 0) setDegraded(true);
      else onSlow();
    },
    [quality, onSlow],
  );
  // One mutable rig object for the lifetime of the scene (input writes it, CameraRig reads it)
  const [rig] = useState(createRig);
  const focusY = useRef(rig.travel);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [center, setCenter] = useState(0);

  const storeys = storeyCount(books.length);
  const maxTravel = helixTop(books.length);
  const span = quality === "high" ? 30 : 15;
  const detail = useMemo(() => ({ from: center - span, to: center + span }), [center, span]);

  // A new search/filter result: back to the start of the helix
  const idsKey = books.map((b) => b.id).join(",");
  const [seenKey, setSeenKey] = useState(idsKey);
  if (seenKey !== idsKey) {
    setSeenKey(idsKey);
    setSelectedId(null);
    setHoveredId(null);
  }
  useEffect(() => {
    rig.travelT = helixPlacement(0).y;
  }, [idsKey, rig]);

  useEffect(() => {
    rig.frozen = !!selectedId;
  }, [selectedId, rig]);

  const onHeight = useCallback(
    (y: number) => {
      focusY.current = y;
      const c = indexAtHeight(y, books.length);
      // Re-centre the detailed zone only every few books, so React work stays rare while scrolling
      // A transition lets React spread the mounting of incoming books over several frames
      startTransition(() => setCenter((prev) => (Math.abs(prev - c) >= 8 ? c : prev)));
    },
    [books.length],
  );

  // ----- Pointer input: drag to spin / climb, pinch to zoom -----
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const drag = useRef({ moved: 0, pinch: 0 });
  const isDrag = useCallback(() => drag.current.moved > 8, []);

  const onPointerDown = (e: PointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) drag.current.moved = 0;
    rig.lastInput = performance.now();
  };
  const onPointerMove = (e: PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const pts = [...pointers.current.values()];
    if (pointers.current.size === 2) {
      const other = pts.find((p) => p !== prev)!;
      const before = Math.hypot(prev.x - other.x, prev.y - other.y);
      const after = Math.hypot(e.clientX - other.x, e.clientY - other.y);
      if (after > 0) zoomBy(rig, before / after);
      drag.current.moved += 20;
    } else if (!rig.frozen) {
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      drag.current.moved += Math.abs(dx) + Math.abs(dy);
      rig.spinTarget = null;
      rig.spinV = rig.spinV * 0.5 + -dx * 0.006 * 60 * 0.5; // rad/s, for inertia on release
      rig.spin += -dx * 0.006;
      rig.travelT += dy * 0.02;
    }
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    rig.lastInput = performance.now();
  };
  const onPointerUp = (e: PointerEvent) => {
    pointers.current.delete(e.pointerId);
  };
  // Scroll climbs; ctrl/⌘ + scroll (and a trackpad pinch, which browsers report the same way)
  // zooms. Native listeners so the page itself doesn't zoom or scroll.
  const stageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (e: globalThis.WheelEvent) => {
      e.preventDefault();
      // Normalise: some mice report lines or pages instead of pixels
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1);
      if (e.ctrlKey || e.metaKey) zoomBy(rig, Math.exp(dy * 0.01));
      else if (!rig.frozen) {
        // One mouse-wheel notch (~100px) climbs about two books
        rig.travelT += Math.max(-120, Math.min(120, dy)) * 0.0075;
        rig.lastInput = performance.now();
      }
    };
    // Safari reports trackpad pinches as gesture events instead
    let lastScale = 1;
    const onGestureStart = (e: Event) => {
      e.preventDefault();
      lastScale = 1;
    };
    const onGestureChange = (e: Event) => {
      e.preventDefault();
      const scale = (e as Event & { scale: number }).scale;
      zoomBy(rig, lastScale / scale);
      lastScale = scale;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("gesturestart", onGestureStart);
    el.addEventListener("gesturechange", onGestureChange);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("gesturestart", onGestureStart);
      el.removeEventListener("gesturechange", onGestureChange);
    };
  }, [rig]);

  // ----- Keyboard: arrows move between books, Enter opens, Esc closes -----
  const focusBook = (i: number) => {
    const idx = Math.min(Math.max(i, 0), books.length - 1);
    const p = helixPlacement(idx);
    rig.travelT = p.y;
    rig.spinTarget = p.angle;
    rig.lastInput = performance.now();
    setHoveredId(books[idx]?.id ?? null);
  };
  const onKeyDown = (e: KeyboardEvent) => {
    if (!books.length) return;
    const current = hoveredId ? books.findIndex((b) => b.id === hoveredId) : indexAtHeight(rig.travel, books.length) - 1;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") focusBook(current + 1);
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") focusBook(current - 1);
    else if (e.key === "Enter" && hoveredId) setSelectedId(hoveredId);
    else if (e.key === "+" || e.key === "=") zoomBy(rig, 1 / ZOOM.step);
    else if (e.key === "-" || e.key === "_") zoomBy(rig, ZOOM.step);
    else if (e.key === "0") rig.zoomT = 1;
    else if (e.key === "Escape") {
      setSelectedId(null);
      setHoveredId(null);
    } else return;
    e.preventDefault();
  };

  const select = useCallback((id: string) => {
    setHoveredId(null);
    setSelectedId(id);
  }, []);

  // Phones: the opened book sits above the bottom sheet; desktop: left of the side card
  const selectedOffset = useMemo(
    // (the cover swings open to the left, so the spread sits right of the book's own centre)
    () => (view.mobile ? new Vector3(0.35, 0.55, -3.6) : new Vector3(-0.15, 0.05, -3.4)),
    [view.mobile],
  );
  const selectedBook = books.find((b) => b.id === selectedId) ?? null;

  return (
    <div
      className="absolute inset-0 touch-none outline-none select-none"
      tabIndex={0}
      role="application"
      ref={stageRef}
      aria-label="3D library. Drag or scroll to browse, Ctrl or Command plus scroll (or pinch) to zoom, arrow keys move between books, Enter opens, Escape closes, plus and minus zoom."
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
      style={{ cursor: hoveredId ? "pointer" : "grab" }}
    >
      <Canvas
        shadows="percentage"
        dpr={[1, quality === "high" ? 2 : 1.5]}
        camera={{ fov: 50, near: 0.1, far: 400, position: [0, 3, 11] }}
        // Kept on even on desktop (where the post pass does its own MSAA): the context can't be
        // recreated, and a desktop that drops to the light tier renders directly again
        gl={{ antialias: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          // Khronos PBR Neutral: keeps the leather and stained-glass colours true instead of washing them out
          gl.toneMapping = NeutralToneMapping;
          setTextureUploader(gl);
        }}
        onPointerMissed={() => {
          if (isDrag()) return;
          setSelectedId(null);
          setHoveredId(null);
        }}
      >
        <Suspense fallback={null}>
          {/* Image-based lighting: reflections for metal, varnish and leather (Lighting sets its strength) */}
          <Environment files={HDRI_URL} />
          <Room storeys={storeys} quality={quality} />
          <BookHelix
            books={books}
            detail={detail}
            hoveredId={hoveredId}
            selectedId={selectedId}
            reducedMotion={view.reducedMotion}
            selectedOffset={selectedOffset}
            isDrag={isDrag}
            onHover={setHoveredId}
            onSelect={select}
          />
          <Ready onReady={onReady} />
          {/* Re-measures after a tier change; the full tier should hold 40 fps, the light one 20 */}
          <PerfProbe key={quality} minFps={quality === "high" ? 40 : 20} onSlow={handleSlow} />
        </Suspense>
        <Lighting focusY={focusY} quality={quality} />
        {quality === "high" && <PostFx />}
        <CameraRig
          rig={rig}
          maxTravel={maxTravel}
          portrait={view.portrait}
          reducedMotion={view.reducedMotion}
          idleAllowed={!hoveredId && !selectedId}
          onHeight={onHeight}
        />
      </Canvas>
      <ZoomControls rig={rig} />
      <DetailsPanel book={selectedBook} mobile={view.mobile} onClose={() => setSelectedId(null)} />
    </div>
  );
}
