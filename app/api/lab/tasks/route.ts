import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { hashToken, SESSION_COOKIE_NAME } from "@/lib/lab/auth";
import { createTask, listTasks, sessionByTokenHash, type TaskStatus } from "@/lib/lab/db";
import { isConfigured } from "@/lib/db";
import { parse, type Config } from "@/lib/lab/queryhelper";

export const runtime = "nodejs";

export const TASK_CFG: Config = {
  searchableFields: ["title", "body"],
  filterableFields: ["status"],
  orderableFields: ["created_at", "title", "status"],
  defaultPageSize: 8,
  maxPageSize: 50,
  defaultOrder: [{ field: "created_at", desc: true }],
};

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

export async function GET(req: Request) {
  if (!isConfigured()) {
    return NextResponse.json({ error: "Lab is not configured." }, { status: 503 });
  }
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const parsed = parse(url.searchParams, TASK_CFG);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const page = await listTasks(userId, parsed.spec, TASK_CFG);
  return NextResponse.json(page);
}

export async function POST(req: Request) {
  if (!isConfigured()) {
    return NextResponse.json({ error: "Lab is not configured." }, { status: 503 });
  }
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { title?: unknown; body?: unknown; status?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (title.length < 1 || title.length > 200) {
    return NextResponse.json({ error: "Title must be 1–200 characters." }, { status: 400 });
  }

  let taskBody: string | null = null;
  if (body.body !== undefined && body.body !== null) {
    if (typeof body.body !== "string") {
      return NextResponse.json({ error: "Body must be a string." }, { status: 400 });
    }
    if (body.body.length > 2000) {
      return NextResponse.json({ error: "Body must be 2000 characters or fewer." }, { status: 400 });
    }
    taskBody = body.body;
  }

  const status: TaskStatus = isStatus(body.status) ? body.status : "active";

  const task = await createTask("t_" + randomUUID().replace(/-/g, ""), userId, {
    title,
    body: taskBody,
    status,
  });
  return NextResponse.json(task, { status: 201 });
}
