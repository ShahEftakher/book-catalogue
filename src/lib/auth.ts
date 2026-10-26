import "server-only";
import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";

const ownerEmail = process.env.OWNER_EMAIL?.trim().toLowerCase();

export function isOwnerEmail(email: string | null | undefined): boolean {
  return !!ownerEmail && email?.trim().toLowerCase() === ownerEmail;
}

// Dev sign-in never exists in a production build, whatever the env var says.
export const devLoginEnabled =
  process.env.NODE_ENV !== "production" && process.env.AUTH_DEV_LOGIN === "true";
export const githubEnabled = !!process.env.AUTH_GITHUB_ID && !!process.env.AUTH_GITHUB_SECRET;

const providers: Provider[] = [];
if (githubEnabled) providers.push(GitHub);
if (devLoginEnabled) {
  providers.push(
    Credentials({
      id: "dev",
      name: "Dev sign-in",
      credentials: {},
      authorize: async () => ({ id: "owner", email: ownerEmail, name: "Owner (dev)" }),
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  session: { strategy: "jwt" },
  pages: { signIn: "/signin", error: "/signin" },
  callbacks: {
    // Only the owner can sign in at all; everyone else browses anonymously.
    signIn: ({ user }) => isOwnerEmail(user.email),
    authorized: ({ auth }) => isOwnerEmail(auth?.user?.email),
  },
});

export async function isOwner(): Promise<boolean> {
  const session = await auth();
  return isOwnerEmail(session?.user?.email);
}

/** Call at the top of every server action and owner-only route. */
export async function requireOwner(): Promise<void> {
  if (!(await isOwner())) throw new Error("Unauthorized");
}
