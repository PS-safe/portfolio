import type { Cell, Grid } from "./types";

const SQRT2 = Math.SQRT2;

const STRAIGHT: ReadonlyArray<readonly [number, number]> = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];
const DIAGONAL: ReadonlyArray<readonly [number, number]> = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
];

export const rc = (g: Grid, c: Cell): [number, number] => [Math.floor(c / g.cols), c % g.cols];
export const idx = (g: Grid, r: number, c: number): Cell => r * g.cols + c;

export function neighbors(g: Grid, cell: Cell): Cell[] {
  const [r, c] = rc(g, cell);
  const out: Cell[] = [];
  for (const [dr, dc] of STRAIGHT) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr < 0 || nr >= g.rows || nc < 0 || nc >= g.cols) continue;
    const n = idx(g, nr, nc);
    if (!g.walls.has(n)) out.push(n);
  }
  if (!g.diagonal) return out;
  for (const [dr, dc] of DIAGONAL) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr < 0 || nr >= g.rows || nc < 0 || nc >= g.cols) continue;
    const n = idx(g, nr, nc);
    if (g.walls.has(n)) continue;
    // No corner-cutting: a diagonal step is only legal when both orthogonally
    // adjacent cells are open, so a path can't squeeze between two wall corners.
    if (g.walls.has(idx(g, r, nc)) || g.walls.has(idx(g, nr, c))) continue;
    out.push(n);
  }
  return out;
}

/** Cost of stepping from `from` to an adjacent `to`. Diagonal steps cost √2×
 * the entered cell's weight so distances stay metric and A*'s octile heuristic
 * stays admissible. */
export function moveCost(g: Grid, from: Cell, to: Cell): number {
  const [fr, fc] = rc(g, from);
  const [tr, tc] = rc(g, to);
  const w = g.weights.get(to) ?? 1;
  return fr !== tr && fc !== tc ? w * SQRT2 : w;
}

export function reconstruct(parent: Map<Cell, Cell>, start: Cell, end: Cell): Cell[] {
  if (start === end) return [start];
  if (!parent.has(end)) return [];
  const path: Cell[] = [end];
  let cur = end;
  while (cur !== start) {
    const p = parent.get(cur);
    if (p === undefined) return [];
    path.push(p);
    cur = p;
  }
  path.reverse();
  return path;
}

export function pathCost(g: Grid, path: Cell[]): number {
  let cost = 0;
  for (let i = 1; i < path.length; i++) cost += moveCost(g, path[i - 1], path[i]);
  return cost;
}
