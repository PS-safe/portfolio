import { moveCost, neighbors, pathCost, reconstruct } from "./grid";
import { heuristicFor } from "./heuristics";
import { MinHeap } from "./heap";
import type { Algorithm, Cell, Grid, Trace } from "./types";

const microsSince = (start: number): number => Math.round((performance.now() - start) * 1000);

function build(g: Grid, order: Cell[], parent: Map<Cell, Cell>, found: boolean, t0: number): Trace {
  const path = found ? reconstruct(parent, g.start, g.end) : [];
  return {
    order,
    path,
    found,
    cost: found ? pathCost(g, path) : 0,
    visited: order.length,
    elapsedMicros: microsSince(t0),
  };
}

/** Breadth-first search. Unweighted: optimal in number of steps, blind to
 * cell weights — the baseline the others are measured against. */
export const bfs: Algorithm = (g) => {
  const t0 = performance.now();
  const order: Cell[] = [];
  const parent = new Map<Cell, Cell>();
  const seen = new Set<Cell>([g.start]);
  const queue: Cell[] = [g.start];
  let head = 0; // index pointer instead of shift() — O(1) dequeue
  let found = false;
  while (head < queue.length) {
    const cur = queue[head++];
    order.push(cur);
    if (cur === g.end) {
      found = true;
      break;
    }
    for (const n of neighbors(g, cur)) {
      if (seen.has(n)) continue;
      seen.add(n);
      parent.set(n, cur);
      queue.push(n);
    }
  }
  return build(g, order, parent, found, t0);
};

/** Depth-first search. Finds *a* path, not a short one — included to show how
 * badly an uninformed strategy can wander. `seen` is marked at discovery so
 * the parent tree stays a valid spanning tree. */
export const dfs: Algorithm = (g) => {
  const t0 = performance.now();
  const order: Cell[] = [];
  const parent = new Map<Cell, Cell>();
  const seen = new Set<Cell>([g.start]);
  const stack: Cell[] = [g.start];
  let found = false;
  while (stack.length > 0) {
    const cur = stack.pop()!;
    order.push(cur);
    if (cur === g.end) {
      found = true;
      break;
    }
    for (const n of neighbors(g, cur)) {
      if (seen.has(n)) continue;
      seen.add(n);
      parent.set(n, cur);
      stack.push(n);
    }
  }
  return build(g, order, parent, found, t0);
};

/** Dijkstra. Weighted, optimal. Lazy deletion (stale heap entries skipped on
 * pop) avoids needing a decrease-key. */
export const dijkstra: Algorithm = (g) => {
  const t0 = performance.now();
  const order: Cell[] = [];
  const parent = new Map<Cell, Cell>();
  const dist = new Map<Cell, number>([[g.start, 0]]);
  const done = new Set<Cell>();
  const pq = new MinHeap<[Cell, number]>((a, b) => a[1] < b[1]);
  pq.push([g.start, 0]);
  let found = false;
  while (pq.size > 0) {
    const [cur, d] = pq.pop()!;
    if (done.has(cur)) continue;
    done.add(cur);
    order.push(cur);
    if (cur === g.end) {
      found = true;
      break;
    }
    for (const n of neighbors(g, cur)) {
      if (done.has(n)) continue;
      const nd = d + moveCost(g, cur, n);
      if (nd < (dist.get(n) ?? Infinity)) {
        dist.set(n, nd);
        parent.set(n, cur);
        pq.push([n, nd]);
      }
    }
  }
  return build(g, order, parent, found, t0);
};

/** A*. Dijkstra guided by an admissible heuristic — same optimal cost, far
 * fewer cells expanded. The visible "beeline" toward the goal. */
export const astar: Algorithm = (g) => {
  const t0 = performance.now();
  const h = heuristicFor(g);
  const order: Cell[] = [];
  const parent = new Map<Cell, Cell>();
  const gScore = new Map<Cell, number>([[g.start, 0]]);
  const done = new Set<Cell>();
  const pq = new MinHeap<[Cell, number]>((a, b) => a[1] < b[1]);
  pq.push([g.start, h(g.start, g.end)]);
  let found = false;
  while (pq.size > 0) {
    const [cur] = pq.pop()!;
    if (done.has(cur)) continue;
    done.add(cur);
    order.push(cur);
    if (cur === g.end) {
      found = true;
      break;
    }
    const gc = gScore.get(cur)!;
    for (const n of neighbors(g, cur)) {
      if (done.has(n)) continue;
      const ng = gc + moveCost(g, cur, n);
      if (ng < (gScore.get(n) ?? Infinity)) {
        gScore.set(n, ng);
        parent.set(n, cur);
        pq.push([n, ng + h(n, g.end)]);
      }
    }
  }
  return build(g, order, parent, found, t0);
};

/** Greedy best-first. Follows the heuristic alone, ignoring cost so far —
 * fast and direct, but not optimal. The contrast that explains why A* adds g. */
export const greedy: Algorithm = (g) => {
  const t0 = performance.now();
  const h = heuristicFor(g);
  const order: Cell[] = [];
  const parent = new Map<Cell, Cell>();
  const seen = new Set<Cell>([g.start]);
  const pq = new MinHeap<[Cell, number]>((a, b) => a[1] < b[1]);
  pq.push([g.start, h(g.start, g.end)]);
  let found = false;
  while (pq.size > 0) {
    const [cur] = pq.pop()!;
    order.push(cur);
    if (cur === g.end) {
      found = true;
      break;
    }
    for (const n of neighbors(g, cur)) {
      if (seen.has(n)) continue;
      seen.add(n);
      parent.set(n, cur);
      pq.push([n, h(n, g.end)]);
    }
  }
  return build(g, order, parent, found, t0);
};

export const ALGORITHMS = { astar, dijkstra, bfs, greedy, dfs } as const;
export type AlgorithmName = keyof typeof ALGORITHMS;

export const ALGORITHM_META: Record<AlgorithmName, { label: string; weighted: boolean; optimal: boolean }> = {
  astar: { label: "A*", weighted: true, optimal: true },
  dijkstra: { label: "Dijkstra", weighted: true, optimal: true },
  bfs: { label: "Breadth-first", weighted: false, optimal: true },
  greedy: { label: "Greedy best-first", weighted: true, optimal: false },
  dfs: { label: "Depth-first", weighted: false, optimal: false },
};
