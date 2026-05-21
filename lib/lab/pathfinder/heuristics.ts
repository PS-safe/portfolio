import { rc } from "./grid";
import type { Cell, Grid } from "./types";

const SQRT2 = Math.SQRT2;

/** 4-directional distance. Admissible when diagonal movement is OFF. */
export function manhattan(g: Grid, a: Cell, b: Cell): number {
  const [ar, ac] = rc(g, a);
  const [br, bc] = rc(g, b);
  return Math.abs(ar - br) + Math.abs(ac - bc);
}

/** 8-directional distance: the cheapest diagonal-allowed path with unit step
 * costs. Admissible when diagonal movement is ON, because every real move
 * costs at least 1 (straight) or √2 (diagonal). */
export function octile(g: Grid, a: Cell, b: Cell): number {
  const [ar, ac] = rc(g, a);
  const [br, bc] = rc(g, b);
  const dx = Math.abs(ac - bc);
  const dy = Math.abs(ar - br);
  return dx + dy + (SQRT2 - 2) * Math.min(dx, dy);
}

/** Pick the heuristic that matches the grid's movement model. Choosing the
 * wrong one (Manhattan with diagonals on) would overestimate and break A*'s
 * optimality — hence the switch lives here, not at the call site. */
export function heuristicFor(g: Grid): (a: Cell, b: Cell) => number {
  return g.diagonal ? (a, b) => octile(g, a, b) : (a, b) => manhattan(g, a, b);
}
