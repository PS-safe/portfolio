import { describe, expect, it } from "vitest";
import { generateMaze } from "./maze";
import { bfs } from "./algorithms";
import type { Grid } from "./types";

const rows = 11;
const cols = 11;
const start = 0;
const end = 10 * cols + 10; // (10,10), both even → a lattice node

describe("generateMaze", () => {
  it("is reproducible for a given seed", () => {
    const opts = { rows, cols, start, end, seed: 5 };
    const a = [...generateMaze(opts)].sort((x, y) => x - y);
    const b = [...generateMaze(opts)].sort((x, y) => x - y);
    expect(a).toEqual(b);
  });

  it("differs across seeds", () => {
    const a = [...generateMaze({ rows, cols, start, end, seed: 1 })].sort((x, y) => x - y);
    const b = [...generateMaze({ rows, cols, start, end, seed: 2 })].sort((x, y) => x - y);
    expect(a).not.toEqual(b);
  });

  it("keeps start and end open and stays solvable", () => {
    for (const seed of [1, 2, 3, 9, 42]) {
      const walls = generateMaze({ rows, cols, start, end, seed });
      expect(walls.has(start)).toBe(false);
      expect(walls.has(end)).toBe(false);
      const g: Grid = { rows, cols, start, end, walls, weights: new Map(), diagonal: false };
      expect(bfs(g).found).toBe(true);
    }
  });

  it("carves real passages (neither all wall nor all open)", () => {
    const walls = generateMaze({ rows, cols, start, end, seed: 1 });
    expect(walls.size).toBeGreaterThan(0);
    expect(walls.size).toBeLessThan(rows * cols);
  });
});

// Regression for the post-carve connect fix: the UI lets users drag start/end
// onto arbitrary cells (incl. odd/odd) and onto even-dimension grids, both of
// which the bare lattice maze left unreachable. Every case must be solvable.
describe("solvability for arbitrary endpoints", () => {
  const cases = [
    { rows: 15, cols: 15, start: 16, end: 208 }, // (1,1) → (13,13): both odd/odd
    { rows: 15, cols: 15, start: 0, end: 224 }, // even/even baseline
    { rows: 10, cols: 10, start: 0, end: 99 }, // even-dim grid, far corner (9,9)
    { rows: 12, cols: 16, start: 35, end: 150 }, // mixed parity
  ];
  for (const { rows: r, cols: c, start: s, end: e } of cases) {
    for (const seed of [1, 2, 5, 13]) {
      it(`${r}x${c} ${s}->${e} seed ${seed}`, () => {
        const walls = generateMaze({ rows: r, cols: c, start: s, end: e, seed });
        expect(walls.has(s)).toBe(false);
        expect(walls.has(e)).toBe(false);
        const g: Grid = { rows: r, cols: c, start: s, end: e, walls, weights: new Map(), diagonal: false };
        expect(bfs(g).found).toBe(true);
      });
    }
  }
});
