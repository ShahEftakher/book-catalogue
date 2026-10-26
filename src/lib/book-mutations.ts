import "server-only";
import { revalidatePath } from "next/cache";
import { requireOwner } from "./auth";
import type { SaveResult } from "./book-form";
import { DuplicateIsbnError, saveBook, setCoverUrl } from "./books";
import { persistCover } from "./covers";
import { bookInput } from "./validation/book";

/** Shared by the add and edit actions: auth, validation, save, cover copy, revalidation. */
export async function validateAndSave(input: unknown, id?: string): Promise<SaveResult> {
  await requireOwner();
  const parsed = bookInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
  }
  try {
    const bookId = await saveBook(parsed.data, id);
    if (parsed.data.coverUrl) {
      const stored = await persistCover(parsed.data.coverUrl, bookId);
      if (stored !== parsed.data.coverUrl) await setCoverUrl(bookId, stored);
    }
    revalidatePath("/");
    revalidatePath(`/books/${bookId}`);
    return { ok: true, id: bookId };
  } catch (e) {
    if (e instanceof DuplicateIsbnError) {
      return { ok: false, error: e.message + ".", existingId: e.existingId };
    }
    console.error("saveBook failed", e);
    return { ok: false, error: "Couldn't save the book. Please try again." };
  }
}
