import type { Metadata } from "next";
import { cookies } from "next/headers";
import { isConfigured } from "@/lib/db";
import { hashToken, SESSION_COOKIE_NAME } from "@/lib/lab/auth";
import { listTasks, sessionByTokenHash } from "@/lib/lab/db";
import { parse } from "@/lib/lab/queryhelper";
import { TASK_CFG } from "@/app/api/lab/tasks/route";
import { HeroSpotlight } from "@/components/hero-spotlight";
import { AuthPanel } from "@/components/lab/auth-panel";
import { Dashboard } from "@/components/lab/dashboard";

export const metadata: Metadata = {
  title: "Lab",
  description:
    "A small full-stack demo that composes the PS-safe research libraries (auth + ratelimit + queryhelper) into one screen.",
};

type SP = Promise<Record<string, string | string[] | undefined>>;

// /lab is one URL with two states — the Server Component reads the cookie
// and renders either the auth panel or the dashboard. URL query params
// drive the dashboard's view state (filter/search/sort/page), so each
// filter change re-runs this function with new searchParams and yields a
// fresh page of tasks server-side. See PLAN.md §4.
export default async function LabPage({ searchParams }: { searchParams: SP }) {
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

      {user ? (
        <DashboardForUser userId={user.id} email={user.email} searchParams={searchParams} />
      ) : (
        <AuthPanel />
      )}
    </div>
  );
}

async function DashboardForUser({
  userId,
  email,
  searchParams,
}: {
  userId: string;
  email: string;
  searchParams: SP;
}) {
  const raw = await searchParams;
  const urlParams = new URLSearchParams();
  for (const [k, v] of Object.entries(raw)) {
    if (Array.isArray(v)) v.forEach((x) => urlParams.append(k, x));
    else if (v !== undefined) urlParams.set(k, v);
  }

  const parsed = parse(urlParams, TASK_CFG);
  if (!parsed.ok) {
    // Unknown filter/sort field came in via a hand-crafted URL. Showing
    // a 400-ish message is the honest call rather than silently dropping
    // params — keeps the URL contract visible.
    return (
      <div className="mt-8 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
        <p className="font-medium">Couldn&apos;t parse the URL: {parsed.error}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Try removing the offending parameter from the URL bar, or{" "}
          <a href="/lab" className="underline">go back to the default view</a>.
        </p>
      </div>
    );
  }

  const initialPage = await listTasks(userId, parsed.spec, TASK_CFG);
  return <Dashboard email={email} initialPage={initialPage} />;
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
