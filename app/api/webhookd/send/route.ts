import { NextResponse } from "next/server";
import { dispatch, validateTargetUrl } from "@/lib/webhookd";
import { checkAndRecord, ipFromHeaders } from "@/lib/ratelimit";
import { isConfigured } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30; // up to 3 × 3s + backoffs

export async function POST(req: Request) {
  if (!isConfigured()) {
    return NextResponse.json(
      { error: "Webhook demo is not configured." },
      { status: 503 },
    );
  }

  const ip = ipFromHeaders(req.headers);
  // Rate limit: 3 dispatches per 10 minutes per IP (using the same lib as the
  // ratelimit demo, scoped separately).
  const limit = await checkAndRecord(ip, "demo:webhookd", 3, 600);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Rate limit exceeded. Try again in ${limit.retryAfterSeconds}s.` },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      },
    );
  }

  let body: { targetUrl?: string; payload?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const check = validateTargetUrl(body.targetUrl?.trim() ?? "");
  if (!check.ok) {
    return NextResponse.json({ error: check.reason }, { status: 400 });
  }

  const payload =
    (body.payload?.trim() ?? "") ||
    JSON.stringify({ event: "demo.ping", ts: new Date().toISOString() });

  if (payload.length > 4096) {
    return NextResponse.json(
      { error: "Payload too large (max 4096 bytes)." },
      { status: 400 },
    );
  }

  // Best effort: ensure payload is valid JSON for the receiver's sake, but
  // accept any string. (Stripe and friends sign raw bytes, not JSON.)
  const result = await dispatch(check.url, payload);
  return NextResponse.json(result);
}
