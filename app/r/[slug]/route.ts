import { NextResponse } from "next/server";
import { resolveSlug } from "@/lib/shortlink";
import { isConfigured } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function GET(_req: Request, { params }: { params: Params }) {
  const { slug } = await params;

  if (!isConfigured()) {
    return new NextResponse("Shortlink demo is not configured.", { status: 503 });
  }

  try {
    const target = await resolveSlug(slug);
    if (!target) {
      return new NextResponse("Not found.", { status: 404 });
    }
    return NextResponse.redirect(target, 302);
  } catch (err) {
    console.error("resolveSlug failed", err);
    return new NextResponse("Internal error.", { status: 500 });
  }
}
