import { NextResponse } from "next/server";
import { checkAndRecord, ipFromHeaders } from "@/lib/ratelimit";
import { isConfigured } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!isConfigured()) {
    return NextResponse.json(
      { error: "Rate-limit demo is not configured." },
      { status: 503 },
    );
  }

  const ip = ipFromHeaders(req.headers);
  try {
    const result = await checkAndRecord(ip, "demo:ping");

    const status = result.allowed ? 200 : 429;
    const res = NextResponse.json(result, { status });
    res.headers.set("X-RateLimit-Limit", String(result.limit));
    res.headers.set("X-RateLimit-Remaining", String(result.remaining));
    res.headers.set(
      "X-RateLimit-Reset",
      String(Math.floor(new Date(result.resetAt).getTime() / 1000)),
    );
    if (!result.allowed) {
      res.headers.set("Retry-After", String(result.retryAfterSeconds));
    }
    return res;
  } catch (err) {
    console.error("ratelimit ping failed", err);
    return NextResponse.json({ error: "Internal error." }, { status: 500 });
  }
}
