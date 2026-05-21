# /lab/pathfinder — project context for Claude Code

A pathfinding visualizer at `/lab/pathfinder` (a demo within the `/lab`
portal). Built to evidence **frontend craft** (60fps animation, render-perf
discipline, a keyboard-accessible grid) and **logical thinking** (graph
search, admissible heuristics, a hand-rolled min-heap) — the gap the backend
libraries and `/lab/task-board` don't cover.

See `app/lab/pathfinder/PLAN.md` for the locked 10-section plan. This file is
the short rule sheet that travels with the directory.

> **CWD note.** This file loads when CWD is inside `app/lab/pathfinder/`.
> `cd app/lab/pathfinder` before working so these rules apply.

## Non-negotiables

- **Compute / replay separation.** Algorithms are pure, DOM-free functions in
  `lib/lab/pathfinder/` that return a `Trace`. They never touch the DOM, a
  timer, or randomness (maze gen takes an explicit seed). The UI's player
  replays the trace; the tests assert on it. Never animate from inside an
  algorithm.
- **No per-cell React state in the animation hot path.** Replay mutates cell
  DOM via refs / `className` / `dataset`. React owns the grid's structure, not
  its per-frame paint. A 1,500-cell `setState` per tick is the failure mode
  (PLAN R1).
- **Keyboard-first.** Roving tabindex — one tab stop for the grid, arrows move
  the active cell, Enter/Space toggles a wall, `S`/`E` place start/end. An
  `aria-live` region announces the result.
- **Reduced motion.** `prefers-reduced-motion: reduce` → no per-cell
  transition, instant fill; the player may jump straight to done.
- **Admissible heuristics.** Manhattan for 4-dir, octile for 8-dir; the switch
  lives in `heuristicFor`. A test pins A* cost == Dijkstra cost — don't break
  it.
- **Pointer Events only** for drawing (one path for mouse/touch/pen).

## File layout

```
app/lab/pathfinder/
  page.tsx            route shell + metadata + breadcrumb/writeup link
  PLAN.md             locked plan (amend at the bottom; no silent §1-§10 edits)
  CLAUDE.md           this file
lib/lab/pathfinder/   pure logic — types, grid, heap, heuristics, algorithms,
                      maze, player (+ *.test.ts, run by Vitest)
components/lab/pathfinder/  UI — pathfinder, grid, toolbar, transport, stats,
                      legend
```

Shared portfolio assets (theme tokens, focus ring, site nav, lucide icons,
`.reveal`) are reused as-is.

## Workflow

- **Before** a subtree, consult the matching `senior-*-skill` agent (PLAN §8)
  with a 2-3 line ask.
- **After** a subtree, run `/simplify` on the touched files.
- `pnpm test` (Vitest) must stay green; `pnpm build` (Stop hook) must pass.
- A11y floor before merge: Lighthouse Accessibility ≥ 90, Performance ≥ 90;
  manual keyboard-only pass.

## Don't

- Don't add npm deps beyond the approved Vitest (dev-only) without justifying
  in the commit. No animation library (CSS only), no state-management library
  (local state + refs + URL config is enough).
- Don't put grid state in the URL — only config (algorithm, speed, diagonal).
  A 1,500-cell grid does not belong in a query string.
- Don't let an algorithm import anything from `components/` or touch the DOM.
- Don't switch the render layer to canvas without updating PLAN R3 first — the
  DOM choice is deliberate (a11y + theming); canvas is the documented fallback,
  not a casual swap.
