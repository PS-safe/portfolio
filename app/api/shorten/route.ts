import { NextResponse } from "next/server";

export const runtime = "nodejs";

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

function isValidUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return ALLOWED_PROTOCOLS.has(u.protocol) && !!u.host;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const apiUrl = process.env.SHORTLINK_API_URL;
  const adminToken = process.env.SHORTLINK_ADMIN_TOKEN;

  if (!apiUrl || !adminToken) {
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

  const target = body.target?.trim();
  if (!target || !isValidUrl(target)) {
    return NextResponse.json(
      { error: "Provide a valid http(s) URL." },
      { status: 400 },
    );
  }

  const upstream = await fetch(`${apiUrl}/links`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ target }),
  });

  if (!upstream.ok) {
    const text = await upstream.text();
    return NextResponse.json(
      { error: text || "Upstream error." },
      { status: upstream.status },
    );
  }

  const data = (await upstream.json()) as { slug: string; target: string };
  return NextResponse.json({ slug: data.slug, target: data.target });
}
