import "server-only";

import { randomBytes, createHash, randomUUID } from "node:crypto";
import { hash as argonHash, verify as argonVerify } from "@node-rs/argon2";

export const SESSION_COOKIE_NAME = "lab_session";
export const SESSION_TTL_DAYS = 7;

/** Argon2id with parameters matched to the PS-safe/auth Go library
 *  (m=64MiB, t=3, p=2). Per PLAN R3 these are deliberately not relaxed —
 *  the cold-start UX cost is accepted in exchange for security parity.
 *  The algorithm field is omitted on purpose: @node-rs/argon2 exposes it
 *  as a const enum which `isolatedModules` (Next default) forbids
 *  cross-module access to. Argon2id is the package default. */
const ARGON_OPTS = {
  memoryCost: 64 * 1024,
  timeCost: 3,
  parallelism: 2,
} as const;

export async function hashPassword(plaintext: string): Promise<string> {
  return argonHash(plaintext, ARGON_OPTS);
}

export async function verifyPassword(plaintext: string, encoded: string): Promise<boolean> {
  try {
    return await argonVerify(encoded, plaintext);
  } catch {
    // Malformed hash, wrong algorithm, etc. — treat as "no match" so a
    // caller can't distinguish "wrong password" from "bad hash record".
    return false;
  }
}

/** generateSessionToken returns a fresh URL-safe random token (32 bytes
 *  → 256 bits of entropy). The raw token leaves the server exactly once,
 *  in the Set-Cookie header; only sha256(token) is persisted. */
export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function newUserId(): string {
  return "u_" + randomUUID().replace(/-/g, "");
}

export function sessionCookieValue(token: string, expiresAt: Date) {
  return {
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt,
  };
}

export function clearedSessionCookie() {
  return {
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    path: "/",
    expires: new Date(0),
    maxAge: 0,
  };
}
