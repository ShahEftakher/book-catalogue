"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { SearchIcon } from "lucide-react";
import { NativeSelect } from "@/components/NativeSelect";
import { Input } from "@/components/ui/input";
import {
  BOOK_FORMATS,
  FORMAT_LABELS,
  READING_STATUSES,
  STATUS_LABELS,
  languageLabel,
} from "@/lib/constants";

type Props = { tags: string[]; languages: string[] };

const SORTS = [
  ["added", "Recently added"],
  ["title", "Title"],
  ["author", "Author"],
  ["rating", "Rating"],
  ["year", "Year published"],
] as const;

export function Filters({ tags, languages }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");

  function update(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    startTransition(() => router.replace(`${pathname}?${next}`, { scroll: false }));
  }

  // Debounce typing so each keystroke doesn't hit the server
  useEffect(() => {
    if (q === (params.get("q") ?? "")) return;
    const t = setTimeout(() => update("q", q.trim()), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="flex flex-col gap-3" data-pending={pending || undefined}>
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search title, author or ISBN — বাংলা or English"
          className="h-10 pl-8"
          aria-label="Search books"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <NativeSelect
          aria-label="Reading status"
          value={params.get("status") ?? ""}
          onChange={(e) => update("status", e.target.value)}
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
          value={params.get("format") ?? ""}
          onChange={(e) => update("format", e.target.value)}
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
          value={params.get("lang") ?? ""}
          onChange={(e) => update("lang", e.target.value)}
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
            value={params.get("tag") ?? ""}
            onChange={(e) => update("tag", e.target.value)}
          >
            <option value="">Any tag</option>
            {tags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </NativeSelect>
        )}
        <NativeSelect
          aria-label="Sort by"
          className="ml-auto"
          value={params.get("sort") ?? "added"}
          onChange={(e) => update("sort", e.target.value === "added" ? "" : e.target.value)}
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
