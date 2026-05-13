import { sql } from "./db";
import { validateExternalUrl, type UrlValidationResult } from "./url-validation";

const ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const SLUG_LEN = 7;

/** Generate a URL-safe slug using crypto.getRandomValues with rejection sampling. */
export function generateSlug(n: number = SLUG_LEN): string {
  if (n <= 0) throw new Error("slug length must be > 0");
  const max = 256 - (256 % ALPHABET.length);
  const out = new Array<string>(n);
  let pos = 0;
  while (pos < n) {
    const buf = new Uint8Array(n - pos + Math.ceil((n - pos) / 4) + 1);
    crypto.getRandomValues(buf);
    for (const b of buf) {
      if (b >= max) continue;
      out[pos++] = ALPHABET[b % ALPHABET.length];
      if (pos === n) break;
    }
  }
  return out.join("");
}

export function validateTarget(raw: string): UrlValidationResult {
  return validateExternalUrl(raw);
}

export type Link = {
  slug: string;
  target: string;
  created_at: string;
  click_count: number;
  last_clicked_at: string | null;
};

/** Insert a new link with a random slug. Retries on the rare slug collision. */
export async function createLink(target: string): Promise<Link> {
  const db = sql();
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = generateSlug();
    try {
      const rows = (await db`
        INSERT INTO links (slug, target)
        VALUES (${slug}, ${target})
        RETURNING slug, target, created_at, click_count, last_clicked_at
      `) as Link[];
      return rows[0];
    } catch (err: unknown) {
      if (isUniqueViolation(err)) continue;
      throw err;
    }
  }
  throw new Error("could not generate a unique slug after 5 attempts");
}

/** Resolve a slug to its target and atomically increment click_count. */
export async function resolveSlug(slug: string): Promise<string | null> {
  const db = sql();
  const rows = (await db`
    UPDATE links
       SET click_count = click_count + 1,
           last_clicked_at = now()
     WHERE slug = ${slug}
     RETURNING target
  `) as { target: string }[];
  return rows.length === 0 ? null : rows[0].target;
}

function isUniqueViolation(err: unknown): boolean {
  if (err && typeof err === "object" && "code" in err) {
    return (err as { code?: string }).code === "23505";
  }
  return false;
}
