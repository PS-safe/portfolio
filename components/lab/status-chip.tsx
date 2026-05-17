import type { TaskStatus } from "@/lib/lab/db";

// Per PLAN §5: three colors total on /lab surfaces (accent, amber,
// muted). Color is never the sole signal — every chip pairs a dot with
// a text label so a screen reader / colorblind user reads the status
// even without the hue.

const STYLES: Record<TaskStatus, { dot: string; text: string; bg: string }> = {
  active: {
    dot: "bg-accent",
    text: "text-accent",
    bg: "bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]",
  },
  pending: {
    dot: "bg-amber-600 dark:bg-amber-400",
    text: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-500/10 dark:bg-amber-400/10",
  },
  archived: {
    dot: "bg-muted-foreground",
    text: "text-muted-foreground",
    bg: "bg-muted",
  },
};

export function StatusChip({ status }: { status: TaskStatus }) {
  const s = STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[0.7rem] font-medium ${s.bg} ${s.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} aria-hidden />
      {status}
    </span>
  );
}
