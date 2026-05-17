"use client";

import { Loader2, LogIn, UserPlus } from "lucide-react";
import { useState } from "react";

type Mode = "signup" | "login";

/**
 * Signup / login form for /lab. One panel, one form, mode-aware copy.
 * Per PLAN §4: argon2 cold-start can take 2-4s on a cold function, so
 * the loading copy intentionally explains the wait ("Setting up secure
 * password storage…") rather than a vague "Loading…".
 */
export function AuthPanel() {
  const [mode, setMode] = useState<Mode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/lab/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      // Session cookie is set by the response — reloading the page lets
      // the Server Component re-read the cookie and switch to the
      // signed-in surface, keeping the URL stable.
      location.reload();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const submitLabel = (() => {
    if (loading && mode === "signup") return "Setting up secure password storage…";
    if (loading && mode === "login") return "Signing in…";
    return mode === "signup" ? "Create account" : "Sign in";
  })();

  const Icon = mode === "signup" ? UserPlus : LogIn;

  return (
    <div className="mx-auto mt-10 max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
      {/* Mode toggle — single source of truth for which form is showing */}
      <div
        role="tablist"
        aria-label="Authentication mode"
        className="mb-6 grid grid-cols-2 gap-1 rounded-md bg-muted p-1 text-sm"
      >
        {(["signup", "login"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={`rounded px-3 py-1.5 font-medium transition-colors ${
              mode === m
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {m === "signup" ? "Sign up" : "Log in"}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="lab-email" className="block text-xs font-medium text-foreground">
            Email
          </label>
          <input
            id="lab-email"
            type="email"
            autoComplete={mode === "signup" ? "email" : "username"}
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            placeholder="you@example.com"
            className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none disabled:opacity-50"
          />
        </div>

        <div>
          <label htmlFor="lab-password" className="block text-xs font-medium text-foreground">
            Password{" "}
            {mode === "signup" && (
              <span className="font-normal text-muted-foreground">(at least 8 characters)</span>
            )}
          </label>
          <input
            id="lab-password"
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            required
            minLength={mode === "signup" ? 8 : 1}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none disabled:opacity-50"
          />
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-md border border-red-500/30 bg-red-500/5 px-3 py-2 text-sm text-red-600 dark:text-red-400"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !email.trim() || password.length < (mode === "signup" ? 8 : 1)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Icon className="h-4 w-4" aria-hidden />
          )}
          <span className="truncate">{submitLabel}</span>
        </button>
      </form>

      <p className="mt-6 text-xs text-muted-foreground">
        Demo only. Real auth + sessions through{" "}
        <a
          href="https://github.com/PS-safe/auth"
          target="_blank"
          rel="noreferrer"
          className="nav-link text-foreground hover:text-accent"
        >
          PS-safe/auth
        </a>
        ; per-IP rate-limit through{" "}
        <a
          href="https://github.com/PS-safe/ratelimit"
          target="_blank"
          rel="noreferrer"
          className="nav-link text-foreground hover:text-accent"
        >
          PS-safe/ratelimit
        </a>
        . Dashboard arrives in the next subtree.
      </p>
    </div>
  );
}
