"use client";

import { Loader2, Zap } from "lucide-react";
import { useState } from "react";

type Hit = {
  id: number;
  at: string;
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export function TryRateLimitForm() {
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ping() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/ratelimit/ping", { method: "POST" });
      const data = await res.json();
      if (res.status >= 500) {
        setError(data.error ?? "Server error.");
        return;
      }
      setHits((prev) =>
        [
          {
            id: Date.now() + Math.random(),
            at: new Date().toLocaleTimeString([], { hour12: false }),
            allowed: data.allowed,
            remaining: data.remaining,
            retryAfterSeconds: data.retryAfterSeconds,
          },
          ...prev,
        ].slice(0, 10),
      );
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  const latest = hits[0];

  return (
    <div className="not-prose my-6 rounded-lg border border-border bg-card p-5">
      <p className="text-xs font-mono uppercase tracking-widest text-accent">
        Try it live
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        5 requests per 10 seconds per IP. Click rapidly to see the limit kick
        in. Backed by the same Neon database as the other demos.
      </p>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={ping}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Zap className="h-4 w-4" />
          )}
          Ping
        </button>

        {latest && (
          <div className="flex items-center gap-4 text-xs">
            <Counter label="Remaining" value={String(latest.remaining)} />
            <Counter
              label="Status"
              value={latest.allowed ? "200" : "429"}
              tone={latest.allowed ? "ok" : "bad"}
            />
            {!latest.allowed && (
              <Counter
                label="Retry-After"
                value={`${latest.retryAfterSeconds}s`}
                tone="bad"
              />
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-500" role="alert">
          {error}
        </p>
      )}

      {hits.length > 0 && (
        <ul className="mt-4 space-y-1 font-mono text-xs">
          {hits.map((h) => (
            <li
              key={h.id}
              className={
                h.allowed
                  ? "flex items-center gap-3 text-muted-foreground"
                  : "flex items-center gap-3 text-red-500"
              }
            >
              <span className="opacity-70">{h.at}</span>
              <span>{h.allowed ? "200 OK" : "429 RATE LIMITED"}</span>
              <span className="opacity-70">remaining={h.remaining}</span>
              {!h.allowed && (
                <span className="opacity-70">retry-after={h.retryAfterSeconds}s</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Counter({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "ok" | "bad" | "neutral";
}) {
  const color =
    tone === "ok"
      ? "text-accent"
      : tone === "bad"
        ? "text-red-500"
        : "text-foreground";
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className={`mt-0.5 font-mono text-sm font-semibold ${color}`}>
        {value}
      </p>
    </div>
  );
}
