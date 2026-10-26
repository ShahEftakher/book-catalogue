"use server";

import { signIn } from "@/lib/auth";

// Only ever redirect within this site. Auth.js passes an absolute callbackUrl, so keep its path.
function safeRedirect(to: FormDataEntryValue | null): string {
  let path = typeof to === "string" ? to : "";
  if (/^https?:\/\//.test(path)) {
    try {
      const url = new URL(path);
      path = url.pathname + url.search;
    } catch {
      path = "/";
    }
  }
  return path.startsWith("/") && !path.startsWith("//") ? path : "/";
}

export async function signInWith(provider: "github" | "dev", formData: FormData) {
  await signIn(provider, { redirectTo: safeRedirect(formData.get("callbackUrl")) });
}
