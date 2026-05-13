// Shared URL validation for any feature that accepts a user-supplied target
// (shortlink redirect, webhookd dispatch, future things).
//
// Goal: reject anything that could be used to reach an internal network or
// cloud metadata service, while keeping the check cheap enough to run on every
// request without DNS resolution.
//
// Notes:
// - DNS-resolved IP recheck is the only complete defense and is on the
//   webhookd roadmap. This is a strong best-effort guard at the boundary.
// - IPv4-mapped IPv6 (::ffff:127.0.0.1) and bracketed IPv6 forms are normalized
//   away by `URL.hostname`, which lowercases and strips brackets.

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "0.0.0.0",
]);

const PRIVATE_NET_PATTERNS = [
  // IPv4 private
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  // IPv4 link-local (incl. cloud metadata 169.254.169.254)
  /^169\.254\./,
  // IPv4 loopback range
  /^127\./,
  // CGNAT 100.64.0.0/10
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
  // IPv6 link-local: fe80::/10 → fe80..febf prefix
  /^fe[89ab][0-9a-f]*:/i,
  // IPv6 unique local: fc00::/7 → fc.. or fd..
  /^f[cd][0-9a-f]{2}:/i,
  // IPv4-mapped loopback / private in IPv6 form
  /^::ffff:127\./i,
  /^::ffff:10\./i,
  /^::ffff:192\.168\./i,
  /^::ffff:172\.(1[6-9]|2[0-9]|3[0-1])\./i,
  /^::ffff:169\.254\./i,
];

const MAX_URL_LEN = 2048;

export type ValidUrl = { ok: true; url: string };
export type InvalidUrl = { ok: false; reason: string };
export type UrlValidationResult = ValidUrl | InvalidUrl;

/**
 * Validate a URL we'd reach over the network OR redirect a browser to.
 * Rejects internal/private addresses, non-http(s) schemes, and oversized inputs.
 */
export function validateExternalUrl(raw: string): UrlValidationResult {
  if (!raw || raw.length > MAX_URL_LEN) {
    return { ok: false, reason: `Provide a URL (max ${MAX_URL_LEN} chars).` };
  }
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return { ok: false, reason: "Not a valid URL." };
  }
  if (!ALLOWED_PROTOCOLS.has(u.protocol)) {
    return { ok: false, reason: "Only http and https are allowed." };
  }
  if (!u.host) {
    return { ok: false, reason: "URL is missing a host." };
  }
  const host = u.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(host)) {
    return { ok: false, reason: "Internal hosts are not allowed." };
  }
  if (PRIVATE_NET_PATTERNS.some((re) => re.test(host))) {
    return { ok: false, reason: "Private/internal network targets are not allowed." };
  }
  return { ok: true, url: u.toString() };
}
