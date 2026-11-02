"use client";

import type { ThreeEvent } from "@react-three/fiber";
import { useLayoutEffect, useRef } from "react";
import { Color, type InstancedMesh, Object3D, Vector3 } from "three";
import type { BookListItem } from "@/lib/books";
import { Book3D } from "./Book3D";
import { BOOK, bindingColor, hashUnit, helixPlacement } from "./helix";
import { useLeatherTextures } from "./materials";

type Props = {
  books: BookListItem[];
  /** Books in [from, to] get the full 3D model; the rest are simple instanced blocks */
  detail: { from: number; to: number };
  hoveredId: string | null;
  selectedId: string | null;
  reducedMotion: boolean;
  selectedOffset: Vector3;
  isDrag: () => boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
};

export function BookHelix({ books, detail, hoveredId, selectedId, reducedMotion, selectedOffset, isDrag, onHover, onSelect }: Props) {
  const leather = useLeatherTextures();
  const hoveredIndex = hoveredId ? books.findIndex((b) => b.id === hoveredId) : -1;

  const near = (i: number, id: string) => (i >= detail.from && i <= detail.to) || id === hoveredId || id === selectedId;

  return (
    <>
      {books.map((book, i) =>
        near(i, book.id) ? (
          <Book3D
            key={book.id}
            book={book}
            index={i}
            mode={book.id === selectedId ? "selected" : book.id === hoveredId ? "hover" : "rest"}
            lean={hoveredIndex >= 0 && Math.abs(i - hoveredIndex) <= 2 && i !== hoveredIndex ? Math.sign(i - hoveredIndex) : 0}
            reducedMotion={reducedMotion}
            selectedOffset={selectedOffset}
            leather={leather}
            onPointerOver={(e: ThreeEvent<PointerEvent>) => {
              e.stopPropagation();
              if (e.pointerType === "mouse" && !selectedId) onHover(book.id);
            }}
            onPointerOut={(e: ThreeEvent<PointerEvent>) => {
              if (e.pointerType === "mouse" && hoveredId === book.id) onHover(null);
            }}
            onClick={(e: ThreeEvent<MouseEvent>) => {
              e.stopPropagation();
              if (isDrag()) return;
              // Touch has no hover: the first tap pulls the book out, the second opens it
              const touch = (e.nativeEvent as PointerEvent).pointerType !== "mouse";
              if (touch && hoveredId !== book.id && selectedId !== book.id) onHover(book.id);
              else onSelect(book.id);
            }}
          />
        ) : null,
      )}
      <FarBooks books={books} detail={detail} hoveredId={hoveredId} selectedId={selectedId} />
    </>
  );
}

/** Books away from the camera: one instanced draw call of leather-coloured blocks. */
function FarBooks({ books, detail, hoveredId, selectedId }: Pick<Props, "books" | "detail" | "hoveredId" | "selectedId">) {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const o = new Object3D();
    const c = new Color();
    books.forEach((b, i) => {
      const p = helixPlacement(i);
      const hidden = (i >= detail.from && i <= detail.to) || b.id === hoveredId || b.id === selectedId;
      o.position.set(p.x, p.y, p.z);
      o.rotation.set(0, p.rotY, (hashUnit(b.id, 3) - 0.5) * 0.08);
      o.scale.setScalar(hidden ? 0 : 1);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
      mesh.setColorAt(i, c.set(bindingColor(b.id)).multiplyScalar(1.4));
    });
    mesh.count = books.length;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [books, detail, hoveredId, selectedId]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, Math.max(1, books.length)]} castShadow receiveShadow frustumCulled={false}>
      <boxGeometry args={[BOOK.width, BOOK.height, BOOK.depth]} />
      <meshStandardMaterial roughness={0.6} />
    </instancedMesh>
  );
}
