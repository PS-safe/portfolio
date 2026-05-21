import { describe, expect, it } from "vitest";
import { astar, bfs, dfs, dijkstra, greedy } from "./algorithms";
import { generateMaze } from "./maze";
import type { Grid } from "./types";

// Build a Grid from an ASCII map: '.' open, '#' wall, 'S' start, 'E' end,
// '1'-'9' a weighted open cell.
function parseGrid(map: string[], diagonal = false): Grid {
  const rows = map.length;
  const cols = map[0].length;
  let start = 0;
  let end = 0;
  const walls = new Set<number>();
  const weights = new Map<number, number>();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ch = map[r][c];
      const i = r * cols + c;
      if (ch === "#") walls.add(i);
      else if (ch === "S") start = i;
      else if (ch === "E") end = i;
      else if (ch >= "1" && ch <= "9") weights.set(i, Number(ch));
    }
  }
  return { rows, cols, start, end, walls, weights, diagonal };
}

describe("pathfinding algorithms", () => {
  it("find the straight-line path on an open row", () => {
    const g = parseGrid(["S...E"]);
    for (const algo of [bfs, dijkstra, astar, greedy]) {
      const t = algo(g);
      expect(t.found).toBe(true);
      expect(t.path).toEqual([0, 1, 2, 3, 4]);
    }
  });

  it("route around a wall and never step onto one", () => {
    const g = parseGrid(["S#E", ".#.", "..."]);
    for (const algo of [bfs, dijkstra, astar, greedy]) {
      const t = algo(g);
      expect(t.found).toBe(true);
      expect(t.path[0]).toBe(g.start);
      expect(t.path[t.path.length - 1]).toBe(g.end);
      expect(t.path.some((cell) => g.walls.has(cell))).toBe(false);
    }
  });

  it("report no path when the goal is walled off", () => {
    const g = parseGrid(["S#E", ".#.", ".#."]);
    for (const algo of [bfs, dijkstra, astar, greedy]) {
      const t = algo(g);
      expect(t.found).toBe(false);
      expect(t.path).toEqual([]);
      expect(t.cost).toBe(0);
    }
  });

  it("weighted search detours around an expensive cell; BFS does not", () => {
    const g = parseGrid(["S9E", "..."]);
    // BFS ignores weight → fewest steps straight through the costly cell.
    expect(bfs(g).path).toEqual([0, 1, 2]);
    // Dijkstra/A* take the longer-but-cheaper detour (cost 4 vs 10).
    expect(dijkstra(g).cost).toBeCloseTo(4, 6);
    expect(dijkstra(g).path).toEqual([0, 3, 4, 5, 2]);
    expect(astar(g).cost).toBeCloseTo(4, 6);
  });

  it("A* expands no more cells than Dijkstra (the heuristic helps)", () => {
    const g = parseGrid(["S....", ".....", ".....", "....E"]);
    expect(astar(g).visited).toBeLessThanOrEqual(dijkstra(g).visited);
  });

  describe("optimality vs Dijkstra on generated mazes", () => {
    const rows = 15;
    const cols = 15;
    const start = 0;
    const end = 14 * cols + 14; // (14,14), both even → a lattice node

    for (const seed of [1, 2, 3, 7, 42]) {
      for (const diagonal of [false, true]) {
        it(`seed ${seed}, diagonal=${diagonal}: A* cost === Dijkstra cost`, () => {
          const walls = generateMaze({ rows, cols, start, end, seed });
          const g: Grid = { rows, cols, start, end, walls, weights: new Map(), diagonal };
          const d = dijkstra(g);
          const a = astar(g);
          expect(a.found).toBe(d.found);
          if (d.found) expect(a.cost).toBeCloseTo(d.cost, 6);
        });
      }
    }

    it("BFS matches Dijkstra path length on an unweighted 4-dir maze", () => {
      const walls = generateMaze({ rows, cols, start, end, seed: 9 });
      const g: Grid = { rows, cols, start, end, walls, weights: new Map(), diagonal: false };
      expect(bfs(g).path.length).toBe(dijkstra(g).path.length);
    });
  });
});

describe("diagonal movement", () => {
  it("takes the diagonal route on an open grid, not the L-shape", () => {
    const g = parseGrid(["S..", "...", "..E"], true);
    const d = dijkstra(g);
    expect(d.found).toBe(true);
    expect(d.cost).toBeCloseTo(2 * Math.SQRT2, 6); // two diagonal steps
    expect(d.path.length).toBe(3); // start, middle, end — beats the 5-cell L
    expect(astar(g).cost).toBeCloseTo(d.cost, 6);
  });
});

describe("optimality holds with weighted cells", () => {
  const rows = 15;
  const cols = 15;
  const start = 0;
  const end = 14 * cols + 14;

  for (const seed of [1, 3, 7]) {
    for (const diagonal of [false, true]) {
      it(`seed ${seed}, diagonal=${diagonal}: A* cost === Dijkstra cost`, () => {
        const walls = generateMaze({ rows, cols, start, end, seed });
        const weights = new Map<number, number>();
        for (let i = 0; i < rows * cols; i++) if (i % 7 === 0) weights.set(i, 5);
        const g: Grid = { rows, cols, start, end, walls, weights, diagonal };
        const d = dijkstra(g);
        const a = astar(g);
        expect(a.found).toBe(d.found);
        if (d.found) expect(a.cost).toBeCloseTo(d.cost, 6);
      });
    }
  }
});

describe("no cell is expanded twice (lazy-deletion / seen guards)", () => {
  const rows = 15;
  const cols = 15;
  const start = 0;
  const end = 14 * cols + 14;
  const walls = generateMaze({ rows, cols, start, end, seed: 11 });

  for (const diagonal of [false, true]) {
    it(`order has no duplicates, diagonal=${diagonal}`, () => {
      const g: Grid = { rows, cols, start, end, walls, weights: new Map(), diagonal };
      for (const algo of [bfs, dfs, dijkstra, astar, greedy]) {
        const { order } = algo(g);
        expect(new Set(order).size).toBe(order.length);
      }
    });
  }
});

describe("DFS", () => {
  it("finds a valid wall-free path (not necessarily shortest)", () => {
    const g = parseGrid(["S#E", ".#.", "..."]);
    const t = dfs(g);
    expect(t.found).toBe(true);
    expect(t.path[0]).toBe(g.start);
    expect(t.path[t.path.length - 1]).toBe(g.end);
    expect(t.path.some((cell) => g.walls.has(cell))).toBe(false);
  });

  it("reports no path when the goal is walled off", () => {
    const g = parseGrid(["S#E", ".#.", ".#."]);
    expect(dfs(g).found).toBe(false);
  });
});
