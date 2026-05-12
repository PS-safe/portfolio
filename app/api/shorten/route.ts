import { NextResponse } from "next/server";
import { createLink, validateTarget } from "@/lib/shortlink";
import { isConfigured } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!isConfigured()) {
    return NextResponse.json(
      { error: "Shortlink demo is not configured." },
      { status: 503 },
    );
  }

  let body: { target?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const check = validateTarget(body.target?.trim() ?? "");
  if (!check.ok) {
    return NextResponse.json({ error: check.reason }, { status: 400 });
  }

  try {
    const link = await createLink(check.url);
    return NextResponse.json({ slug: link.slug, target: link.target });
  } catch (err) {
    console.error("createLink failed", err);
    return NextResponse.json(
      { error: "Could not create shortlink. Try again." },
      { status: 500 },
    );
  }
}
