import type { Metadata } from "next";
import { devLoginEnabled, githubEnabled } from "@/lib/auth";
import { SignInPage } from "@/pages-impl/signin/SignInPage";

export const metadata: Metadata = { title: "Sign in" };

export default async function Page({ searchParams }: PageProps<"/signin">) {
  const { callbackUrl, error } = await searchParams;
  return (
    <SignInPage
      githubEnabled={githubEnabled}
      devLoginEnabled={devLoginEnabled}
      callbackUrl={typeof callbackUrl === "string" ? callbackUrl : undefined}
      error={typeof error === "string" ? error : undefined}
    />
  );
}
