# /lab/task-board — project context for Claude Code

A small full-stack demo at `/lab/task-board` inside this portfolio (one
demo within the `/lab` portal). Composes `PS-safe/auth` (auth + sessions)
and `PS-safe/queryhelper` (the dashboard) into a one-screen product.
`PS-safe/mailer` is deferred — v1 has no email step.

See `app/lab/task-board/PLAN.md` for the full locked plan. This file is
the short operational rule sheet that travels with the directory.

> **CWD note (Risk R7).** This file is loaded by Claude Code when CWD
> is inside `app/lab/task-board/` or any descendant. Before starting work
> on this demo, `cd app/lab/task-board` so these rules actually apply. If
> discipline drifts twice in a row, fall back to amending the portfolio's
> root CLAUDE.md.

## Non-negotiables

- **Scope** is `PLAN.md` §2. New feature ideas fit the IN list or they
  wait for v2 — no "while we're at it."
- **Visual language** is `PLAN.md` §5:
  - NO ambient orbs on `/lab`
  - NO `<HeroSpotlight>` on the dashboard (auth-panel hero only)
  - NO `<TiltCard>` anywhere in `/lab` — tables are not toys
  - Denser surface than the rest of the portfolio (12px row gutters,
    `py-8`–`py-12` page padding)
  - Status chips: accent (active), amber (pending), muted (archived);
    color is never the sole signal — pair with a text label and dot
- **State** is URL-driven for filter/search/sort/page on the dashboard.
  No state-management library. Mutations use optimistic UI with
  rollback on error. URL changes go through `router.replace`, not
  `router.push` (no back-button noise per filter change).
- **Auth** is real: Argon2id passwords via `@node-rs/argon2`, opaque
  session tokens, `sha256(token)` persisted, `HttpOnly Secure
  SameSite=Lax Path=/` cookies. Never put passwords or tokens in
  `localStorage`.
- **A11y floor** is `PLAN.md` §5: Lighthouse Accessibility ≥ 90 and
  Performance ≥ 90 before merge. Manual keyboard-only nav +
  screen-reader spot-check before push.

## File layout

```
app/lab/
  page.tsx            portal index — grid of LabCard from getLabDemos()
app/lab/task-board/
  page.tsx            Server Component — reads cookie + searchParams,
                      decides auth-panel vs dashboard
  CLAUDE.md           this file
  PLAN.md             locked plan (do not edit without recording the
                      amendment at the bottom of the file)
  schema.sql          one-shot Neon migration (run via Neon SQL Editor
                      or psql; idempotent)

app/api/lab/          8 route files: signup/login/logout/me + tasks CRUD
lib/lab/              auth helpers, db helpers, TS port of queryhelper
components/lab/       net-new UI per PLAN.md §7
```

Shared portfolio assets — theme tokens, focus ring, scrollbar, site
nav, lucide icons, Neon (`lib/db.ts`) + ratelimit (`lib/ratelimit.ts`)
helpers — are reused as-is. Don't re-implement them under `lib/lab/`.

## Workflow (mirrors PLAN §8)

- **Before** writing a feature subtree, consult one of the matching
  `senior-*-skill` agents from §8 with a 2–3 line ask. Most subtrees
  touch one agent; the auth panel and dashboard each touch two.
- **After** writing a feature subtree, run `/simplify` on the touched
  files.
- **Before push**, for anything in `app/api/lab/*` that touches auth or
  cookies, run `/security-review` against the diff.
- **At session close**, the Stop hook in `.claude/settings.local.json`
  runs `pnpm build` automatically. Address any failure before
  re-opening Claude.

## Don't

- Don't add npm dependencies without justifying them in the commit
  message. Zero-new-dep is the bar where reasonable.
- Don't introduce a state-management library (TanStack Query, Zustand,
  Jotai). URL + `useState` is enough for v1.
- Don't auto-seed demo tasks on signup — fresh accounts land on the
  empty state on purpose (PLAN §2 IN).
- Don't use Framer Motion. CSS-only animations,
  `prefers-reduced-motion` respected. Existing portfolio convention.
- Don't reach into other research libraries' source under
  `~/Desktop/Research/{auth,queryhelper,mailer,...}`. Use them as the
  documented public API; this is the compose story, not a refactor.
- Don't relax the Argon2 parameters (m=64 MiB, t=3, p=2) — PLAN §2 R3
  explicitly accepted the cold-start cost in exchange for matching the
  PS-safe/auth security posture.
