/** A grid position as a flat index: `row * cols + col`. Flat indices keep the
 * hot paths (sets, maps, the heap) working on primitives, not coordinate
 * objects. */
export type Cell = number;

export interface Grid {
  rows: number;
  cols: number;
  start: Cell;
  end: Cell;
  walls: Set<Cell>;
  /** Cost to ENTER a cell; absent means 1. Only weighted algorithms read it. */
  weights: Map<Cell, number>;
  /** When true, 8-directional movement is allowed (with no corner-cutting). */
  diagonal: boolean;
}

/** The output of running an algorithm. Pure data — no DOM, no timers — so the
 * UI's replay player can animate it and the tests can assert on it. */
export interface Trace {
  /** Cells in the order they were closed (expanded). Drives the visited sweep. */
  order: Cell[];
  /** start..end inclusive; empty when `found` is false. */
  path: Cell[];
  found: boolean;
  /** Total cost of `path` (sum of entered-cell costs); 0 when not found. */
  cost: number;
  /** Convenience mirror of `order.length` for the stats panel. */
  visited: number;
  elapsedMicros: number;
}

export type Algorithm = (g: Grid) => Trace;
