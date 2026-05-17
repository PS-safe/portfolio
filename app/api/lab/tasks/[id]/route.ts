import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { hashToken, SESSION_COOKIE_NAME } from "@/lib/lab/auth";
import { deleteTask, sessionByTokenHash, updateTask, type TaskStatus } from "@/lib/lab/db";
import { isConfigured } from "@/lib/db";

export const runtime = "nodejs";

const STATUSES: ReadonlyArray<TaskStatus> = ["active", "pending", "archived"];

function isStatus(v: unknown): v is TaskStatus {
  return typeof v === "string" && (STATUSES as readonly string[]).includes(v);
}

async function currentUserId(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const found = await sessionByTokenHash(hashToken(token));
  return found?.user.id ?? null;
}

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  if (!isConfigured()) {
    return NextResponse.json({ error: "Lab is not configured." }, { status: 503 });
  }
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  let body: { title?: unknown; body?: unknown; status?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const patch: { title?: string; body?: string | null; status?: TaskStatus } = {};

  if (body.title !== undefined) {
    if (typeof body.title !== "string") {
      return NextResponse.json({ error: "Title must be a string." }, { status: 400 });
    }
    const trimmed = body.title.trim();
    if (trimmed.length < 1 || trimmed.length > 200) {
      return NextResponse.json({ error: "Title must be 1–200 characters." }, { status: 400 });
    }
    patch.title = trimmed;
  }

  if (body.body !== undefined) {
    if (body.body === null) {
      patch.body = null;
    } else if (typeof body.body === "string") {
      if (body.body.length > 2000) {
        return NextResponse.json({ error: "Body must be 2000 characters or fewer." }, { status: 400 });
      }
      patch.body = body.body;
    } else {
      return NextResponse.json({ error: "Body must be a string or null." }, { status: 400 });
    }
  }

  if (body.status !== undefined) {
    if (!isStatus(body.status)) {
      return NextResponse.json({ error: "Status must be one of active/pending/archived." }, { status: 400 });
    }
    patch.status = body.status;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No fields to update." }, { status: 400 });
  }

  // 404 (not 403) on foreign IDs — anti-enumeration per PLAN §6.
  const updated = await updateTask(id, userId, patch);
  if (!updated) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  if (!isConfigured()) {
    return NextResponse.json({ error: "Lab is not configured." }, { status: 503 });
  }
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const ok = await deleteTask(id, userId);
  if (!ok) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}
