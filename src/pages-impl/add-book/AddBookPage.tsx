"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { BarcodeIcon, CameraIcon, KeyboardIcon, PencilLineIcon } from "lucide-react";
import { CameraBarcodeScanner, PhotoBarcodeReader } from "@/components/BarcodeScanner";
import { BookForm } from "@/components/BookForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { IsbnLookupResponse } from "@/app/api/isbn/[isbn]/route";
import { emptyBookForm, lookupToForm } from "@/lib/book-form";
import type { BookInput } from "@/lib/validation/book";
import { cn } from "@/lib/utils";
import { createBook } from "./actions";

type Method = "isbn" | "camera" | "photo" | "manual";

const METHODS: { id: Method; label: string; icon: typeof KeyboardIcon }[] = [
  { id: "isbn", label: "Type ISBN", icon: KeyboardIcon },
  { id: "camera", label: "Scan barcode", icon: BarcodeIcon },
  { id: "photo", label: "Barcode photo", icon: CameraIcon },
  { id: "manual", label: "Enter manually", icon: PencilLineIcon },
];

type LookupState =
  | { kind: "idle" }
  | { kind: "loading"; isbn: string }
  | { kind: "error"; message: string }
  | { kind: "exists"; bookId: string };

export function AddBookPage() {
  const [method, setMethod] = useState<Method>("isbn");
  const [isbnText, setIsbnText] = useState("");
  const [lookup, setLookup] = useState<LookupState>({ kind: "idle" });
  const [notice, setNotice] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<BookInput | null>(null);
  // Remount the form whenever it gets new defaults
  const [formKey, setFormKey] = useState(0);

  const showForm = (values: BookInput, message: string | null) => {
    setFormValues(values);
    setNotice(message);
    setFormKey((k) => k + 1);
  };

  const runLookup = useCallback(async (isbn: string) => {
    setLookup({ kind: "loading", isbn });
    setFormValues(null);
    try {
      const res = await fetch(`/api/isbn/${encodeURIComponent(isbn)}`);
      if (!res.ok) throw new Error();
      const data = (await res.json()) as IsbnLookupResponse;
      switch (data.status) {
        case "invalid":
          setLookup({ kind: "error", message: "That isn't a valid ISBN — check the digits." });
          break;
        case "exists":
          setLookup({ kind: "exists", bookId: data.bookId });
          break;
        case "found":
          setLookup({ kind: "idle" });
          showForm(
            lookupToForm(data.result),
            `Found on ${data.result.source === "openlibrary" ? "Open Library" : "Google Books"}. Check the details and save.`,
          );
          break;
        case "not_found":
          setLookup({ kind: "idle" });
          showForm(
            emptyBookForm({ isbn: data.isbn13 }),
            "Not found online (common for Bangla books). Fill in the details below — next time it'll come from your own catalogue.",
          );
          break;
      }
    } catch {
      setLookup({ kind: "error", message: "Lookup failed. Check your connection and try again." });
    }
  }, []);

  function choose(m: Method) {
    setMethod(m);
    setLookup({ kind: "idle" });
    if (m === "manual") showForm(emptyBookForm(), null);
    else setFormValues(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Add a book</h1>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {METHODS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => choose(id)}
            aria-pressed={method === id}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-lg border p-3 text-sm transition",
              method === id ? "border-primary bg-primary/5 font-medium" : "hover:bg-muted",
            )}
          >
            <Icon className="size-5" />
            {label}
          </button>
        ))}
      </div>

      {method === "isbn" && (
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (isbnText.trim()) void runLookup(isbnText.trim());
          }}
        >
          <Input
            autoFocus
            inputMode="numeric"
            value={isbnText}
            onChange={(e) => setIsbnText(e.target.value)}
            placeholder="978… or ৯৭৮…"
            aria-label="ISBN"
            className="h-10"
          />
          <Button type="submit" size="lg" className="h-10" disabled={lookup.kind === "loading"}>
            Look up
          </Button>
        </form>
      )}
      {method === "camera" && !formValues && lookup.kind !== "loading" && (
        <CameraBarcodeScanner onDetected={runLookup} />
      )}
      {method === "photo" && !formValues && lookup.kind !== "loading" && (
        <PhotoBarcodeReader onDetected={runLookup} />
      )}

      {lookup.kind === "loading" && (
        <p className="text-sm text-muted-foreground">Looking up {lookup.isbn}…</p>
      )}
      {lookup.kind === "error" && <p className="text-sm text-destructive">{lookup.message}</p>}
      {lookup.kind === "exists" && (
        <p className="rounded-md bg-amber-50 p-3 text-sm">
          This book is already in your catalogue.{" "}
          <Link href={`/books/${lookup.bookId}`} className="underline">
            Open it
          </Link>{" "}
          or{" "}
          <Link href={`/admin/books/${lookup.bookId}/edit`} className="underline">
            edit it
          </Link>
          .
        </p>
      )}

      {formValues && (
        <div className="flex flex-col gap-3">
          {notice && <p className="rounded-md bg-muted p-3 text-sm">{notice}</p>}
          <BookForm key={formKey} defaultValues={formValues} onSave={createBook} submitLabel="Add to catalogue" />
        </div>
      )}
    </div>
  );
}
