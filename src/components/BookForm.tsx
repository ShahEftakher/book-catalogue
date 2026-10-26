"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useTransition, type ReactNode } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { CoverImage } from "@/components/CoverImage";
import { NativeSelect } from "@/components/NativeSelect";
import { RatingInput } from "@/components/RatingInput";
import { SuggestInput } from "@/components/SuggestInput";
import { TagInput } from "@/components/TagInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { hasBangla } from "@/lib/bn";
import type { SaveResult } from "@/lib/book-form";
import {
  BOOK_FORMATS,
  FORMAT_LABELS,
  LANGUAGES,
  READING_STATUSES,
  STATUS_LABELS,
} from "@/lib/constants";
import { bookInput, type BookData, type BookInput } from "@/lib/validation/book";

type Props = {
  defaultValues: BookInput;
  onSave: (data: BookData) => Promise<SaveResult>;
  submitLabel: string;
  footer?: ReactNode;
};

function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
      <legend className="px-1 text-sm font-medium">{title}</legend>
      {children}
    </fieldset>
  );
}

/** The single add/edit form every "add a book" path ends on. */
export function BookForm({ defaultValues, onSave, submitLabel, footer }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<{ message: string; existingId?: string } | null>(
    null,
  );

  const form = useForm<BookInput, unknown, BookData>({
    resolver: zodResolver(bookInput),
    defaultValues,
  });
  const { register, control, setValue, formState } = form;
  const errors = formState.errors;
  const authors = useFieldArray({ control, name: "authors" });

  const [title, coverUrl, language] = useWatch({ control, name: ["title", "coverUrl", "language"] });
  const bangla = language === "bn" || hasBangla(title);

  const onSubmit = form.handleSubmit((data) => {
    setServerError(null);
    startTransition(async () => {
      const result = await onSave(data);
      if (result.ok) {
        router.push(`/books/${result.id}`);
        router.refresh();
      } else {
        setServerError({ message: result.error, existingId: result.existingId });
      }
    });
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <Section title="Book">
        <Field label="Title" htmlFor="title" error={errors.title?.message} className="sm:col-span-2">
          <Input
            id="title"
            lang={bangla ? "bn" : undefined}
            {...register("title", {
              onChange: (e) => {
                // Typing a Bangla title switches the language automatically
                if (hasBangla(e.target.value) && language !== "bn") setValue("language", "bn");
              },
            })}
          />
        </Field>
        <Field
          label={bangla ? "Romanized title" : "Alternate / romanized title"}
          htmlFor="titleLatin"
          hint={bangla ? "Lets you find it by typing in English, e.g. “Himu”" : undefined}
        >
          <Input id="titleLatin" {...register("titleLatin")} />
        </Field>
        <Field label="Subtitle" htmlFor="subtitle">
          <Input id="subtitle" lang={bangla ? "bn" : undefined} {...register("subtitle")} />
        </Field>

        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label>Authors</Label>
          {authors.fields.map((field, index) => (
            <div key={field.id} className="flex gap-2">
              <Controller
                control={control}
                name={`authors.${index}.name`}
                render={({ field: f }) => (
                  <SuggestInput
                    kind="author"
                    aria-label={`Author ${index + 1}`}
                    placeholder="Name (any script)"
                    value={f.value}
                    lang={bangla ? "bn" : undefined}
                    onValueChange={(v, match) => {
                      f.onChange(v);
                      if (match?.nameLatin) setValue(`authors.${index}.nameLatin`, match.nameLatin);
                    }}
                  />
                )}
              />
              <Input
                aria-label={`Author ${index + 1} romanized`}
                placeholder="Romanized (optional)"
                {...register(`authors.${index}.nameLatin`)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Remove author"
                onClick={() => authors.remove(index)}
                disabled={authors.fields.length === 1}
              >
                <Trash2Icon />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start"
            onClick={() => authors.append({ name: "", nameLatin: "" })}
          >
            <PlusIcon /> Add author
          </Button>
        </div>

        <Field label="Language" htmlFor="language">
          <NativeSelect id="language" {...register("language")}>
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </Section>

      <Section title="Edition">
        <Field label="ISBN" htmlFor="isbn" error={errors.isbn?.message} hint="ISBN-10 or 13; Bangla digits are fine">
          <Input id="isbn" inputMode="numeric" {...register("isbn")} />
        </Field>
        <Field label="Edition" htmlFor="edition">
          <Input id="edition" placeholder="e.g. 3rd printing, Ekushe Boimela 2019" {...register("edition")} />
        </Field>
        <Controller
          control={control}
          name="publisherName"
          render={({ field: f }) => (
            <Field label="Publisher" htmlFor="publisherName">
              <SuggestInput
                id="publisherName"
                kind="publisher"
                value={f.value ?? ""}
                lang={bangla ? "bn" : undefined}
                onValueChange={(v, match) => {
                  f.onChange(v);
                  if (match?.nameLatin) setValue("publisherNameLatin", match.nameLatin);
                }}
              />
            </Field>
          )}
        />
        <Field label="Publisher (romanized)" htmlFor="publisherNameLatin">
          <Input id="publisherNameLatin" {...register("publisherNameLatin")} />
        </Field>
        <Field label="Year published" htmlFor="publishedYear" error={errors.publishedYear?.message}>
          <Input id="publishedYear" inputMode="numeric" {...register("publishedYear")} />
        </Field>
        <Field label="Pages" htmlFor="pages" error={errors.pages?.message}>
          <Input id="pages" inputMode="numeric" {...register("pages")} />
        </Field>
      </Section>

      <Section title="My copy">
        <Field label="Formats" error={errors.formats?.message} className="sm:col-span-2">
          <Controller
            control={control}
            name="formats"
            render={({ field: f }) => (
              <div className="flex flex-wrap gap-3">
                {BOOK_FORMATS.map((fmt) => (
                  <label key={fmt} className="flex items-center gap-1.5 text-sm">
                    <input
                      type="checkbox"
                      checked={f.value.includes(fmt)}
                      onChange={(e) =>
                        f.onChange(
                          e.target.checked ? [...f.value, fmt] : f.value.filter((v) => v !== fmt),
                        )
                      }
                    />
                    {FORMAT_LABELS[fmt]}
                  </label>
                ))}
              </div>
            )}
          />
        </Field>
        <Field label="Shelf / location" htmlFor="location" hint="Only visible to you">
          <Input id="location" placeholder="e.g. Living room, shelf 2" {...register("location")} />
        </Field>
        <Field label="Copies" htmlFor="copies" error={errors.copies?.message}>
          <Input id="copies" inputMode="numeric" {...register("copies")} />
        </Field>
        <div className="flex gap-4 sm:col-span-2">
          <CoverImage src={coverUrl || null} title={title || "No cover"} className="w-20 shrink-0" />
          <Field label="Cover image URL" htmlFor="coverUrl" error={errors.coverUrl?.message} className="flex-1">
            <Input id="coverUrl" {...register("coverUrl")} />
          </Field>
        </div>
      </Section>

      <Section title="Reading">
        <Field label="Status" htmlFor="status">
          <NativeSelect id="status" {...register("status")}>
            {READING_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Rating" error={errors.rating?.message}>
          <Controller
            control={control}
            name="rating"
            render={({ field: f }) => (
              <RatingInput value={f.value as number | undefined} onChange={f.onChange} />
            )}
          />
        </Field>
        <Field label="Started" htmlFor="startedAt" error={errors.startedAt?.message}>
          <Input id="startedAt" type="date" {...register("startedAt")} />
        </Field>
        <Field label="Finished" htmlFor="finishedAt" error={errors.finishedAt?.message}>
          <Input id="finishedAt" type="date" {...register("finishedAt")} />
        </Field>
        <Field label="Review (public)" htmlFor="reviewPublic" className="sm:col-span-2">
          <Textarea id="reviewPublic" rows={3} {...register("reviewPublic")} />
        </Field>
        <Field label="Private notes" htmlFor="notesPrivate" hint="Only visible to you" className="sm:col-span-2">
          <Textarea id="notesPrivate" rows={3} {...register("notesPrivate")} />
        </Field>
      </Section>

      <Section title="More">
        <Field label="Tags" htmlFor="tags" className="sm:col-span-2">
          <Controller
            control={control}
            name="tags"
            render={({ field: f }) => <TagInput id="tags" value={f.value} onChange={f.onChange} />}
          />
        </Field>
        <Field label="Description" htmlFor="description" className="sm:col-span-2">
          <Textarea id="description" rows={4} lang={bangla ? "bn" : undefined} {...register("description")} />
        </Field>
      </Section>

      {serverError && (
        <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {serverError.message}
          {serverError.existingId && (
            <>
              {" "}
              <Link href={`/books/${serverError.existingId}`} className="underline">
                View it
              </Link>
            </>
          )}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
        {footer}
      </div>
    </form>
  );
}
