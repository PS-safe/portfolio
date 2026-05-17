"use client";

import { Loader2, LogOut } from "lucide-react";
import { useState } from "react";

/**
 * Placeholder shown after auth while the dashboard subtree is still
 * pending. Confirms the auth loop closes end-to-end; replaced by the
 * real `<Dashboard>` in the next build pass.
 */
export function SignedInStub({ email }: { email: string }) {
  const [loading, setLoading] = useState(false);

  async function signOut() {
    setLoading(true);
    try {
      await fetch("/api/lab/logout", { method: "POST" });
      location.reload();
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto mt-10 max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
      <p className="text-sm">
        Signed in as <span className="font-mono text-foreground">{email}</span>
      </p>
      <p className="mt-3 text-sm text-muted-foreground">
        The dashboard is the next subtree. For now this confirms the auth loop
        works end to end: argon2id-hashed password, opaque session token (only
        sha256 in the DB), HttpOnly+Secure+SameSite=Lax cookie.
      </p>
      <button
        type="button"
        onClick={signOut}
        disabled={loading}
        className="mt-5 inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-muted disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        ) : (
          <LogOut className="h-3.5 w-3.5" aria-hidden />
        )}
        Sign out
      </button>
    </div>
  );
}
