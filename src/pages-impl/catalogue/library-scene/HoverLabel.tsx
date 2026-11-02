"use client";

import { Html } from "@react-three/drei";
import type { BookListItem } from "@/lib/books";
import { STATUS_LABELS } from "@/lib/constants";
import { BOOK } from "./helix";

/** Parchment name tag that rises in beside a hovered book. */
export function HoverLabel({ book }: { book: BookListItem }) {
  const authors = book.authors.map((a) => a.name).join(", ");
  return (
    <Html position={[0, BOOK.height / 2 + 0.12, 0]} center zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
      <div className="animate-in fade-in slide-in-from-bottom-2 w-max max-w-56 rounded-lg border border-border bg-card/95 px-3 py-2 text-center shadow-lg backdrop-blur-sm duration-300">
        <p lang={book.language} className="font-heading text-sm leading-snug font-semibold text-card-foreground">
          {book.title}
        </p>
        {authors && (
          <p lang={book.language} className="truncate text-xs text-muted-foreground">
            {authors}
          </p>
        )}
        {book.status && <p className="mt-0.5 text-[11px] text-primary">{STATUS_LABELS[book.status]}</p>}
      </div>
    </Html>
  );
}
