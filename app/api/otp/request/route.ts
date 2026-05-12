import { NextResponse } from "next/server";
import { requestOtp } from "@/lib/otp";
import { isConfigured } from "@/lib/db";
import { isEmailConfigured, sendOtpEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!isConfigured() || !isEmailConfigured()) {
    return NextResponse.json(
      { error: "OTP demo is not configured." },
      { status: 503 },
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
