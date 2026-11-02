"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { BookCard } from "@/components/BookCard";
import { EmptyState } from "@/components/EmptyState";
import type { BookListItem } from "@/lib/books";
import { cn } from "@/lib/utils";
import { Filters } from "./Filters";
import { forgetFallback, hasWebGL, prefersGrid, rememberFallback } from "./library-scene/fallback";

// three.js only loads in the browser, and only when the 3D view is used
const LibraryScene = dynamic(() => import("./library-scene/LibraryScene"), { ssr: false });

type Props = {
  books: BookListItem[];
  filtered: boolean;
  tags: string[];
  languages: string[];
  isOwner: boolean;
};

type Mode = "checking" | "3d" | "grid";

/** The 3D library by default; a plain grid on devices that can't run it smoothly. */
export function LibraryView({ books, filtered, tags, languages, isOwner }: Props) {
  const [mode, setMode] = useState<Mode>("checking");
  const [ready, setReady] = useState(false);
  const [posterGone, setPosterGone] = useState(false);
  const [notice, setNotice] = useState(false);
  // Dev only: ?view=3d or ?view=grid forces a view (and skips the frame-rate check)
  const [forced, setForced] = useState<Mode | null>(null);

  useEffect(() => {
    const param = process.env.NODE_ENV !== "production" ? new URLSearchParams(location.search).get("view") : null;
    const force = param === "3d" || param === "grid" ? param : null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForced(force);
    setMode(force ?? (prefersGrid() || !hasWebGL() ? "grid" : "3d"));
  }, []);

  const onSlow = useCallback(() => {
    if (forced) return;
    rememberFallback();
    setNotice(true);
    setMode("grid");
  }, [forced]);
  const onReady = useCallback(() => setReady(true), []);

  const count = (
    <p className="text-sm text-muted-foreground">
      {books.length} {books.length === 1 ? "book" : "books"}
      {filtered && " matching"}
    </p>
  );
  const empty =
    books.length === 0 ? (
      filtered ? (
        <EmptyState title="No books match">Try a different search or clear the filters.</EmptyState>
      ) : (
        <EmptyState title="The shelves are empty">
          {isOwner ? (
            <Link href="/admin/books/new" className="underline">
              Add your first book
            </Link>
          ) : (
            "Check back soon."
          )}
        </EmptyState>
      )
    ) : null;

  // Screen readers, keyboard-only and no-JS visitors get a plain list of every book
  const linkList = (
    <ul className="sr-only" aria-label="Books">
      {books.map((b) => (
        <li key={b.id}>
          <Link href={`/books/${b.id}`} lang={b.language}>
            {b.title}
            {b.authors.length > 0 && ` — ${b.authors.map((a) => a.name).join(", ")}`}
          </Link>
        </li>
      ))}
    </ul>
  );

  if (mode === "grid") {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="text-2xl tracking-tight">Library</h1>
          {count}
        </div>
        {notice && (
          <p className="rounded-md bg-muted p-3 text-sm" role="status">
            This device struggled with the 3D library, so you&apos;re seeing the simple view.{" "}
            <button
              type="button"
              className="underline"
              onClick={() => {
                forgetFallback();
                setNotice(false);
                setReady(false);
                setPosterGone(false);
                setMode("3d");
              }}
            >
              Try 3D again
            </button>
          </p>
        )}
        <Suspense>
          <Filters tags={tags} languages={languages} />
        </Suspense>
        {empty ?? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-5 min-[480px]:grid-cols-3 sm:gap-x-4 sm:gap-y-6 md:grid-cols-4 lg:grid-cols-6">
            {books.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <h1 className="sr-only">Library</h1>
      {linkList}
      {/* Full-screen stage below the sticky header */}
      <div className="fixed inset-x-0 bottom-0 top-[calc(3.5rem+env(safe-area-inset-top))] z-0 overflow-hidden bg-background">
        {mode === "3d" && <LibraryScene books={books} onReady={onReady} onSlow={onSlow} />}

        {/* Loading poster until the room's textures are in; fades out, then leaves the page */}
        {!posterGone && (
          <div
            aria-hidden={ready}
            onTransitionEnd={() => ready && setPosterGone(true)}
            className={cn(
              "pointer-events-none absolute inset-0 grid place-items-center bg-background transition-opacity duration-700",
              ready ? "opacity-0" : "opacity-100",
            )}
          >
            <p className="font-heading text-lg text-muted-foreground italic">Opening the library…</p>
          </div>
        )}

        {/* Search and filters float over the scene */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 px-3 pt-3 sm:px-4">
          <div className="pointer-events-auto mx-auto flex max-w-3xl flex-col gap-1 rounded-xl border bg-background/80 p-2 shadow-lg backdrop-blur-md">
            <Suspense>
              <Filters tags={tags} languages={languages} />
            </Suspense>
            <div className="px-1">{count}</div>
          </div>
        </div>

        {empty && (
          <div className="absolute inset-x-4 top-1/2 z-10 mx-auto max-w-md -translate-y-1/2 rounded-xl bg-background/85 backdrop-blur">
            {empty}
          </div>
        )}
      </div>
    </>
  );
}
