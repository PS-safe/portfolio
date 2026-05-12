import { NextResponse } from "next/server";
import { verifyOtp } from "@/lib/otp";
import { isConfigured } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!isConfigured()) {
    return NextResponse.json(
      { error: "OTP demo is not configured." },
      { status: 503 },
    );
  }

  let body: { email?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const result = await verifyOtp(body.email?.trim() ?? "", body.code?.trim() ?? "");
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: result.status });
  }
  return NextResponse.json({ verified: true });
}
