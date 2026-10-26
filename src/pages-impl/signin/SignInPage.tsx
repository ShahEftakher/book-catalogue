import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signInWith } from "./actions";

type Props = {
  githubEnabled: boolean;
  devLoginEnabled: boolean;
  callbackUrl?: string;
  error?: string;
};

export function SignInPage({ githubEnabled, devLoginEnabled, callbackUrl, error }: Props) {
  return (
    <div className="mx-auto mt-10 max-w-sm">
      <Card>
        <CardHeader>
          <CardTitle>Owner sign-in</CardTitle>
          <CardDescription>
            Anyone can browse the catalogue. Only the owner can sign in to add or edit books.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {error && (
            <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
              {error === "AccessDenied"
                ? "That account isn't the catalogue owner."
                : "Sign-in failed. Please try again."}
            </p>
          )}
          {githubEnabled && (
            <form action={signInWith.bind(null, "github")}>
              <input type="hidden" name="callbackUrl" value={callbackUrl ?? "/"} />
              <Button type="submit" className="w-full">
                Continue with GitHub
              </Button>
            </form>
          )}
          {devLoginEnabled && (
            <form action={signInWith.bind(null, "dev")}>
              <input type="hidden" name="callbackUrl" value={callbackUrl ?? "/"} />
              <Button type="submit" variant="outline" className="w-full">
                Dev sign-in (local only)
              </Button>
            </form>
          )}
          {!githubEnabled && !devLoginEnabled && (
            <p className="text-sm text-muted-foreground">
              No sign-in method is configured. Set AUTH_GITHUB_ID and AUTH_GITHUB_SECRET.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
