"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import type { SaveResult } from "@/lib/book-form";
import { validateAndSave } from "@/lib/book-mutations";
import { deleteBook } from "@/lib/books";
import type { BookData } from "@/lib/validation/book";

export async function updateBook(id: string, data: BookData): Promise<SaveResult> {
  return validateAndSave(data, id);
}

export async function removeBook(id: string): Promise<void> {
  await requireOwner();
  await deleteBook(id);
  revalidatePath("/");
  redirect("/");
}
