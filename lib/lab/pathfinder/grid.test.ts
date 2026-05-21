import { describe, expect, it } from "vitest";
import { moveCost, neighbors, pathCost, reconstruct } from "./grid";
import type { Grid } from "./types";

function makeGrid(rows: number, cols: number, opts: Partial<Grid> = {}): Grid {
  return {
    rows,
    cols,
    start: 0,
    end: rows * cols - 1,
    walls: new Set(),
    weights: new Map(),
    diagonal: false,
    ...opts,
  };
}

describe("neighbors", () => {
  it("returns the four orthogonal neighbors of an interior cell", () => {
    const g = makeGrid(3, 3); // center = 4
    expect(new Set(neighbors(g, 4))).toEqual(new Set([1, 7, 3, 5]));
  });

  it("clamps at a corner", () => {
    const g = makeGrid(3, 3); // (0,0) = 0
    expect(new Set(neighbors(g, 0))).toEqual(new Set([3, 1]));
  });

  it("skips walls", () => {
    const g = makeGrid(3, 3, { walls: new Set([1]) });
    expect(neighbors(g, 0)).not.toContain(1);
  });

  it("allows a diagonal step when both flanking cells are open", () => {
    const g = makeGrid(2, 2, { diagonal: true });
    expect(neighbors(g, 0)).toContain(3);
  });

  it("forbids corner-cutting between two walls", () => {
    // S #   walls at (0,1)=1 and (1,0)=2 ⇒ the diagonal to (1,1)=3 is illegal
    // # E
    const g = makeGrid(2, 2, { diagonal: true, walls: new Set([1, 2]) });
    expect(neighbors(g, 0)).not.toContain(3);
  });

  it("forbids the diagonal when even one flanking cell is a wall", () => {
    const g = makeGrid(2, 2, { diagonal: true, walls: new Set([1]) });
    expect(neighbors(g, 0)).not.toContain(3);
  });
});

describe("moveCost", () => {
  it("is 1 for a straight step", () => {
    const g = makeGrid(3, 3);
    expect(moveCost(g, 0, 1)).toBe(1);
  });

  it("is √2 for a diagonal step", () => {
    const g = makeGrid(3, 3, { diagonal: true });
    expect(moveCost(g, 0, 4)).toBeCloseTo(Math.SQRT2, 10);
  });

  it("applies the entered cell's weight", () => {
    const g = makeGrid(3, 3, { weights: new Map([[1, 3]]) });
    expect(moveCost(g, 0, 1)).toBe(3);
  });

  it("compounds weight with √2 on a diagonal", () => {
    const g = makeGrid(3, 3, { diagonal: true, weights: new Map([[4, 3]]) });
    expect(moveCost(g, 0, 4)).toBeCloseTo(3 * Math.SQRT2, 10);
  });
});

describe("reconstruct", () => {
  it("returns [start] when start === end", () => {
    expect(reconstruct(new Map(), 5, 5)).toEqual([5]);
  });

  it("walks the parent chain from end to start", () => {
    const parent = new Map([
      [1, 0],
      [2, 1],
    ]);
    expect(reconstruct(parent, 0, 2)).toEqual([0, 1, 2]);
  });

  it("returns [] when end has no parent (unreachable)", () => {
    expect(reconstruct(new Map(), 0, 5)).toEqual([]);
  });

  it("returns [] on a broken chain that never reaches start", () => {
    const parent = new Map([[5, 4]]); // 4 has no parent and isn't start
    expect(reconstruct(parent, 0, 5)).toEqual([]);
  });
});

describe("pathCost", () => {
  it("sums unit straight steps", () => {
    const g = makeGrid(3, 3);
    expect(pathCost(g, [0, 1, 2])).toBe(2);
  });

  it("counts the weight of entered cells", () => {
    const g = makeGrid(3, 3, { weights: new Map([[1, 3]]) });
    expect(pathCost(g, [0, 1, 2])).toBe(4); // enter weighted 1 (=3) + enter 2 (=1)
  });

  it("sums diagonal steps as √2", () => {
    const g = makeGrid(3, 3, { diagonal: true });
    expect(pathCost(g, [0, 4, 8])).toBeCloseTo(2 * Math.SQRT2, 10);
  });
});
