"use server";

import type { SaveResult } from "@/lib/book-form";
import { validateAndSave } from "@/lib/book-mutations";
import type { BookData } from "@/lib/validation/book";

export async function createBook(data: BookData): Promise<SaveResult> {
  return validateAndSave(data);
}
