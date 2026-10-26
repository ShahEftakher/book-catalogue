"use client";

import Link from "next/link";
import { useTransition } from "react";
import { BookForm } from "@/components/BookForm";
import { Button, buttonVariants } from "@/components/ui/button";
import type { BookInput } from "@/lib/validation/book";
import { removeBook, updateBook } from "./actions";

type Props = { id: string; title: string; defaultValues: BookInput };

export function EditBookPage({ id, title, defaultValues }: Props) {
  const [deleting, startDelete] = useTransition();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          Edit <span lang={defaultValues.language}>{title}</span>
        </h1>
        <Link href={`/books/${id}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
          Cancel
        </Link>
      </div>
      <BookForm
        defaultValues={defaultValues}
        onSave={updateBook.bind(null, id)}
        submitLabel="Save changes"
        footer={
          <Button
            type="button"
            variant="destructive"
            className="ml-auto"
            disabled={deleting}
            onClick={() => {
              if (confirm(`Delete “${title}” from the catalogue? This can't be undone.`)) {
                startDelete(() => removeBook(id));
              }
            }}
          >
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        }
      />
    </div>
  );
}
