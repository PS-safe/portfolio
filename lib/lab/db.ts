import "server-only";

import { sql } from "@/lib/db";
import type { Config, Page, Spec } from "./queryhelper";

export type LabUser = {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
};

export type LabSession = {
  tokenHash: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
};

export async function createUser(
  id: string,
  email: string,
  passwordHash: string,
): Promise<LabUser> {
  const db = sql();
  const rows = (await db`
    INSERT INTO lab_users (id, email, password_hash)
    VALUES (${id}, ${email}, ${passwordHash})
    RETURNING id, email, password_hash, created_at
  `) as Array<{ id: string; email: string; password_hash: string; created_at: string }>;
  const u = rows[0];
  return { id: u.id, email: u.email, passwordHash: u.password_hash, createdAt: u.created_at };
}

export async function userByEmail(email: string): Promise<LabUser | null> {
  const db = sql();
  const rows = (await db`
    SELECT id, email, password_hash, created_at
      FROM lab_users WHERE lower(email) = lower(${email})
  `) as Array<{ id: string; email: string; password_hash: string; created_at: string }>;
  if (rows.length === 0) return null;
  const u = rows[0];
  return { id: u.id, email: u.email, passwordHash: u.password_hash, createdAt: u.created_at };
}

export async function createSession(
  tokenHash: string,
  userId: string,
  expiresAt: Date,
): Promise<void> {
  const db = sql();
  await db`
    INSERT INTO lab_sessions (token_hash, user_id, expires_at)
    VALUES (${tokenHash}, ${userId}, ${expiresAt.toISOString()})
  `;
}

/** sessionByTokenHash resolves a session + its user in one round trip
 *  and rejects expired tokens at the DB level. A sweeper job can clean
 *  expired rows later (PLAN R5); this just avoids leaking them. */
export async function sessionByTokenHash(
  tokenHash: string,
): Promise<{ session: LabSession; user: LabUser } | null> {
  const db = sql();
  const rows = (await db`
    SELECT s.token_hash, s.user_id, s.expires_at, s.created_at AS s_created,
           u.id AS u_id, u.email, u.password_hash, u.created_at AS u_created
      FROM lab_sessions s JOIN lab_users u ON u.id = s.user_id
     WHERE s.token_hash = ${tokenHash}
       AND s.expires_at > now()
  `) as Array<{
    token_hash: string;
    user_id: string;
    expires_at: string;
    s_created: string;
    u_id: string;
    email: string;
    password_hash: string;
    u_created: string;
  }>;
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    session: {
      tokenHash: r.token_hash,
      userId: r.user_id,
      expiresAt: r.expires_at,
      createdAt: r.s_created,
    },
    user: {
      id: r.u_id,
      email: r.email,
      passwordHash: r.password_hash,
      createdAt: r.u_created,
    },
  };
}

export async function deleteSession(tokenHash: string): Promise<void> {
  const db = sql();
  await db`DELETE FROM lab_sessions WHERE token_hash = ${tokenHash}`;
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

export type TaskStatus = "active" | "pending" | "archived";

export type LabTask = {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
};

export async function createTask(
  id: string,
  userId: string,
  input: { title: string; body: string | null; status: TaskStatus },
): Promise<LabTask> {
  const db = sql();
  const rows = (await db`
    INSERT INTO lab_tasks (id, user_id, title, body, status)
    VALUES (${id}, ${userId}, ${input.title}, ${input.body}, ${input.status})
    RETURNING id, user_id, title, body, status, created_at, updated_at
  `) as LabTask[];
  return rows[0];
}

export async function getTaskOwnedBy(taskId: string, userId: string): Promise<LabTask | null> {
  const db = sql();
  const rows = (await db`
    SELECT id, user_id, title, body, status, created_at, updated_at
      FROM lab_tasks WHERE id = ${taskId} AND user_id = ${userId}
  `) as LabTask[];
  return rows[0] ?? null;
}

export async function updateTask(
  taskId: string,
  userId: string,
  patch: { title?: string; body?: string | null; status?: TaskStatus },
): Promise<LabTask | null> {
  const db = sql();
  // COALESCE keeps existing values when the patch omits a field; that lets
  // us run one SQL statement regardless of which subset of fields changed.
  // Authorization check is in the WHERE — a foreign user gets 0 rows back.
  const rows = (await db`
    UPDATE lab_tasks
       SET title      = COALESCE(${patch.title ?? null}, title),
           body       = CASE WHEN ${patch.body !== undefined} THEN ${patch.body ?? null} ELSE body END,
           status     = COALESCE(${patch.status ?? null}, status),
           updated_at = now()
     WHERE id = ${taskId} AND user_id = ${userId}
     RETURNING id, user_id, title, body, status, created_at, updated_at
  `) as LabTask[];
  return rows[0] ?? null;
}

export async function deleteTask(taskId: string, userId: string): Promise<boolean> {
  const db = sql();
  // pgClientResult shape from neon-serverless includes rowCount; we cast
  // because the @neondatabase/serverless tag-template return type is
  // structural and erases the count for SELECTs. DELETE always returns
  // a meaningful rowCount.
  const result = (await db`
    DELETE FROM lab_tasks WHERE id = ${taskId} AND user_id = ${userId}
  `) as { length?: number };
  return (result.length ?? 0) > 0;
}

/** listTasks runs a queryhelper Spec against lab_tasks for one user. Field
 *  names in spec are guaranteed allowlisted by parse() upstream, so it's
 *  safe to interpolate them; values always go through parameterized binding.
 */
export async function listTasks(
  userId: string,
  spec: Spec,
  cfg: Config,
): Promise<Page<LabTask>> {
  const db = sql();

  const params: unknown[] = [userId];
  const where: string[] = [`user_id = $1`];

  for (const [field, vals] of Object.entries(spec.filters)) {
    if (vals.length === 0) continue;
    const placeholders = vals.map((_, i) => `$${params.length + i + 1}`).join(", ");
    params.push(...vals);
    where.push(`${field} IN (${placeholders})`);
  }

  if (spec.search && cfg.searchableFields.length > 0) {
    const like = `%${spec.search.toLowerCase()}%`;
    const orClauses = cfg.searchableFields.map((f) => {
      params.push(like);
      return `lower(${f}) LIKE $${params.length}`;
    });
    where.push(`(${orClauses.join(" OR ")})`);
  }

  const whereSql = `WHERE ${where.join(" AND ")}`;

  const countRows = (await db.query(
    `SELECT count(*)::int AS n FROM lab_tasks ${whereSql}`,
    params,
  )) as Array<{ n: number }>;
  const total = countRows[0]?.n ?? 0;

  const orderSql = spec.order.length
    ? `ORDER BY ${spec.order.map((o) => `${o.field} ${o.desc ? "DESC" : "ASC"}`).join(", ")}`
    : "";

  const limitIdx = params.length + 1;
  const offsetIdx = params.length + 2;
  params.push(spec.pageSize, (spec.page - 1) * spec.pageSize);

  const rows = (await db.query(
    `SELECT id, user_id, title, body, status, created_at, updated_at
       FROM lab_tasks
       ${whereSql}
       ${orderSql}
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    params,
  )) as LabTask[];

  return {
    items: rows,
    total,
    page: spec.page,
    pageSize: spec.pageSize,
    totalPages: spec.pageSize > 0 ? Math.ceil(total / spec.pageSize) : 0,
  };
}
