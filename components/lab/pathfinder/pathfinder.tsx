"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ALGORITHMS,
  ALGORITHM_META,
  createPlayer,
  generateMaze,
  type AlgorithmName,
  type Grid,
  type Player,
  type Trace,
} from "@/lib/lab/pathfinder";
import { PathGrid } from "./grid";
import { Toolbar, type Brush, type Speed } from "./toolbar";
import { Transport } from "./transport";
import { StatsPanel } from "./stats-panel";
import { Legend } from "./legend";

const ROWS = 21;
const CELL = 27; // 26px cell + 1px gap; keep in sync with .pf-cell / .pf-grid
const SPEEDS: Record<Speed, number> = { slow: 1, normal: 5, fast: 14 };

const evenDown = (n: number) => n - (n % 2);

// Start/end default to even coordinates so a generated maze (whose lattice
// nodes sit on even/even) is always solvable between them.
function makeGrid(rows: number, cols: number, diagonal: boolean): Grid {
  const midRow = evenDown(Math.floor(rows / 2));
  return {
    rows,
    cols,
    start: midRow * cols + 2,
    end: midRow * cols + evenDown(cols - 3),
    walls: new Set(),
    weights: new Map(),
    diagonal,
  };
}

export function Pathfinder() {
  const [grid, setGrid] = useState<Grid>(() => makeGrid(ROWS, 31, false));
  const [brush, setBrush] = useState<Brush>("wall");
  const [algo, setAlgo] = useState<AlgorithmName>("astar");
  const [speed, setSpeed] = useState<Speed>("normal");
  const [trace, setTrace] = useState<Trace | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [announce, setAnnounce] = useState(""); // screen-reader result line

  const cellRefs = useRef<Array<HTMLDivElement | null>>([]);
  const wrapRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);
  const speedRef = useRef(speed);
  const colsRef = useRef(grid.cols);
  const restoreFocusRef = useRef(false);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  const paint = useCallback((cell: number, state: "" | "open" | "closed" | "path") => {
    const el = cellRefs.current[cell];
    if (!el) return;
    if (state === "") delete el.dataset.state;
    else el.dataset.state = state;
  }, []);

  const resetReplay = useCallback(() => {
    playerRef.current?.destroy();
    playerRef.current = null;
    for (const el of cellRefs.current) if (el) delete el.dataset.state;
    setTrace(null);
    setPlaying(false);
    setProgress(0);
    setAnnounce("");
  }, []);

  // Size to available width at a fixed cell size; rebuild (and abandon any
  // replay) only when the column count actually changes. The side effects run
  // outside the setGrid updater so the updater stays pure (StrictMode-safe).
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const cols = Math.max(11, Math.min(49, Math.floor(el.clientWidth / CELL)));
      if (cols === colsRef.current) return;
      colsRef.current = cols;
      restoreFocusRef.current = el.contains(document.activeElement);
      resetReplay();
      setGrid((g) => makeGrid(ROWS, cols, g.diagonal));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [resetReplay]);

  useEffect(() => () => playerRef.current?.destroy(), []);

  // Any grid edit discards the current replay (PLAN §4: editing invalidates).
  const handleEdit = useCallback(
    (next: Grid) => {
      resetReplay();
      setGrid(next);
    },
    [resetReplay],
  );

  const run = useCallback(() => {
    resetReplay();
    const result = ALGORITHMS[algo](grid);
    setTrace(result);
    const cost = Number.isInteger(result.cost) ? String(result.cost) : result.cost.toFixed(2);
    const message = result.found
      ? `${ALGORITHM_META[algo].label} found a path of ${Math.max(0, result.path.length - 1)} steps, cost ${cost}, after visiting ${result.visited} cells.`
      : `${ALGORITHM_META[algo].label}: no path — the goal is walled off.`;
    const player = createPlayer({
      trace: result,
      paint,
      getSpeed: () => SPEEDS[speedRef.current],
      onFrame: setProgress,
      onDone: () => {
        setPlaying(false);
        setAnnounce(message);
      },
    });
    playerRef.current = player;
    // Honour reduced-motion: skip the animated sweep, show the solved grid and
    // announce the result immediately.
    const reduceMotion =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      player.seek(result.order.length);
      setAnnounce(message);
    } else {
      player.play();
      setPlaying(true);
    }
  }, [algo, grid, paint, resetReplay]);

  const toggle = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (playing) {
      p.pause();
      setPlaying(false);
    } else {
      p.play();
      setPlaying(true);
    }
  }, [playing]);

  const step = useCallback(() => {
    playerRef.current?.step();
    setPlaying(false);
  }, []);

  const seek = useCallback((k: number) => {
    playerRef.current?.seek(k);
    setPlaying(false);
  }, []);

  return (
    <div>
      <p className="sr-only" role="status" aria-live="polite">
        {announce}
      </p>
      <Toolbar
        algo={algo}
        onAlgo={setAlgo}
        onRun={run}
        speed={speed}
        onSpeed={setSpeed}
        brush={brush}
        onBrush={setBrush}
        diagonal={grid.diagonal}
        onDiagonal={(diagonal) => handleEdit({ ...grid, diagonal })}
        onMaze={() =>
          handleEdit({
            ...grid,
            walls: generateMaze({
              rows: grid.rows,
              cols: grid.cols,
              start: grid.start,
              end: grid.end,
              seed: Math.floor(Math.random() * 1e9),
            }),
            weights: new Map(),
          })
        }
        onClear={() => handleEdit({ ...grid, walls: new Set(), weights: new Map() })}
        editLocked={playing}
      />

      <div className="mt-4">
        <Transport
          playing={playing}
          progress={progress}
          total={trace ? trace.order.length : 0}
          hasTrace={!!trace}
          onToggle={toggle}
          onStep={step}
          onSeek={seek}
        />
      </div>

      <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-start">
        <div ref={wrapRef} className="min-w-0 flex-1 overflow-x-auto">
          <PathGrid
            grid={grid}
            brush={brush}
            disabled={playing}
            onChange={handleEdit}
            cellRefs={cellRefs}
            restoreFocusRef={restoreFocusRef}
          />
        </div>
        <div className="flex shrink-0 gap-8 sm:gap-12 lg:w-44 lg:flex-col lg:gap-6">
          <StatsPanel trace={trace} algoLabel={ALGORITHM_META[algo].label} />
          <Legend />
        </div>
      </div>

      <p className="mt-4 max-w-2xl text-xs text-muted-foreground">
        Click or drag to draw walls and weights; drag the <span className="text-foreground">▸</span> start and{" "}
        <span className="text-foreground">◉</span> end to move them. Keyboard: focus the grid, arrow keys to move,{" "}
        <kbd>Enter</kbd> toggles a wall, <kbd>S</kbd>/<kbd>E</kbd> place start/end, <kbd>W</kbd> a weight. Pick an
        algorithm and hit <span className="text-foreground">Run</span>.
      </p>
    </div>
  );
}
