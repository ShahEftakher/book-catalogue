"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { SearchIcon, SlidersHorizontalIcon } from "lucide-react";
import { NativeSelect } from "@/components/NativeSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  BOOK_FORMATS,
  FORMAT_LABELS,
  READING_STATUSES,
  STATUS_LABELS,
  languageLabel,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

type Props = { tags: string[]; languages: string[] };

const SORTS = [
  ["added", "Recently added"],
  ["title", "Title"],
  ["author", "Author"],
  ["rating", "Rating"],
  ["year", "Year published"],
] as const;

const FILTER_KEYS = ["status", "format", "lang", "tag"] as const;

export function Filters({ tags, languages }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");
  const activeCount = FILTER_KEYS.filter((k) => params.get(k)).length;

  function update(changes: Record<string, string>) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    startTransition(() => router.replace(`${pathname}?${next}`, { scroll: false }));
  }

  // Debounce typing so each keystroke doesn't hit the server
  useEffect(() => {
    if (q === (params.get("q") ?? "")) return;
    const t = setTimeout(() => update({ q: q.trim() }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // Shared by the inline row (tablet/desktop) and the bottom sheet (phones)
  const filterFields = (stacked: boolean) => {
    const selectClass = cn(stacked && "w-full");
    return (
      <>
        <NativeSelect
          aria-label="Reading status"
          className={selectClass}
          value={params.get("status") ?? ""}
          onChange={(e) => update({ status: e.target.value })}
        >
          <option value="">Any status</option>
          {READING_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          aria-label="Format"
          className={selectClass}
          value={params.get("format") ?? ""}
          onChange={(e) => update({ format: e.target.value })}
        >
          <option value="">Any format</option>
          {BOOK_FORMATS.map((f) => (
            <option key={f} value={f}>
              {FORMAT_LABELS[f]}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          aria-label="Language"
          className={selectClass}
          value={params.get("lang") ?? ""}
          onChange={(e) => update({ lang: e.target.value })}
        >
          <option value="">Any language</option>
          {languages.map((l) => (
            <option key={l} value={l}>
              {languageLabel(l)}
            </option>
          ))}
        </NativeSelect>
        {tags.length > 0 && (
          <NativeSelect
            aria-label="Tag"
            className={selectClass}
            value={params.get("tag") ?? ""}
            onChange={(e) => update({ tag: e.target.value })}
          >
            <option value="">Any tag</option>
            {tags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </NativeSelect>
        )}
      </>
    );
  };

  return (
    <div className="flex flex-col gap-3" data-pending={pending || undefined}>
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          enterKeyHint="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search title, author, ISBN — বাংলা or English"
          className="h-11 pl-9 sm:h-10"
          aria-label="Search books"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Sheet>
          <SheetTrigger
            render={<Button variant="outline" className="sm:hidden" />}
            aria-label={activeCount ? `Filters, ${activeCount} active` : "Filters"}
          >
            <SlidersHorizontalIcon />
            Filters
            {activeCount > 0 && (
              <span className="grid size-5 place-items-center rounded-full bg-primary text-xs text-primary-foreground">
                {activeCount}
              </span>
            )}
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl pb-[env(safe-area-inset-bottom)]">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
              <SheetDescription>Results update as you choose.</SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-3 px-4">{filterFields(true)}</div>
            <SheetFooter className="flex-row gap-2">
              <Button
                variant="outline"
                className="flex-1"
                disabled={activeCount === 0}
                onClick={() => update({ status: "", format: "", lang: "", tag: "" })}
              >
                Clear all
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
        <div className="hidden flex-wrap gap-2 sm:flex">{filterFields(false)}</div>
        <NativeSelect
          aria-label="Sort by"
          className="ml-auto"
          value={params.get("sort") ?? "added"}
          onChange={(e) => update({ sort: e.target.value === "added" ? "" : e.target.value })}
        >
          {SORTS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </NativeSelect>
      </div>
    </div>
  );
}
