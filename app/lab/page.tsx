import type { Metadata } from "next";
import { cookies } from "next/headers";
import { isConfigured } from "@/lib/db";
import { hashToken, SESSION_COOKIE_NAME } from "@/lib/lab/auth";
import { sessionByTokenHash } from "@/lib/lab/db";
import { HeroSpotlight } from "@/components/hero-spotlight";
import { AuthPanel } from "@/components/lab/auth-panel";
import { SignedInStub } from "@/components/lab/signed-in-stub";

export const metadata: Metadata = {
  title: "Lab",
  description:
    "A small full-stack demo that composes the PS-safe research libraries (auth + ratelimit + queryhelper) into one screen.",
};

// /lab is one URL with two states — the Server Component reads the cookie
// and renders either the auth panel or the signed-in surface. This matches
// PLAN.md §4: no /lab/login or /lab/dashboard sub-routes, no client-side
// "am I signed in" flash, no redirect waterfall.
export default async function LabPage() {
  if (!isConfigured()) {
    return <NotConfigured />;
  }

  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await sessionByTokenHash(hashToken(token)) : null;
  const user = session?.user ?? null;

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <header className="border-b border-border pb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">Lab</p>
        <HeroSpotlight className="mt-3 block">
          <h1 className="hero-text text-4xl font-bold tracking-tight">
            Try the stack
          </h1>
        </HeroSpotlight>
        <p className="mt-3 max-w-xl text-base text-muted-foreground">
          A one-screen full-stack demo: sign up, then drive a tiny dashboard
          that runs through the same auth, rate-limit, and query-helper
          patterns from my Go libraries — ported to TypeScript so the whole
          stack lives on one Vercel deploy.
        </p>
      </header>

      {user ? <SignedInStub email={user.email} /> : <AuthPanel />}
    </div>
  );
}

function NotConfigured() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold text-foreground">/lab is unavailable</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        This environment is missing <code className="font-mono">DATABASE_URL</code>{" "}
        — the demo connects to Neon for users + sessions. Set it in the
        environment to enable /lab.
      </p>
    </div>
  );
}
