import type { Cell, Trace } from "./types";

export type CellState = "" | "open" | "closed" | "path";

export interface PlayerOptions {
  trace: Trace;
  /** Apply a visual state to a cell. The component closes over the cell refs;
   * the player stays DOM-agnostic so it can be unit-tested with a fake. */
  paint: (cell: Cell, state: CellState) => void;
  /** Cells to reveal per animation frame; read fresh each frame so the speed
   * control takes effect mid-play. */
  getSpeed: () => number;
  onFrame?: (revealed: number) => void;
  onDone?: () => void;
}

export interface Player {
  play: () => void;
  pause: () => void;
  step: () => void;
  seek: (revealed: number) => void;
  destroy: () => void;
}

/** Replays a precomputed Trace. The search itself already ran (synchronously,
 * in the algorithm); this only paints `order` over time, then the path. State
 * at any point is a pure function of how many cells are revealed, so seeking
 * backward is just a repaint — no replay-from-zero. */
export function createPlayer({ trace, paint, getSpeed, onFrame, onDone }: PlayerOptions): Player {
  const order = trace.order;
  const len = order.length;
  let revealed = 0;
  let raf = 0;

  const drawPath = () => {
    if (trace.found) for (const c of trace.path) paint(c, "path");
  };

  // Reveal forward without clearing — the leading cell glows as the frontier,
  // the rest settle to visited. Used by play() and step().
  const revealTo = (target: number) => {
    const next = Math.min(Math.max(target, revealed), len);
    for (let j = revealed; j < next; j++) {
      if (j > 0) paint(order[j - 1], "closed");
      paint(order[j], j === next - 1 && next < len ? "open" : "closed");
    }
    revealed = next;
    if (revealed >= len) drawPath();
    onFrame?.(revealed);
  };

  const stop = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };

  const frame = () => {
    revealTo(revealed + Math.max(1, Math.floor(getSpeed())));
    if (revealed >= len) {
      stop();
      onDone?.();
      return;
    }
    raf = requestAnimationFrame(frame);
  };

  const seek = (target: number) => {
    stop();
    const next = Math.max(0, Math.min(target, len));
    for (let j = 0; j < len; j++) paint(order[j], "");
    for (const c of trace.path) paint(c, "");
    for (let j = 0; j < next; j++) {
      paint(order[j], j === next - 1 && next < len ? "open" : "closed");
    }
    revealed = next;
    if (revealed >= len) drawPath();
    onFrame?.(revealed);
  };

  return {
    play() {
      if (raf) return;
      if (revealed >= len) seek(0);
      raf = requestAnimationFrame(frame);
    },
    pause: stop,
    step() {
      stop();
      revealTo(revealed + 1);
    },
    seek,
    destroy: stop,
  };
}
