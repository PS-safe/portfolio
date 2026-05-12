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

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Neon Postgres pooled DSN, e.g. `postgres://user:pass@…neon.tech/db?sslmode=require` |

If unset, the "Try it" form returns 503 gracefully; everything else still works.

Schema is in `PS-safe/shortlink/migrations/001_init.sql` (single `links` table). Run it once against your Neon database via the Neon SQL Editor.

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
