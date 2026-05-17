import { NextResponse } from "next/server";
import {
  generateSessionToken,
  hashToken,
  sessionCookieValue,
  SESSION_TTL_DAYS,
  verifyPassword,
} from "@/lib/lab/auth";
import { createSession, userByEmail } from "@/lib/lab/db";
import { checkAndRecord, ipFromHeaders } from "@/lib/ratelimit";
import { isConfigured } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!isConfigured()) {
    return NextResponse.json(
      { error: "Lab is not configured in this environment." },
      { status: 503 },
    );
  }

  const ip = ipFromHeaders(req.headers);
  const limit = await checkAndRecord(ip, "demo:lab:credentials", 5, 60);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${limit.retryAfterSeconds}s.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  const user = await userByEmail(email);
  // Generic 401 — same response for "unknown email" vs "wrong password".
  // Anti-enumeration on the LOGIN endpoint (the signup endpoint
  // deliberately accepts enumeration per PLAN R4).
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  await createSession(hashToken(token), user.id, expiresAt);

  const res = NextResponse.json({ id: user.id, email: user.email, created_at: user.createdAt });
  res.cookies.set(sessionCookieValue(token, expiresAt));
  return res;
}
