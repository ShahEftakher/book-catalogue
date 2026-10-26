import Link from "next/link";
import { BookOpenIcon, PlusIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { auth, isOwnerEmail, signOut } from "@/lib/auth";

export async function SiteHeader() {
  const session = await auth();
  const owner = isOwnerEmail(session?.user?.email);

  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold whitespace-nowrap">
          <BookOpenIcon className="size-5" />
          Book Catalogue
        </Link>
        <nav className="ml-auto flex items-center gap-2">
          {owner ? (
            <>
              <Link href="/admin/books/new" className={buttonVariants({ size: "sm" })}>
                <PlusIcon /> Add book
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button type="submit" className={buttonVariants({ size: "sm", variant: "ghost" })}>
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link href="/signin" className={buttonVariants({ size: "sm", variant: "ghost" })}>
              Owner sign-in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
