import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isOwner } from "@/lib/auth";
import { getBook } from "@/lib/books";
import { BookDetailPage } from "@/pages-impl/book-detail/BookDetailPage";

export async function generateMetadata({ params }: PageProps<"/books/[id]">): Promise<Metadata> {
  const book = await getBook((await params).id);
  return { title: book?.title ?? "Book not found" };
}

export default async function Page({ params }: PageProps<"/books/[id]">) {
  const { id } = await params;
  const [book, owner] = await Promise.all([getBook(id), isOwner()]);
  if (!book) notFound();
  return <BookDetailPage book={book} isOwner={owner} />;
}
