"use client";

import { Inbox } from "lucide-react";
import type { LabTask } from "@/lib/lab/db";
import { TaskListSkeleton } from "./skeleton";
import { TaskRow } from "./task-row";
import { Pagination } from "./pagination";

type Props = {
  items: LabTask[];
  total: number;
  page: number;
  totalPages: number;
  pending: boolean;
  emptyKind: "no-tasks" | "no-matches";
  onEdit: (task: LabTask) => void;
  onDelete: (task: LabTask) => void;
  onPageChange: (page: number) => void;
};

export function TaskList(p: Props) {
  if (p.pending && p.items.length === 0) {
    return <TaskListSkeleton />;
  }

  if (p.items.length === 0) {
    return p.emptyKind === "no-tasks" ? <EmptyNoTasks /> : <EmptyNoMatches />;
  }

  return (
    <>
      <ul className="divide-y divide-border rounded-lg border border-border bg-card">
        {p.items.map((t) => (
          <TaskRow key={t.id} task={t} onEdit={p.onEdit} onDelete={p.onDelete} />
        ))}
      </ul>
      <Pagination
        page={p.page}
        totalPages={p.totalPages}
        onChange={p.onPageChange}
        disabled={p.pending}
      />
    </>
  );
}

// Different empty copy for the two different reasons the list is empty:
// "you have no tasks yet" vs "no tasks match this filter." Both are
// chances for personality / clarity per PLAN §1's "polished frontend"
// claim.

function EmptyNoTasks() {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card/50 p-10 text-center">
      <Inbox className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden />
      <h3 className="mt-3 text-sm font-medium text-foreground">No tasks yet</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Hit the <span className="font-mono text-foreground">+ Add task</span> button above to
        create your first one. The dashboard fills out as you go — try filtering,
        searching, and sorting once you have a few.
      </p>
    </div>
  );
}

function EmptyNoMatches() {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card/50 p-10 text-center">
      <h3 className="text-sm font-medium text-foreground">No tasks match the current filter</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Try clearing the search input or selecting a different status.
      </p>
    </div>
  );
}
