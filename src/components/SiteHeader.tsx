import Link from "next/link";
import { BookOpenIcon, PlusIcon } from "lucide-react";
import { AccountMenu } from "@/components/AccountMenu";
import { buttonVariants } from "@/components/ui/button";
import { auth, isOwnerEmail } from "@/lib/auth";

export async function SiteHeader() {
  const session = await auth();
  const email = session?.user?.email;
  const owner = isOwnerEmail(email);

  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-2 px-4">
        <Link
          href="/"
          aria-label="Book Catalogue home"
          className="-ml-2 flex min-h-11 items-center gap-2 rounded-md px-2 font-semibold whitespace-nowrap"
        >
          <BookOpenIcon className="size-5 shrink-0" />
          <span className="max-[400px]:sr-only">Book Catalogue</span>
        </Link>
        <nav className="ml-auto flex items-center gap-1 sm:gap-2">
          {owner && email ? (
            <>
              <Link
                href="/admin/books/new"
                aria-label="Add book"
                className={buttonVariants({ size: "sm", className: "max-sm:size-10 max-sm:px-0" })}
              >
                <PlusIcon />
                <span className="max-sm:sr-only">Add book</span>
              </Link>
              <AccountMenu email={email} />
            </>
          ) : (
            <Link href="/signin" className={buttonVariants({ size: "sm", variant: "ghost" })}>
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
