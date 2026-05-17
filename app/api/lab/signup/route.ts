import { NextResponse } from "next/server";
import {
  generateSessionToken,
  hashPassword,
  hashToken,
  newUserId,
  sessionCookieValue,
  SESSION_TTL_DAYS,
} from "@/lib/lab/auth";
import { createSession, createUser, userByEmail } from "@/lib/lab/db";
import { checkAndRecord, ipFromHeaders } from "@/lib/ratelimit";
import { isConfigured } from "@/lib/db";

export const runtime = "nodejs";

function validEmail(s: string) {
  if (!s || s.length > 254) return false;
  const at = s.indexOf("@");
  const dot = s.lastIndexOf(".");
  return at > 0 && dot > at + 1 && dot < s.length - 1;
}

export async function POST(req: Request) {
  if (!isConfigured()) {
    return NextResponse.json(
      { error: "Lab is not configured in this environment." },
      { status: 503 },
    );
  }

  // Shared rate-limit bucket with /login: 5/min/IP. An attacker can't
  // alternate endpoints to double the budget. Per PLAN §2 IN.
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
  if (!validEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  // PLAN §2 R4: 409 here leaks email-registration status (enumeration).
  // Deliberately accepted for the demo — production would route this
  // through a mailer-driven "verify or recover" email.
  const existing = await userByEmail(email);
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const userId = newUserId();
  const user = await createUser(userId, email, passwordHash);

  // Open the session immediately — no email verification in v1.
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  await createSession(hashToken(token), userId, expiresAt);

  const res = NextResponse.json(
    { id: user.id, email: user.email, created_at: user.createdAt },
    { status: 201 },
  );
  res.cookies.set(sessionCookieValue(token, expiresAt));
  return res;
}
