"use client";

import { useEffect, useId, useState, type ComponentProps } from "react";
import { Input } from "@/components/ui/input";

export type SuggestKind = "author" | "publisher" | "tag";
export type SuggestItem = { name: string; nameLatin: string | null };

type Props = Omit<ComponentProps<typeof Input>, "list" | "onChange" | "value"> & {
  kind: SuggestKind;
  value: string;
  onValueChange: (value: string, match?: SuggestItem) => void;
};

/**
 * Text input with autocomplete from the owner's existing authors/publishers/tags,
 * matching either the original-script or romanized name. Picking a suggestion passes
 * the full match so callers can also fill the romanized name.
 */
export function SuggestInput({ kind, value, onValueChange, ...props }: Props) {
  const listId = useId();
  const [items, setItems] = useState<SuggestItem[]>([]);

  useEffect(() => {
    const q = value.trim();
    if (q.length < 1) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/suggest?kind=${kind}&q=${encodeURIComponent(q)}`, { signal: ctrl.signal })
        .then((r) => (r.ok ? r.json() : []))
        .then(setItems)
        .catch(() => {});
    }, 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [kind, value]);

  return (
    <>
      <Input
        {...props}
        list={listId}
        value={value}
        autoComplete="off"
        onChange={(e) => {
          const v = e.target.value;
          onValueChange(v, items.find((i) => i.name === v));
        }}
      />
      <datalist id={listId}>
        {items.map((i) => (
          <option key={i.name} value={i.name}>
            {i.nameLatin ?? undefined}
          </option>
        ))}
      </datalist>
    </>
  );
}
