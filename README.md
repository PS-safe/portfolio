# portfolio

Personal portfolio site — research-mode hub for things I build.

**Live:** *(deploy URL goes here after first Vercel deploy)*

## Stack

- Next.js 16 (App Router)
- TypeScript (strict)
- Tailwind CSS v4
- next-themes (light/dark)
- MDX via `next-mdx-remote/rsc`
- Deployed on Vercel

## Local dev

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000.

## Adding a project

1. Create `content/projects/<slug>.mdx`.
2. Frontmatter required:
   ```yaml
   ---
   title: My Project
   slug: my-project
   summary: One-line pitch.
   year: 2026
   tech: [Go, Postgres]
   repo: https://github.com/PS-safe/my-project
   status: active        # active | stable | experimental | archived
   destination: [portable, personal]   # optional
   featured: true        # optional — surfaces on homepage
   order: 1              # optional — sorts featured ahead of year-desc
   ---
   ```
3. Body is plain MDX. Push to main; Vercel auto-deploys.

## Environment variables

The shortlink demo on `/projects/shortlink` reads and writes directly to Neon Postgres. Set this in Vercel → Project → Settings → Environment Variables:

| Variable | Used by | Purpose |
|---|---|---|
| `DATABASE_URL` | shortlink, otp | Neon Postgres pooled DSN, e.g. `postgres://user:pass@…neon.tech/db?sslmode=require` |
| `BREVO_API_KEY` | otp | Brevo (free 300/day) API key for sending verification emails |
| `OTP_FROM_EMAIL` | otp | Verified sender email in Brevo (e.g. your Gmail) |
| `OTP_FROM_NAME` | otp | Display name on the From: header |

If a var is missing, the related "Try it" form returns 503 gracefully; everything else still works.

Schemas:
- `links` table — `PS-safe/shortlink/migrations/001_init.sql`
- `otps` table — see below (apply once in Neon SQL Editor):

```sql
CREATE TABLE IF NOT EXISTS otps (
    id            BIGSERIAL   PRIMARY KEY,
    email         TEXT        NOT NULL,
    code_hash     TEXT        NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at    TIMESTAMPTZ NOT NULL,
    used_at       TIMESTAMPTZ,
    attempts      INT         NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_otps_email_created ON otps (email, created_at DESC);
```

## Layout

```
app/                 # routes (home, about, projects, projects/[slug], contact)
components/          # nav, footer, theme toggle, project card, MDX renderer
content/
  about.mdx
  projects/*.mdx     # one file per project
lib/
  projects.ts        # MDX content loader
  about.ts
  cn.ts
```

## License

MIT
