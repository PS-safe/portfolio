"use client";

import { memo, useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import type { Grid } from "@/lib/lab/pathfinder";
import type { Brush } from "./toolbar";

const WEIGHT = 5;

type Kind = "empty" | "wall" | "weight" | "start" | "end";

function kindOf(g: Grid, i: number): Kind {
  if (i === g.start) return "start";
  if (i === g.end) return "end";
  if (g.walls.has(i)) return "wall";
  if (g.weights.has(i)) return "weight";
  return "empty";
}

interface Props {
  grid: Grid;
  brush: Brush;
  disabled?: boolean;
  onChange: (next: Grid) => void;
  /** Shared with the replay player (M3), which addresses cells by index. */
  cellRefs: { current: Array<HTMLDivElement | null> };
  /** Set true by the parent when a resize happens while the grid had focus, so
   * the rebuilt grid can restore it instead of dropping focus to <body>. */
  restoreFocusRef?: { current: boolean };
}

type Stroke = {
  mode: "paint" | "drag-start" | "drag-end";
  walls: Set<number>;
  weights: Map<number, number>;
  start: number;
  end: number;
  last: number;
};

function PathGridImpl({ grid, brush, disabled, onChange, cellRefs, restoreFocusRef }: Props) {
  const { rows, cols } = grid;
  const [active, setActive] = useState(grid.start);
  const activeRef = useRef(active);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);
  // A drag lives entirely in this ref: pointermove mutates cell DOM directly
  // and commits to React state once, on pointerup — so dragging across hundreds
  // of cells never triggers a render (PLAN R1).
  const stroke = useRef<Stroke | null>(null);

  // The ref array is indexed by cell; trim it when the grid shrinks so removed
  // rows don't leave detached nodes dangling (and getting needlessly painted).
  useEffect(() => {
    cellRefs.current.length = rows * cols;
  }, [rows, cols, cellRefs]);

  // Keep the keyboard cursor valid after a resize rebuilds the grid, and
  // restore focus if the resize happened while the grid was focused.
  useEffect(() => {
    const target = activeRef.current < rows * cols ? activeRef.current : grid.start;
    setActive(target);
    if (restoreFocusRef?.current) {
      restoreFocusRef.current = false;
      cellRefs.current[target]?.focus();
    }
  }, [rows, cols, grid.start, cellRefs, restoreFocusRef]);

  const setKind = (i: number, kind: Kind) => {
    const el = cellRefs.current[i];
    if (el) el.dataset.kind = kind;
  };

  const cellFromPoint = (x: number, y: number): number => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    const cell = el?.closest<HTMLElement>("[data-cell]");
    return cell ? Number(cell.dataset.cell) : -1;
  };

  const applyAt = (i: number) => {
    const s = stroke.current;
    if (!s || i < 0 || i === s.last) return;
    s.last = i;
    if (s.mode === "paint") {
      if (i === s.start || i === s.end) return;
      if (brush === "wall") {
        s.walls.add(i);
        s.weights.delete(i);
        setKind(i, "wall");
      } else if (brush === "weight") {
        if (!s.walls.has(i)) {
          s.weights.set(i, WEIGHT);
          setKind(i, "weight");
        }
      } else {
        s.walls.delete(i);
        s.weights.delete(i);
        setKind(i, "empty");
      }
      return;
    }
    if (s.walls.has(i)) return;
    if (s.mode === "drag-start") {
      if (i === s.end) return;
      const old = s.start;
      s.start = i;
      setKind(old, s.weights.has(old) ? "weight" : "empty");
      setKind(i, "start");
    } else {
      if (i === s.start) return;
      const old = s.end;
      s.end = i;
      setKind(old, s.weights.has(old) ? "weight" : "empty");
      setKind(i, "end");
    }
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    const i = cellFromPoint(e.clientX, e.clientY);
    if (i < 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    stroke.current = {
      mode: i === grid.start ? "drag-start" : i === grid.end ? "drag-end" : "paint",
      walls: new Set(grid.walls),
      weights: new Map(grid.weights),
      start: grid.start,
      end: grid.end,
      last: -1,
    };
    applyAt(i);
    e.preventDefault();
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!stroke.current) return;
    applyAt(cellFromPoint(e.clientX, e.clientY));
  };

  const endStroke = () => {
    const s = stroke.current;
    if (!s) return;
    stroke.current = null;
    onChange({ ...grid, walls: s.walls, weights: s.weights, start: s.start, end: s.end });
  };

  // Single-cell keyboard edits: small and discrete, so committing to state
  // immediately is fine (unlike the drag path above).
  const edit = (mut: (g: { walls: Set<number>; weights: Map<number, number>; start: number; end: number }) => void) => {
    const next = {
      walls: new Set(grid.walls),
      weights: new Map(grid.weights),
      start: grid.start,
      end: grid.end,
    };
    mut(next);
    onChange({ ...grid, ...next });
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const r = Math.floor(active / cols);
    const c = active % cols;
    let nr = r;
    let nc = c;
    switch (e.key) {
      case "ArrowUp":
        nr = Math.max(0, r - 1);
        break;
      case "ArrowDown":
        nr = Math.min(rows - 1, r + 1);
        break;
      case "ArrowLeft":
        nc = Math.max(0, c - 1);
        break;
      case "ArrowRight":
        nc = Math.min(cols - 1, c + 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        edit((g) => {
          if (active === g.start || active === g.end) return;
          if (g.walls.has(active)) g.walls.delete(active);
          else {
            g.walls.add(active);
            g.weights.delete(active);
          }
        });
        return;
      case "s":
      case "S":
        e.preventDefault();
        edit((g) => {
          if (active === g.end || g.walls.has(active)) return;
          g.start = active;
        });
        return;
      case "e":
      case "E":
        e.preventDefault();
        edit((g) => {
          if (active === g.start || g.walls.has(active)) return;
          g.end = active;
        });
        return;
      case "w":
      case "W":
        e.preventDefault();
        edit((g) => {
          if (active === g.start || active === g.end || g.walls.has(active)) return;
          if (g.weights.has(active)) g.weights.delete(active);
          else g.weights.set(active, WEIGHT);
        });
        return;
      case "Backspace":
      case "Delete":
        e.preventDefault();
        edit((g) => {
          g.walls.delete(active);
          g.weights.delete(active);
        });
        return;
      default:
        return;
    }
    e.preventDefault();
    const ni = nr * cols + nc;
    if (ni !== active) {
      setActive(ni);
      cellRefs.current[ni]?.focus();
    }
  };

  return (
    <div
      role="grid"
      aria-label="Pathfinding grid"
      aria-rowcount={rows}
      aria-colcount={cols}
      className="pf-grid"
      style={{ ["--pf-cell" as string]: "26px" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endStroke}
      onPointerCancel={endStroke}
      onKeyDown={onKeyDown}
    >
      {Array.from({ length: rows }, (_, r) => (
        <div role="row" aria-rowindex={r + 1} className="pf-row" key={r}>
          {Array.from({ length: cols }, (_, c) => {
            const i = r * cols + c;
            const kind = kindOf(grid, i);
            return (
              <div
                key={i}
                role="gridcell"
                aria-colindex={c + 1}
                aria-label={kind === "empty" ? undefined : kind}
                tabIndex={i === active ? 0 : -1}
                data-cell={i}
                data-kind={kind}
                ref={(el) => {
                  cellRefs.current[i] = el;
                }}
                className="pf-cell"
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

// Memoised: while a replay plays, the parent re-renders every frame to advance
// the scrubber. The grid's props are stable during playback, so memo skips
// reconciling its hundreds of cells — only the player's ref-driven paints touch
// them (PLAN R1).
export const PathGrid = memo(PathGridImpl);
