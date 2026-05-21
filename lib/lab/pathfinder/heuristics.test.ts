import { describe, expect, it } from "vitest";
import { manhattan, octile } from "./heuristics";
import type { Grid } from "./types";

const grid = (rows: number, cols: number): Grid => ({
  rows,
  cols,
  start: 0,
  end: rows * cols - 1,
  walls: new Set(),
  weights: new Map(),
  diagonal: false,
});

describe("heuristics", () => {
  const g = grid(10, 10);

  it("manhattan sums the axis distances", () => {
    expect(manhattan(g, 0, 2 * 10 + 3)).toBe(5); // (0,0) -> (2,3)
    expect(manhattan(g, 0, 3)).toBe(3); // same row
  });

  it("octile discounts the diagonal portion", () => {
    expect(octile(g, 0, 3)).toBeCloseTo(3, 6); // pure straight
    expect(octile(g, 0, 3 * 10 + 3)).toBeCloseTo(3 * Math.SQRT2, 6); // pure diagonal
  });

  it("octile never exceeds manhattan (it's the looser bound)", () => {
    expect(octile(g, 0, 5 * 10 + 7)).toBeLessThanOrEqual(manhattan(g, 0, 5 * 10 + 7));
  });
});
