import type { Cell } from "./types";

/** Deterministic PRNG (mulberry32) so a given seed reproduces the same maze —
 * makes the maze button shareable and the tests stable. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface MazeOptions {
  rows: number;
  cols: number;
  start: Cell;
  end: Cell;
  seed?: number;
}

/** Recursive backtracker over a lattice of nodes spaced 2 apart, carving the
 * wall cell between a node and its chosen neighbour. Produces a "perfect"
 * maze (every node reachable, exactly one route between any two). `start` and
 * `end` are forced open at the end; for guaranteed solvability they should sit
 * on even/even coordinates (lattice nodes) — the UI snaps them there. */
export function generateMaze({ rows, cols, start, end, seed = 1 }: MazeOptions): Set<Cell> {
  const rnd = mulberry32(seed);
  const walls = new Set<Cell>();
  for (let i = 0; i < rows * cols; i++) walls.add(i);
  const at = (r: number, c: number) => r * cols + c;
  const carve = (cell: Cell) => walls.delete(cell);

  const visited = new Set<number>();
  const stack: Array<[number, number]> = [[0, 0]];
  visited.add(at(0, 0));
  carve(at(0, 0));
  const dirs: ReadonlyArray<readonly [number, number]> = [
    [-2, 0],
    [2, 0],
    [0, -2],
    [0, 2],
  ];

  while (stack.length > 0) {
    const [r, c] = stack[stack.length - 1];
    const options: Array<[number, number]> = [];
    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      if (visited.has(at(nr, nc))) continue;
      options.push([nr, nc]);
    }
    if (options.length === 0) {
      stack.pop();
      continue;
    }
    const [nr, nc] = options[Math.floor(rnd() * options.length)];
    carve(at((r + nr) / 2, (c + nc) / 2)); // knock down the wall between
    carve(at(nr, nc));
    visited.add(at(nr, nc));
    stack.push([nr, nc]);
  }

  // Connect each endpoint to the lattice so the maze is solvable for ANY
  // start/end the UI can produce — users drag them onto arbitrary (incl.
  // odd/odd) cells. Carves a short L-stub to the nearest even/even node, which
  // the backtracker always reaches. (No-op when the endpoint is already a node.)
  const connect = (cell: Cell) => {
    let r = Math.floor(cell / cols);
    let c = cell % cols;
    carve(at(r, c));
    while (r % 2 !== 0) {
      r -= 1;
      carve(at(r, c));
    }
    while (c % 2 !== 0) {
      c -= 1;
      carve(at(r, c));
    }
  };
  connect(start);
  connect(end);
  return walls;
}
