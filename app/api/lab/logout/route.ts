import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { clearedSessionCookie, hashToken, SESSION_COOKIE_NAME } from "@/lib/lab/auth";
import { deleteSession } from "@/lib/lab/db";
import { isConfigured } from "@/lib/db";

export const runtime = "nodejs";

export async function POST() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE_NAME)?.value;
  if (token && isConfigured()) {
    // Best-effort delete — even if it fails (network blip), the cookie
    // is cleared below so the client is signed out. The server-side
    // row will be swept eventually by the demo-data cleanup (PLAN R5).
    await deleteSession(hashToken(token));
  }
  const res = new NextResponse(null, { status: 204 });
  res.cookies.set(clearedSessionCookie());
  return res;
}
