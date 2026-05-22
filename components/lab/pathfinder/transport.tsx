"use client";

interface Props {
  playing: boolean;
  progress: number;
  total: number;
  hasTrace: boolean;
  onToggle: () => void;
  onStep: () => void;
  onSeek: (k: number) => void;
}

export function Transport({ playing, progress, total, hasTrace, onToggle, onStep, onSeek }: Props) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onToggle}
        disabled={!hasTrace}
        className="w-16 rounded-md bg-accent px-3 py-1 text-xs font-medium text-accent-foreground transition-opacity disabled:opacity-40"
      >
        {playing ? "Pause" : "Play"}
      </button>
      <button
        type="button"
        onClick={onStep}
        disabled={!hasTrace || playing || progress >= total}
        className="rounded-md border border-border px-3 py-1 text-xs font-medium text-foreground transition-colors hover:border-accent disabled:opacity-40"
      >
        Step
      </button>
      <input
        type="range"
        min={0}
        max={total}
        value={progress}
        disabled={!hasTrace}
        onChange={(e) => onSeek(Number(e.target.value))}
        aria-label="Replay progress"
        className="h-1 flex-1 cursor-pointer accent-[var(--accent)] disabled:opacity-40"
      />
      <span className="w-16 text-right font-mono text-xs tabular-nums text-muted-foreground">
        {progress}/{total}
      </span>
    </div>
  );
}
