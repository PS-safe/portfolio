"use client";

import { Loader2, LogOut } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { startTransition, useEffect, useOptimistic, useState, useTransition } from "react";
import type { LabTask, TaskStatus } from "@/lib/lab/db";
import type { Page } from "@/lib/lab/queryhelper";
import { FilterBar, type Order } from "./filter-bar";
import { TaskList } from "./task-list";
import { TaskFormDialog, type TaskFormInput } from "./task-form-dialog";
import { DeleteConfirm } from "./delete-confirm";

type Props = {
  email: string;
  initialPage: Page<LabTask>;
};

// Header (user chip + sign-out) is inlined here — it's small enough that
// a separate file would just add an import without adding clarity.
function Header({ email }: { email: string }) {
  const [working, setWorking] = useState(false);
  async function signOut() {
    setWorking(true);
    try {
      await fetch("/api/lab/logout", { method: "POST" });
      location.reload();
    } catch {
      setWorking(false);
    }
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 font-mono text-xs text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
        {email}
      </span>
      <button
        type="button"
        onClick={signOut}
        disabled={working}
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs text-foreground transition-colors hover:bg-muted disabled:opacity-50"
      >
        {working ? (
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
        ) : (
          <LogOut className="h-3 w-3" aria-hidden />
        )}
        Sign out
      </button>
    </div>
  );
}

type OptimisticAction =
  | { type: "add"; task: LabTask }
  | { type: "update"; task: LabTask }
  | { type: "remove"; id: string };

export function Dashboard({ email, initialPage }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, transition] = useTransition();

  // Read filter / search / order from URL (PLAN §4: URL is source of truth).
  const statusParam = sp.get("status") ?? "";
  const status: TaskStatus[] = statusParam
    ? (statusParam.split(",").filter(Boolean) as TaskStatus[])
    : [];
  const search = sp.get("search") ?? "";
  const order = (sp.get("order") as Order | null) ?? "-created_at";

  // Server data is the truth; useOptimistic layers user-perceived changes
  // on top until router.refresh() pulls fresh server state.
  const [optimisticItems, applyOptimistic] = useOptimistic<LabTask[], OptimisticAction>(
    initialPage.items,
    (state, action) => {
      switch (action.type) {
        case "add":
          return [action.task, ...state].slice(0, initialPage.pageSize);
        case "update":
          return state.map((t) => (t.id === action.task.id ? action.task : t));
        case "remove":
          return state.filter((t) => t.id !== action.id);
      }
    },
  );

  // Modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<LabTask | null>(null);
  const [pendingDelete, setPendingDelete] = useState<LabTask | null>(null);

  // -------------------- URL-write helpers --------------------

  function pushParams(mutate: (next: URLSearchParams) => void) {
    const next = new URLSearchParams(sp.toString());
    mutate(next);
    transition(() => {
      router.replace(`${pathname}?${next.toString()}`);
    });
  }

  function onStatusChange(next: TaskStatus[]) {
    pushParams((p) => {
      if (next.length === 0) p.delete("status");
      else p.set("status", next.join(","));
      p.delete("page");
    });
  }

  function onSearchChange(next: string) {
    pushParams((p) => {
      if (next) p.set("search", next);
      else p.delete("search");
      p.delete("page");
    });
  }

  function onOrderChange(next: Order) {
    pushParams((p) => {
      if (next === "-created_at") p.delete("order");
      else p.set("order", next);
      p.delete("page");
    });
  }

  function onPageChange(page: number) {
    pushParams((p) => {
      if (page <= 1) p.delete("page");
      else p.set("page", String(page));
    });
  }

  // -------------------- Mutations --------------------

  async function createTask(input: TaskFormInput) {
    const tmp: LabTask = {
      id: "tmp_" + Math.random().toString(36).slice(2),
      user_id: "",
      title: input.title,
      body: input.body,
      status: input.status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    // useOptimistic must be called inside a transition. startTransition
    // schedules the optimistic update + the actual fetch together.
    startTransition(() => applyOptimistic({ type: "add", task: tmp }));
    const res = await fetch("/api/lab/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(data.error ?? "Could not create task.");
    }
    router.refresh();
  }

  async function patchTask(id: string, input: TaskFormInput) {
    const existing = optimisticItems.find((t) => t.id === id);
    if (existing) {
      startTransition(() =>
        applyOptimistic({
          type: "update",
          task: { ...existing, ...input, updated_at: new Date().toISOString() },
        }),
      );
    }
    const res = await fetch(`/api/lab/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(data.error ?? "Could not update task.");
    }
    router.refresh();
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    startTransition(() => applyOptimistic({ type: "remove", id }));
    const res = await fetch(`/api/lab/tasks/${id}`, { method: "DELETE" });
    if (!res.ok) {
      // Optimistic state is reset by the next render automatically via
      // useOptimistic — but throwing here gives the dialog a chance to
      // show the failure.
      throw new Error("Could not delete task.");
    }
    router.refresh();
  }

  // -------------------- Empty-state detection --------------------

  const isFiltered = status.length > 0 || search.length > 0;
  const emptyKind: "no-tasks" | "no-matches" =
    initialPage.total === 0 && !isFiltered ? "no-tasks" : "no-matches";

  // Sync optimistic items when the server data changes (e.g. router.refresh
  // brought a new page after a mutation). useOptimistic resets to the source
  // each render, so nothing extra is needed — this comment exists so the
  // pattern isn't surprising on re-read.

  // Keep the document title in sync with state so it's obvious there's
  // pending work in another tab.
  useEffect(() => {
    document.title = `Lab · ${initialPage.total} tasks`;
  }, [initialPage.total]);

  return (
    <div className="mt-8 space-y-5">
      <Header email={email} />

      <FilterBar
        status={status}
        search={search}
        order={order}
        pending={pending}
        onStatusChange={onStatusChange}
        onSearchChange={onSearchChange}
        onOrderChange={onOrderChange}
        onCreate={() => {
          setEditing(null);
          setFormOpen(true);
        }}
      />

      <TaskList
        items={optimisticItems}
        total={initialPage.total}
        page={initialPage.page}
        totalPages={initialPage.totalPages}
        pending={pending}
        emptyKind={emptyKind}
        onEdit={(t) => {
          setEditing(t);
          setFormOpen(true);
        }}
        onDelete={(t) => setPendingDelete(t)}
        onPageChange={onPageChange}
      />

      <TaskFormDialog
        open={formOpen}
        initial={editing}
        onClose={() => setFormOpen(false)}
        onSubmit={async (input) => {
          if (editing) await patchTask(editing.id, input);
          else await createTask(input);
        }}
      />

      <DeleteConfirm
        open={pendingDelete !== null}
        title={pendingDelete?.title ?? ""}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
