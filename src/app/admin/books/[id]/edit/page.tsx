import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { bookToForm } from "@/lib/book-form";
import { getBook } from "@/lib/books";
import { EditBookPage } from "@/pages-impl/edit-book/EditBookPage";

export const metadata: Metadata = { title: "Edit book" };

export default async function Page({ params }: PageProps<"/admin/books/[id]/edit">) {
  const book = await getBook((await params).id);
  if (!book) notFound();
  return <EditBookPage id={book.id} title={book.title} defaultValues={bookToForm(book)} />;
}
