"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { LabTask } from "@/lib/lab/db";
import { StatusChip } from "./status-chip";

type Props = {
  task: LabTask;
  onEdit: (task: LabTask) => void;
  onDelete: (task: LabTask) => void;
};

const RELATIVE = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const ABSOLUTE = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

function timeAgo(iso: string) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const seconds = (then - Date.now()) / 1000;
  const abs = Math.abs(seconds);
  if (abs < 60) return RELATIVE.format(Math.round(seconds), "second");
  if (abs < 3600) return RELATIVE.format(Math.round(seconds / 60), "minute");
  if (abs < 86400) return RELATIVE.format(Math.round(seconds / 3600), "hour");
  if (abs < 86400 * 30) return RELATIVE.format(Math.round(seconds / 86400), "day");
  return ABSOLUTE.format(new Date(iso));
}

function absolute(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : ABSOLUTE.format(d);
}

/** useTimeAgo renders the absolute date on the server (deterministic) and
 *  swaps to relative time after mount on the client. Avoids the React #418
 *  hydration mismatch we'd get from running Date.now() in both renders. */
function useTimeAgo(iso: string) {
  const [text, setText] = useState(() => absolute(iso));
  useEffect(() => {
    setText(timeAgo(iso));
    // Re-format every minute so "5 minutes ago" doesn't get stale on a
    // dashboard the user is staring at. One interval per row is fine —
    // there's at most 8 rows on screen at any time (page_size).
    const t = setInterval(() => setText(timeAgo(iso)), 60_000);
    return () => clearInterval(t);
  }, [iso]);
  return text;
}

export function TaskRow({ task, onEdit, onDelete }: Props) {
  const when = useTimeAgo(task.created_at);
  return (
    <li className="group relative border-l-2 border-transparent px-4 py-3 transition-colors hover:border-accent hover:bg-muted/50">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <StatusChip status={task.status} />
            <h3 className="truncate text-sm font-medium text-foreground">{task.title}</h3>
          </div>
          {task.body && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{task.body}</p>
          )}
          <time
            className="mt-1.5 block font-mono text-[0.65rem] text-muted-foreground"
            dateTime={task.created_at}
            title={task.created_at}
          >
            {when}
          </time>
        </div>

        {/* Hover-revealed actions. Always tab-reachable for keyboard users
            (no display:none on focus state). */}
        <div className="flex items-center gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
          <button
            type="button"
            onClick={() => onEdit(task)}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
            aria-label={`Edit ${task.title}`}
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => onDelete(task)}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-background hover:text-red-600 dark:hover:text-red-400"
            aria-label={`Delete ${task.title}`}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      </div>
    </li>
  );
}
