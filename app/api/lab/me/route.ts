import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { hashToken, SESSION_COOKIE_NAME } from "@/lib/lab/auth";
import { sessionByTokenHash } from "@/lib/lab/db";
import { isConfigured } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  if (!isConfigured()) {
    return NextResponse.json({ error: "Lab is not configured." }, { status: 503 });
  }
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ user: null });

  const found = await sessionByTokenHash(hashToken(token));
  if (!found) return NextResponse.json({ user: null });

  return NextResponse.json({
    user: {
      id: found.user.id,
      email: found.user.email,
      created_at: found.user.createdAt,
    },
  });
}
