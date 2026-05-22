"use client";

import { ALGORITHM_META, type AlgorithmName } from "@/lib/lab/pathfinder";

export type Brush = "wall" | "weight" | "erase";
export type Speed = "slow" | "normal" | "fast";

const BRUSHES: ReadonlyArray<{ id: Brush; label: string }> = [
  { id: "wall", label: "Wall" },
  { id: "weight", label: "Weight ×5" },
  { id: "erase", label: "Erase" },
];

const ALGO_ORDER: ReadonlyArray<AlgorithmName> = ["astar", "dijkstra", "bfs", "greedy", "dfs"];
// Single source for the speed control: label (UI) + cellsPerFrame (player).
export const SPEEDS: ReadonlyArray<{ id: Speed; label: string; cellsPerFrame: number }> = [
  { id: "slow", label: "Slow", cellsPerFrame: 1 },
  { id: "normal", label: "Normal", cellsPerFrame: 5 },
  { id: "fast", label: "Fast", cellsPerFrame: 14 },
];

const selectClass =
  "rounded-md border border-border bg-card px-2 py-1 text-xs text-foreground focus-visible:border-accent";

interface Props {
  algo: AlgorithmName;
  onAlgo: (a: AlgorithmName) => void;
  onRun: () => void;
  speed: Speed;
  onSpeed: (s: Speed) => void;
  brush: Brush;
  onBrush: (b: Brush) => void;
  diagonal: boolean;
  onDiagonal: (v: boolean) => void;
  onMaze: () => void;
  onClear: () => void;
  /** True while a replay is playing — locks the grid-editing controls. */
  editLocked: boolean;
}

export function Toolbar({
  algo,
  onAlgo,
  onRun,
  speed,
  onSpeed,
  brush,
  onBrush,
  diagonal,
  onDiagonal,
  onMaze,
  onClear,
  editLocked,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
      {/* run group */}
      <div className="flex items-center gap-2">
        <select
          aria-label="Algorithm"
          value={algo}
          onChange={(e) => onAlgo(e.target.value as AlgorithmName)}
          className={selectClass}
        >
          {ALGO_ORDER.map((a) => (
            <option key={a} value={a}>
              {ALGORITHM_META[a].label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onRun}
          className="rounded-md bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground"
        >
          Run
        </button>
        <select
          aria-label="Speed"
          value={speed}
          onChange={(e) => onSpeed(e.target.value as Speed)}
          className={selectClass}
        >
          {SPEEDS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <span className="hidden h-5 w-px bg-border sm:block" aria-hidden />

      {/* edit group — locked during playback */}
      <div role="group" aria-label="Brush" className="inline-flex rounded-md border border-border p-0.5">
        {BRUSHES.map((b) => (
          <button
            key={b.id}
            type="button"
            disabled={editLocked}
            aria-pressed={brush === b.id}
            onClick={() => onBrush(b.id)}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
              brush === b.id
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>

      <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={diagonal}
          disabled={editLocked}
          onChange={(e) => onDiagonal(e.target.checked)}
          className="accent-[var(--accent)]"
        />
        Diagonal moves
      </label>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={onMaze}
          disabled={editLocked}
          className="rounded-md border border-border px-3 py-1 text-xs font-medium text-foreground transition-colors hover:border-accent disabled:opacity-50"
        >
          Maze
        </button>
        <button
          type="button"
          onClick={onClear}
          disabled={editLocked}
          className="rounded-md border border-border px-3 py-1 text-xs font-medium text-foreground transition-colors hover:border-accent disabled:opacity-50"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
