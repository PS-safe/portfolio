# /lab/pathfinder — planning doc

Status: **LOCKED 2026-05-21.** Sign-off confirmed the three open decisions:
DOM + ref-based animation (R3), weights IN (§2), Vitest dev-only (§9).
Amendments at the bottom; no silent edits to §1–§10. Mirrors the ritual used
for `/lab/task-board`.

The second demo in the `/lab` portal. Where `task-board` proves full-stack
composition, this one is built to prove the two things the backend libraries
and `task-board` do **not** evidence: **frontend craft** (60fps animation,
render-perf discipline, a keyboard-accessible interactive surface) and
**logical thinking** (graph search, heuristics, hand-rolled data structures).

Pure client. No DB, no API routes, no env. Builds static; zero deploy
friction.

---

## 1. Audience + success criterion

**Audience:** the same senior-engineer / hiring-manager / CTO reading the
portfolio. This demo targets the reviewer who has seen the Go libraries
(backend depth) and `task-board` (composition) and is still asking *"but can
they actually build a polished, performant frontend, and do they understand
algorithms below the framework?"*

**Success criterion:** the reviewer walks away thinking *"this person
implemented graph search from scratch — with a real priority queue and an
admissible heuristic — and wrapped it in a UI that animates at 60fps, works
end-to-end from the keyboard, and degrades correctly for reduced motion. No
library did the hard part for them."*

Concrete, falsifiable targets:
- A* visibly **beelines** toward the goal while BFS **floods** uniformly — the
  difference is obvious at a glance, and the stats panel quantifies it.
- 60fps replay on a 30×50 grid (1,500 cells). No dropped frames during the
  visited-cell sweep.
- The whole demo is operable with the keyboard only; Lighthouse a11y ≥ 90.
- The algorithm core is a set of **pure functions with unit tests** — the
  correctness story is provable, not asserted.

---

## 2. Scope lock — v1 IN / OUT

### IN
- **Grid.** Responsive; fills its container at a fixed cell size (~24px),
  recomputing rows×cols on resize. Capped at ~2,000 cells to keep the DOM
  substrate viable (see §5/R3). Flat-array model, index = `r*cols + c`.
- **Cell roles:** empty, wall, start, end, **weight** (cost > 1). Plus
  transient *render* states emitted by replay: open (frontier), closed
  (visited), path.
- **Editing:** click/drag to paint walls; drag start/end to relocate; a brush
  selector (wall / weight / erase); clear-walls and clear-path. Pointer
  Events (mouse + touch + pen, one code path).
- **Algorithms:** BFS, Dijkstra, A\* as the load-bearing trio (unweighted →
  weighted → heuristic). DFS and Greedy Best-First included to contrast
  (cheap once the engine exists). Diagonal-movement toggle (switches the
  neighbour set and the A\* heuristic).
- **Weights are load-bearing, not decoration.** Without weighted cells,
  Dijkstra ≡ BFS and A\*+Manhattan is just a faster BFS — the algorithm story
  collapses. So a weight brush is IN: weighted cells cost 5; Dijkstra/A\*
  honour cost, BFS ignores it (and the UI says so).
- **Maze generation:** recursive backtracker (one click → a solvable maze),
  seeded RNG for reproducibility.
- **Trace / replay engine (the centerpiece).** Algorithms run *synchronously*
  and emit an ordered **trace**; a separate **player** replays it via
  `requestAnimationFrame` with play / pause / speed / step-forward / **scrub**.
  Compute and animation are fully decoupled.
- **Stats panel:** visited count, path length, path cost, compute time (µs).
  This is what makes the algorithm differences legible and quantitative.
- **Accessibility:** roving-tabindex grid (one tab stop; arrows move; Enter/
  Space toggles wall; `S`/`E` place start/end), `aria-live` result
  announcement ("path found, 38 steps" / "no path"), visible focus,
  `prefers-reduced-motion` (instant fill, no per-cell transition), and
  color-is-never-the-only-signal (start/end carry icons, path cells carry a
  distinct shape, weights carry a glyph + number, always-visible legend).
- **URL holds config** (algorithm, speed, diagonal) for shareability. The grid
  itself is local state — a 1,500-cell grid does not belong in the URL.
- **Writeup** `content/projects/pathfinder.mdx` + portal card with `proves:`.

### OUT (→ v2 backlog)
- Side-by-side **compare mode** (two algorithms racing the same grid).
- **URL-encoded shareable grid** (compressed wall/weight bitmap).
- More maze algorithms (Prim's, recursive division); random weight fields.
- Bidirectional search, Jump Point Search, swarm/convergent variants.
- Save/load named grids to `localStorage`.
- Mobile drawing polish beyond basic tap/drag.

### Build order (milestones)
- **M1 — pure logic, no UI.** types, grid, min-heap, heuristics, the five
  algorithms, maze gen. Unit-tested in isolation. *Provable before a single
  pixel renders.*
- **M2 — static grid + editing.** render, pointer painting, start/end drag,
  roving-tabindex keyboard model.
- **M3 — replay.** player + transport (play/pause/speed/step/scrub) + stats,
  driven by the M1 traces; ref-based cell updates (R1).
- **M4 — finish.** toolbar wiring, URL config, legend, reduced-motion path,
  Lighthouse pass, writeup MDX + portal card.

---

## 3. Reference / inspiration board

Clean-room from public references (consistent with the research-mode habit;
no work IP touches this anyway).
- **Clement Mihailescu — Pathfinding Visualizer** — the canonical inspiration
  for the *shape*. What I do differently and call out in the writeup: the
  compute/replay **separation**, a **scrubber** (not just play), the **stats**
  panel, real **keyboard a11y**, and a tested pure core.
- **Amit Patel — Red Blob Games** ("Introduction to A\*", "Heuristics") — the
  correctness source for A\*, Dijkstra, and admissible heuristics.
- **MDN** — Pointer Events, `requestAnimationFrame`, the roving-tabindex
  pattern, `prefers-reduced-motion`, ARIA `grid`/`live` roles.

---

## 4. Information architecture

Single route `/lab/pathfinder` (static; renders a client app).

Layout (desktop): header (·Lab / Pathfinder· breadcrumb + "Read the writeup
→") · toolbar (algorithm select · Run · speed · diagonal toggle · brush ·
Maze · Clear) · grid (main) · stats + legend (aside) · transport/scrubber
(below grid). Toolbar wraps on narrow viewports; the grid scales down on
mobile.

**State machine** (explicit — drives what's enabled when):
`idle` → (Run) → `running` → `done` → (edit / Run) → `idle`.
Editing the grid while `running` is disallowed; editing while `done`
invalidates the trace and returns to `idle`. This is R5's mitigation.

---

## 5. Visual language decision

- Reuse portfolio theme tokens (`--accent` #2563eb / #60a5fa, `--muted`,
  `--card`, focus ring). No orbs. No `<TiltCard>` — consistent with lab
  honesty. A plain page header (breadcrumb + writeup link), no HeroSpotlight
  on the working surface.
- **Cell palette:** empty = card bg; wall = solid foreground; start = accent +
  ▸ icon; end = accent + ⚑ icon; open/frontier = accent @ low alpha; closed/
  visited = accent @ mid alpha (animated fill); path = a distinct highlight
  (amber) drawn *over* visited; weight = hatch pattern + small number.
- **Color is never the only signal:** start/end icons; path cells use a
  connected/inset shape, not just hue; weights show a glyph + value; a legend
  is always visible.
- **Motion:** a short CSS transition on cell fill produces the "pop" as cells
  flip to visited; rAF decides *which* cells flip each tick.
  `prefers-reduced-motion: reduce` → no per-cell transition, instant fill, and
  the player can jump straight to `done`. Existing portfolio convention: CSS
  animation only, **no Framer Motion**.
- Density matches the lab surface: tight gutters, `py-8`–`py-12`.

---

## 6. Module contract (this demo's "data model" is its logic core)

No API/DB. The contract is the pure-logic module boundary in
`lib/lab/pathfinder/` — DOM-free, fully unit-testable.

```ts
// types.ts
type Cell = number;                       // flat index r*cols + c
interface Grid {
  rows: number; cols: number;
  start: Cell; end: Cell;
  walls: Set<Cell>;
  weights: Map<Cell, number>;             // cost > 1; absent ⇒ 1
  diagonal: boolean;
}
interface Trace {
  order: Cell[];      // cells in the order they were closed (visited)
  path: Cell[];       // start..end, empty if none
  found: boolean;
  cost: number;       // total path cost
  elapsedMicros: number;
}
type Algorithm = (g: Grid) => Trace;       // pure; no DOM, no time, no rng
```

- **algorithms.ts** — `bfs`, `dfs`, `dijkstra`, `astar`, `greedy`. Each pure,
  each returns a `Trace`. Shared neighbour/cost helpers respect `diagonal` and
  `weights`.
- **heap.ts** — a hand-rolled binary **min-heap** (generic, ~40 LOC) backing
  Dijkstra/A\*. Unit-tested independently. (The data-structure signal; ties to
  foundations.)
- **heuristics.ts** — Manhattan (4-dir) and octile (8-dir). Documented
  **admissibility** (never overestimate ⇒ A\* optimal); a test asserts A\*
  cost == Dijkstra cost on random grids.
- **maze.ts** — `generateMaze(rows, cols, seed) => Set<Cell>`, recursive
  backtracker, seeded RNG (reproducible).
- **player.ts** — `createPlayer(trace, { onStep, onDone })`: `play / pause /
  seek(k) / step()`; rAF loop; speed = cells-per-frame. `seek(k)` renders the
  state implied by "all `order[0..k]` closed, path shown iff `k` at end" — so
  scrubbing backward is just re-deriving from the array, no replay-from-zero.

---

## 7. Component inventory

UI (`components/lab/pathfinder/`):
- `pathfinder.tsx` — top client component; owns grid state + the player; wires
  toolbar/grid/transport/stats.
- `grid.tsx` — renders the grid once; during replay it mutates **cell DOM via
  refs/`dataset`/`className`**, never per-cell React state (R1). Owns the
  roving-tabindex keyboard model and Pointer-Event painting.
- `toolbar.tsx` — algorithm select, Run, speed, diagonal, brush, Maze, Clear.
- `transport.tsx` — play / pause / step / scrubber (`<input type=range>` bound
  to `seek`).
- `stats-panel.tsx` + `legend.tsx`.

Logic (`lib/lab/pathfinder/`): `types.ts`, `grid.ts`, `algorithms.ts`,
`heap.ts`, `heuristics.ts`, `maze.ts`, `player.ts`.

Route: `app/lab/pathfinder/page.tsx` (minimal Server Component shell + metadata
+ breadcrumb/writeup link; renders `<Pathfinder/>`).

Tests (`lib/lab/pathfinder/*.test.ts`): heap (ordering invariant); each
algorithm on hand-built small grids (known path/cost; wall blocking; no-path
case); A\* optimality vs Dijkstra on random grids; maze produces a connected
perfect maze. *This is the unit-testing showcase.*

---

## 8. Agent team (consult before each subtree, 2–3 line ask)

- **senior-foundations-skill** — algorithm complexity, the min-heap, heuristic
  admissibility, flat-array representation. (M1)
- **senior-unit-testing-skill** — table-driven algorithm tests; what to test
  (pure core) vs skip (DOM). (M1)
- **senior-frontend-skill** — ref-based grid updates that avoid a 1,500-cell
  re-render storm; rAF cadence; Core Web Vitals. (M3)
- **senior-react-patterns-skill** — state architecture (why grid state is
  local not URL; player as a custom hook; controlled toolbar); hook
  composition (`usePlayer`, `useGridInput`). (M2/M3)
- **senior-web-platform-skill / senior-rendering-seo-skill** — roving
  tabindex + ARIA grid, `aria-live`, Pointer Events, `prefers-reduced-motion`.
  (M2/M4)

Each subtree: consult the mentor first, run `/simplify` after.

## 9. Project + agent configuration

- New dir `app/lab/pathfinder/` with this `PLAN.md` + a sub-`CLAUDE.md`
  (draft in §9.1) — auto-loads when CWD is inside the dir.
- `lib/lab/pathfinder/` (pure logic) + `components/lab/pathfinder/` (UI).
- `content/projects/pathfinder.mdx`: `liveUrl: /lab/pathfinder`,
  `category: project`, `proves: ["Graph search (BFS/Dijkstra/A*)", "60fps rAF
  animation", "Keyboard-accessible grid", "Hand-rolled min-heap"]`. Appears on
  the `/lab` portal automatically (per the portal convention).
- **Decision — Vitest (dev-only).** The repo has no test runner. Adding Vitest
  as a `devDependency` breaks the lab "zero-new-dep" bar, but the whole point
  of this demo is provable logic, and the pure core is the perfect first
  test target. It never ships to the client bundle. **Recommend: add it,
  scoped to `lib/lab/pathfinder`.** Alternative: ship untested and rely on the
  visualizer as the oracle — weaker, and wastes the strongest logic signal.
- No DB / API / env. Static build. A11y floor: Lighthouse a11y ≥ 90,
  performance ≥ 90 (matches task-board).

### 9.1 Sub-CLAUDE.md (draft — created on approval)
Non-negotiables: ① compute/replay separation — algorithms are pure, DOM-free,
in `lib/`; ② **no per-cell React state in the animation hot path** — refs/
`className` only; ③ roving tabindex (one tab stop), full keyboard operation;
④ `prefers-reduced-motion` honoured; ⑤ no state-management lib, no Framer
Motion; ⑥ admissible heuristics, with a test pinning A\*==Dijkstra cost;
⑦ Pointer Events (not separate mouse/touch handlers). Plus file layout,
workflow (mentor → build → `/simplify`; build on close), and don'ts.

## 10. Risk register

- **R1 — re-render storm.** Animating 1,500 cells via React state = jank.
  *Mitigation:* compute the trace once; replay mutates cell DOM via refs/
  `className`; React owns structure only. *Accept:* 60fps on 30×50.
- **R2 — grid a11y / tab hell.** 1,500 focusable cells is unusable.
  *Mitigation:* roving tabindex — one tab stop, arrows move the active cell.
- **R3 — DOM vs Canvas.** Canvas is faster but opaque to assistive tech and
  loses CSS theming. *Decision:* **DOM + ref-based animation** — it forces and
  demonstrates the exact skills being showcased (render discipline + a11y);
  cap grid size to keep DOM perf in budget. *Fallback:* if perf misses target
  at size, switch the render layer to canvas behind an offscreen a11y
  description (the pure-logic core is unaffected — that's the payoff of §6).
- **R4 — wrong heuristic.** An overestimating heuristic yields non-optimal
  paths that look broken. *Mitigation:* admissible heuristics + a test
  asserting A\* cost == Dijkstra cost on random grids.
- **R5 — edit during animation.** Inconsistent state. *Mitigation:* the §4
  state machine — lock editing while `running`; invalidate trace on edit.
- **R6 — scrub timing.** Seeking backward must reconstruct state.
  *Mitigation:* `seek(k)` derives state from the trace array (§6), never
  replays from zero.
- **R7 — scope creep** (compare mode, URL grid, more mazes). *Mitigation:* the
  §2 OUT list is the wall; everything there is v2.
- **R8 — new devDep.** Vitest breaks zero-dep. *Mitigation:* dev-only,
  justified in §9; not in the client bundle.

## Amendments

### Amendment 1 — 2026-05-21: v1 shipped

All four milestones landed. Notable decisions made during the build, recorded
so they don't get silently relitigated:

- **Frontier visual** — the locked Trace contract is `order` + `path` only (no
  per-step open-set). So the "frontier" is rendered as a single leading cell
  (`data-state="open"`) at the head of the sweep, trailing cells settle to
  `closed`. Honest framing: it's the cell currently being expanded, not the
  literal open set. A richer open/closed trace is a v2 item.
- **Per-frame render path** — the scrubber position lives in React state and
  updates each frame; the grid is wrapped in `memo` so those updates don't
  reconcile its cells. Chosen over a fully ref-driven transport for
  readability; the grid (the actual hot path) stays ref-only either way.
- **Reduced motion** — `run()` checks `prefers-reduced-motion` and seeks
  straight to the solved state instead of animating.
- **Vitest** — added dev-only (§9 decision confirmed at sign-off). 32 tests
  across heap, heuristics, algorithms, maze, player.
- Lighthouse a11y/perf ≥ 90 (§1) not yet machine-verified in this environment;
  a11y mechanics (roving tabindex, ARIA grid, labels, reduced-motion,
  glyph-not-colour for start/end/weight) verified by review. Formal Lighthouse
  run is outstanding.

**v2 backlog:** open/closed frontier trace · side-by-side compare mode ·
URL-encoded shareable grid · more maze algorithms · weighted random fields ·
bidirectional / JPS search · save/load grids.

### Amendment 2 — 2026-05-21: multi-agent review + fixes

Ran four senior mentor sub-agents (foundations / react-patterns / frontend /
unit-testing) read-only against the build. Core architecture validated (A*
optimality, the memo/ref render split, lazy deletion, heap). Fixed before
commit:

- **Blocker — `aria-live` result announcement** was promised in §5/CLAUDE.md
  but never built; added a polite `role="status"` region fed from `run()` /
  `onDone`.
- **Blocker — maze solvability** for user-dragged (incl. odd/odd) endpoints and
  even-dimension grids: added a post-carve L-stub `connect()` to the lattice;
  regression test covers it.
- **Majors:** `cellRefs` truncation on shrink; moved `resetReplay()` out of the
  `setGrid` updater (StrictMode purity); focus restore after resize; kind-only
  cell `aria-label` (dropped duplicated coords + stale "empty").
- **Tests:** added `grid.test.ts` (neighbors/corner-cutting/moveCost/
  reconstruct/pathCost), diagonal + weighted optimality, a no-duplicate-
  expansion invariant, DFS coverage — killing 3 mutants the reviewer found
  surviving. 32 → 76 tests.

**Deferred (minors, tracked):** `performance.now` precision; frontier/visited
fill contrast (<3:1, colour-only); weight glyph on amber path in dark; Play
after reduced-motion re-animates; Step enabled-but-noop at end; `aria-describedby`
on the grid; `SPEEDS` duplication; `getLabDemos` string-coupling.
