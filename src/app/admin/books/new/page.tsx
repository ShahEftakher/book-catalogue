import type { Metadata } from "next";
import { AddBookPage } from "@/pages-impl/add-book/AddBookPage";

export const metadata: Metadata = { title: "Add a book" };

export default function Page() {
  return <AddBookPage />;
}
