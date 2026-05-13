import { createHmac, randomBytes } from "node:crypto";
import { validateExternalUrl, type UrlValidationResult } from "./url-validation";

export function validateTargetUrl(raw: string): UrlValidationResult {
  return validateExternalUrl(raw);
}

export function newSecret(): string {
  return randomBytes(24).toString("hex");
}

export function newDeliveryId(): string {
  return "dlv_" + randomBytes(8).toString("hex");
}

export type SignedHeaders = {
  id: string;
  timestamp: number;
  signature: string; // "v1=<hex>"
};

/** HMAC-SHA256 with the same payload shape as the Go library: `<id>.<ts>.<body>`. */
export function sign(id: string, secret: string, body: Buffer | string, nowSec: number): SignedHeaders {
  const ts = nowSec;
  const data = `${id}.${ts}.`;
  const h = createHmac("sha256", secret);
  h.update(data);
  h.update(body);
  return { id, timestamp: ts, signature: "v1=" + h.digest("hex") };
}

export type Attempt = {
  attemptNum: number;
  startedAt: string;
  durationMs: number;
  statusCode: number;
  error: string;
  responseSnippet: string;
};

export type DispatchResult = {
  deliveryId: string;
  signingSecret: string;
  finalStatus: "succeeded" | "failed";
  headers: { id: string; timestamp: number; signature: string };
  attempts: Attempt[];
};

type DispatchConfig = {
  maxAttempts: number;
  perAttemptTimeoutMs: number;
  /** Backoff before attempt n (1-indexed; entry 1 = pre-first-attempt = 0). */
  backoffsMs: number[];
};

export const demoDispatchConfig: DispatchConfig = {
  maxAttempts: 3,
  perAttemptTimeoutMs: 3000,
  backoffsMs: [0, 300, 900], // jitter applied at use-time
};

function jitter(ms: number): number {
  if (ms <= 0) return 0;
  // ±25%
  const delta = ms * 0.5 * (Math.random() - 0.5);
  return Math.max(0, Math.round(ms + delta));
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Synchronously dispatch a signed webhook to `targetUrl` with up to N retries.
 * Returns the full attempt history plus the secret + headers used so the demo
 * UI can teach how verification works on the receiving end.
 */
export async function dispatch(
  targetUrl: string,
  payload: string,
  cfg: DispatchConfig = demoDispatchConfig,
): Promise<DispatchResult> {
  const deliveryId = newDeliveryId();
  const secret = newSecret();
  const now = Math.floor(Date.now() / 1000);
  const headers = sign(deliveryId, secret, payload, now);

  const attempts: Attempt[] = [];

  for (let n = 1; n <= cfg.maxAttempts; n++) {
    const backoff = jitter(cfg.backoffsMs[n - 1] ?? 0);
    if (backoff > 0) await sleep(backoff);

    const started = new Date();
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), cfg.perAttemptTimeoutMs);
    let statusCode = 0;
    let error = "";
    let snippet = "";
    try {
      const res = await fetch(targetUrl, {
        method: "POST",
        signal: ac.signal,
        // Never follow redirects: a public hostname that 3xx's to an internal
        // IP would otherwise sidestep the validateExternalUrl check.
        redirect: "manual",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "webhookd/0.1 (portfolio-demo)",
          "Webhook-Id": headers.id,
          "Webhook-Timestamp": String(headers.timestamp),
          "Webhook-Signature": headers.signature,
          "Webhook-Event": "demo.ping",
        },
        body: payload,
      });
      statusCode = res.status;
      const text = await res.text();
      snippet = text.length > 256 ? text.slice(0, 256) + "…" : text;
    } catch (e: unknown) {
      error = e instanceof Error ? e.message : "request failed";
    } finally {
      clearTimeout(timer);
    }

    const att: Attempt = {
      attemptNum: n,
      startedAt: started.toISOString(),
      durationMs: Date.now() - started.getTime(),
      statusCode,
      error,
      responseSnippet: snippet,
    };
    attempts.push(att);

    if (statusCode >= 200 && statusCode < 300) {
      return { deliveryId, signingSecret: secret, finalStatus: "succeeded", headers, attempts };
    }
  }

  return { deliveryId, signingSecret: secret, finalStatus: "failed", headers, attempts };
}
