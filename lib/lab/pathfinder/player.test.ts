import { describe, expect, it } from "vitest";
import { createPlayer } from "./player";
import type { Trace } from "./types";

// A literal trace so the player is tested in isolation from the algorithms.
const trace: Trace = {
  order: [0, 1, 2, 3, 4],
  path: [0, 2, 4],
  found: true,
  cost: 2,
  visited: 5,
  elapsedMicros: 0,
};

// Fake paint that records the latest state per cell (mirrors what the DOM
// would end up showing).
function recorder() {
  const states = new Map<number, string>();
  const paint = (cell: number, state: string) => {
    if (state === "") states.delete(cell);
    else states.set(cell, state);
  };
  return { states, paint };
}

describe("createPlayer", () => {
  it("seek reveals visited cells with a leading frontier, no path yet", () => {
    const { states, paint } = recorder();
    const p = createPlayer({ trace, paint, getSpeed: () => 1 });
    p.seek(3);
    expect(Object.fromEntries(states)).toEqual({ 0: "closed", 1: "closed", 2: "open" });
  });

  it("seeking to the end settles all visited and draws the path over them", () => {
    const { states, paint } = recorder();
    const p = createPlayer({ trace, paint, getSpeed: () => 1 });
    p.seek(5);
    expect(states.get(1)).toBe("closed");
    expect(states.get(3)).toBe("closed");
    expect(states.get(0)).toBe("path");
    expect(states.get(2)).toBe("path");
    expect(states.get(4)).toBe("path");
  });

  it("seeking back to zero clears everything", () => {
    const { states, paint } = recorder();
    const p = createPlayer({ trace, paint, getSpeed: () => 1 });
    p.seek(5);
    p.seek(0);
    expect(states.size).toBe(0);
  });

  it("step advances one cell at a time, moving the frontier", () => {
    const { states, paint } = recorder();
    const p = createPlayer({ trace, paint, getSpeed: () => 1 });
    p.step();
    expect(Object.fromEntries(states)).toEqual({ 0: "open" });
    p.step();
    expect(Object.fromEntries(states)).toEqual({ 0: "closed", 1: "open" });
  });

  it("reports revealed count through onFrame", () => {
    const seen: number[] = [];
    const { paint } = recorder();
    const p = createPlayer({ trace, paint, getSpeed: () => 1, onFrame: (n) => seen.push(n) });
    p.step();
    p.step();
    p.seek(5);
    expect(seen).toEqual([1, 2, 5]);
  });
});
