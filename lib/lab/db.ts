import "server-only";

import { sql } from "@/lib/db";

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
