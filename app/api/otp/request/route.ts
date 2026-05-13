import { NextResponse } from "next/server";
import { requestOtp } from "@/lib/otp";
import { isConfigured } from "@/lib/db";
import { isEmailConfigured, sendOtpEmail } from "@/lib/email";
import { checkAndRecord, ipFromHeaders } from "@/lib/ratelimit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!isConfigured() || !isEmailConfigured()) {
    return NextResponse.json(
      { error: "OTP demo is not configured." },
      { status: 503 },
    );
  }

  // Email-keyed rate limit lives inside requestOtp; this IP-keyed gate stops
  // an attacker from rotating addresses (incl. +tag variants) to abuse Brevo.
  const ip = ipFromHeaders(req.headers);
  const limit = await checkAndRecord(ip, "demo:otp", 3, 600);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${limit.retryAfterSeconds}s.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const result = await requestOtp(body.email?.trim() ?? "");
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: result.status });
  }

  try {
    await sendOtpEmail(result.email, result.code);
  } catch (err) {
    console.error("send OTP email failed", err);
    return NextResponse.json(
      { error: "Could not send the email. Try again in a minute." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
