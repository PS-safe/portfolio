"use client";

import { Check, Copy, Loader2 } from "lucide-react";
import { useState } from "react";

type Result = { slug: string; shortUrl: string; target: string };

export function TryShortenForm() {
  const [target, setTarget] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch("/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: target.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      setResult({
        slug: data.slug,
        target: data.target,
        shortUrl: `${origin}/r/${data.slug}`,
      });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!result) return;
    await navigator.clipboard.writeText(result.shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="not-prose my-6 rounded-lg border border-border bg-card p-5">
      <p className="text-xs font-mono uppercase tracking-widest text-accent">
        Try it live
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Paste a URL and get a real shortlink served by the deployed Go service.
      </p>

      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="url"
          required
          placeholder="https://example.com/some/very/long/url"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          disabled={loading}
          className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !target.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Shorten
        </button>
      </form>

      {error && (
        <p className="mt-3 text-sm text-red-500" role="alert">
          {error}
        </p>
      )}

      {result && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-md border border-border bg-muted p-3">
          <a
            href={result.shortUrl}
            target="_blank"
            rel="noreferrer"
            className="truncate font-mono text-sm text-accent hover:underline"
          >
            {result.shortUrl}
          </a>
          <button
            type="button"
            onClick={copy}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground transition-colors hover:bg-muted"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" /> Copy
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
