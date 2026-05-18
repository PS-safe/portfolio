import type { NextConfig } from "next";

// Reasonable starting CSP. `unsafe-inline` on script-src is needed for
// next-themes' anti-FOUC inline script; `unsafe-eval` keeps Next's runtime
// bootstrapping happy. Tighten with nonces if/when the site stops embedding
// inline runtime config.
// vercel.live entries cover Vercel's preview-deployment feedback widget
// (loads only on *.vercel.app previews, not on production). Without these
// the Lighthouse "inspector-issues" audit flags a CSP violation on
// previews. Production traffic doesn't ship the widget so the wider
// allowance is preview-only by effect.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live",
  "style-src 'self' 'unsafe-inline' https://vercel.live",
  "img-src 'self' data: https:",
  "font-src 'self' data: https://vercel.live",
  "connect-src 'self' https://vercel.live wss://ws-us3.pusher.com",
  "frame-src https://vercel.live",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
