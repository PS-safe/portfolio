import { createHash, timingSafeEqual } from "node:crypto";
import { sql } from "./db";

const CODE_LEN = 6;
const TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const RATE_LIMIT_PER_WINDOW = 3;
const RATE_LIMIT_WINDOW_MIN = 10;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(raw: string): { ok: true; email: string } | { ok: false; reason: string } {
  const email = raw.trim().toLowerCase();
  if (!email || email.length > 254) return { ok: false, reason: "Provide a valid email." };
  if (!EMAIL_RE.test(email)) return { ok: false, reason: "That doesn't look like a valid email." };
  return { ok: true, email };
}

/** Generate a numeric OTP code using a CSPRNG with rejection sampling for uniform distribution. */
export function generateCode(n: number = CODE_LEN): string {
  if (n <= 0 || n > 10) throw new Error("code length must be 1..10");
  // 256 mod 10 = 6, so we reject bytes >= 250 to keep digits uniform.
  const max = 256 - (256 % 10);
  const digits: number[] = [];
  while (digits.length < n) {
    const buf = new Uint8Array(n - digits.length + 4);
    crypto.getRandomValues(buf);
    for (const b of buf) {
      if (b >= max) continue;
      digits.push(b % 10);
      if (digits.length === n) break;
    }
  }
  return digits.join("");
}

export function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

/** Returns true if a new request should be allowed for this email. */
async function withinRateLimit(email: string): Promise<boolean> {
  const db = sql();
  const rows = (await db`
    SELECT count(*)::int AS n
      FROM otps
     WHERE email = ${email}
       AND created_at > now() - (${RATE_LIMIT_WINDOW_MIN} || ' minutes')::interval
  `) as { n: number }[];
  return rows[0].n < RATE_LIMIT_PER_WINDOW;
}

export type RequestResult =
  | { ok: true; code: string; email: string }
  | { ok: false; status: number; reason: string };

/** Create an OTP for `email`. The plaintext `code` is returned so the caller can email it. */
export async function requestOtp(emailRaw: string): Promise<RequestResult> {
  const check = validateEmail(emailRaw);
  if (!check.ok) return { ok: false, status: 400, reason: check.reason };
  const email = check.email;

  if (!(await withinRateLimit(email))) {
    return {
      ok: false,
      status: 429,
      reason: `Too many requests. Try again in ${RATE_LIMIT_WINDOW_MIN} minutes.`,
    };
  }

  const code = generateCode();
  const code_hash = hashCode(code);
  const db = sql();
  await db`
    INSERT INTO otps (email, code_hash, expires_at)
    VALUES (
      ${email},
      ${code_hash},
      now() + (${TTL_MINUTES} || ' minutes')::interval
    )
  `;
  return { ok: true, code, email };
}

export type VerifyResult =
  | { ok: true }
  | { ok: false; status: number; reason: string };

export async function verifyOtp(emailRaw: string, codeRaw: string): Promise<VerifyResult> {
  const check = validateEmail(emailRaw);
  if (!check.ok) return { ok: false, status: 400, reason: check.reason };
  const email = check.email;

  const code = codeRaw.trim();
  if (!/^\d{4,10}$/.test(code)) {
    return { ok: false, status: 400, reason: "Enter the numeric code." };
  }

  const db = sql();
  const rows = (await db`
    SELECT id, code_hash, expires_at, used_at, attempts
      FROM otps
     WHERE email = ${email}
       AND used_at IS NULL
     ORDER BY created_at DESC
     LIMIT 1
  `) as Array<{ id: number; code_hash: string; expires_at: string; used_at: string | null; attempts: number }>;

  if (rows.length === 0) {
    return { ok: false, status: 400, reason: "No active code. Request a new one." };
  }
  const row = rows[0];

  if (new Date(row.expires_at).getTime() < Date.now()) {
    return { ok: false, status: 400, reason: "Code has expired. Request a new one." };
  }

  // Atomically bump attempts. If this puts us over the cap, lock the row.
  const bumped = (await db`
    UPDATE otps
       SET attempts = attempts + 1,
           used_at  = CASE WHEN attempts + 1 >= ${MAX_ATTEMPTS} THEN now() ELSE used_at END
     WHERE id = ${row.id}
     RETURNING attempts, used_at
  `) as Array<{ attempts: number; used_at: string | null }>;

  const supplied = hashCode(code);
  const match =
    supplied.length === row.code_hash.length &&
    timingSafeEqual(Buffer.from(supplied, "hex"), Buffer.from(row.code_hash, "hex"));

  if (match) {
    await db`UPDATE otps SET used_at = now() WHERE id = ${row.id} AND used_at IS NULL`;
    return { ok: true };
  }

  if (bumped[0].used_at) {
    return { ok: false, status: 400, reason: "Too many attempts. Request a new code." };
  }
  return { ok: false, status: 400, reason: "Incorrect code." };
}
