"use client";

import { Check, Copy, Loader2, Send } from "lucide-react";
import { useState } from "react";

type Attempt = {
  attemptNum: number;
  startedAt: string;
  durationMs: number;
  statusCode: number;
  error: string;
  responseSnippet: string;
};

type DispatchResult = {
  deliveryId: string;
  signingSecret: string;
  finalStatus: "succeeded" | "failed";
  headers: { id: string; timestamp: number; signature: string };
  attempts: Attempt[];
};

const DEFAULT_PAYLOAD = JSON.stringify(
  { event: "demo.ping", message: "hello from ps-shin's portfolio" },
  null,
  2,
);

export function TryWebhookForm() {
  const [targetUrl, setTargetUrl] = useState("");
  const [payload, setPayload] = useState(DEFAULT_PAYLOAD);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DispatchResult | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch("/api/webhookd/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUrl: targetUrl.trim(), payload }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Dispatch failed.");
        return;
      }
      setResult(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copy(text: string, label: string) {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="not-prose my-6 rounded-lg border border-border bg-card p-5">
      <p className="text-xs font-mono uppercase tracking-widest text-accent">
        Try it live
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Paste a URL from <a className="text-accent hover:underline" href="https://webhook.site" target="_blank" rel="noreferrer">webhook.site</a> or any inbox you control. The server signs your payload with HMAC-SHA256, dispatches it, and retries with jittered exponential backoff up to 3 times. Rate-limited to 3 sends per 10 minutes per IP.
      </p>

      <form onSubmit={send} className="mt-4 space-y-2">
        <input
          type="url"
          required
          placeholder="https://webhook.site/your-uuid"
          value={targetUrl}
          onChange={(e) => setTargetUrl(e.target.value)}
          disabled={loading}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none disabled:opacity-50"
        />
        <textarea
          rows={4}
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          disabled={loading}
          className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs text-foreground focus:border-accent focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !targetUrl.trim()}
          className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Dispatch
        </button>
      </form>

      {error && (
        <p className="mt-3 text-sm text-red-500" role="alert">
          {error}
        </p>
      )}

      {result && (
        <div className="mt-5 space-y-4 text-sm">
          <div className="rounded-md border border-border bg-muted p-3">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Final status
            </p>
            <p
              className={
                "mt-1 font-mono " +
                (result.finalStatus === "succeeded" ? "text-accent" : "text-red-500")
              }
            >
              {result.finalStatus}
            </p>
          </div>

          <div className="rounded-md border border-border bg-muted p-3">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Signing secret (server-generated per request)
            </p>
            <div className="mt-1 flex items-center gap-2">
              <code className="flex-1 truncate font-mono text-xs text-foreground">
                {result.signingSecret}
              </code>
              <CopyButton
                onClick={() => copy(result.signingSecret, "secret")}
                copied={copied === "secret"}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Verify with: HMAC-SHA256(secret, <code>{`"<id>.<ts>." + body`}</code>)
            </p>
          </div>

          <div className="rounded-md border border-border bg-muted p-3">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Headers sent
            </p>
            <ul className="mt-2 space-y-1 font-mono text-xs">
              <li>Webhook-Id: {result.headers.id}</li>
              <li>Webhook-Timestamp: {result.headers.timestamp}</li>
              <li className="truncate">Webhook-Signature: {result.headers.signature}</li>
            </ul>
          </div>

          <div>
            <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">
              Attempts ({result.attempts.length})
            </p>
            <ul className="space-y-2">
              {result.attempts.map((a) => {
                const ok = a.statusCode >= 200 && a.statusCode < 300;
                return (
                  <li
                    key={a.attemptNum}
                    className="rounded-md border border-border bg-background p-3 text-xs"
                  >
                    <div className="flex items-center justify-between font-mono">
                      <span>#{a.attemptNum}</span>
                      <span className={ok ? "text-accent" : "text-red-500"}>
                        {a.statusCode || "—"} {ok ? "OK" : a.error ? `· ${a.error}` : ""}
                      </span>
                      <span className="text-muted-foreground">{a.durationMs}ms</span>
                    </div>
                    {a.responseSnippet && (
                      <pre className="mt-2 overflow-x-auto rounded bg-muted p-2 font-mono text-[11px] text-foreground">
                        {a.responseSnippet}
                      </pre>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function CopyButton({ onClick, copied }: { onClick: () => void; copied: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[11px] text-foreground transition-colors hover:bg-muted"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
