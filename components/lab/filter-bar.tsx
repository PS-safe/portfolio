"use client";

import { Plus, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { TaskStatus } from "@/lib/lab/db";

type Order =
  | "-created_at"
  | "created_at"
  | "title"
  | "-title"
  | "status"
  | "-status";

type Props = {
  status: TaskStatus[];
  search: string;
  order: Order;
  pending: boolean;
  onStatusChange: (next: TaskStatus[]) => void;
  onSearchChange: (next: string) => void;
  onOrderChange: (next: Order) => void;
  onCreate: () => void;
};

const ALL_STATUSES: TaskStatus[] = ["active", "pending", "archived"];
const ORDER_OPTIONS: Array<{ value: Order; label: string }> = [
  { value: "-created_at", label: "Newest first" },
  { value: "created_at", label: "Oldest first" },
  { value: "title", label: "Title A → Z" },
  { value: "-title", label: "Title Z → A" },
  { value: "status", label: "Status A → Z" },
  { value: "-status", label: "Status Z → A" },
];

// Custom debounce — kept inline to avoid creating a hook file for one
// use site. 250ms feels responsive without round-tripping every keystroke.
function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export function FilterBar(p: Props) {
  // Draft text lives locally; only the debounced value rises up to the URL.
  const [draft, setDraft] = useState(p.search);
  const debounced = useDebounced(draft, 250);
  // Track the last value we emitted so external URL changes (back button,
  // filter reset) don't echo back as an "edit." Without this the URL +
  // input get into a tug-of-war on browser navigation.
  const lastEmitted = useRef(p.search);

  useEffect(() => {
    if (debounced !== lastEmitted.current) {
      lastEmitted.current = debounced;
      p.onSearchChange(debounced);
    }
  }, [debounced, p]);

  // Keep the draft in sync if the URL changes externally (back button).
  useEffect(() => {
    if (p.search !== lastEmitted.current) {
      lastEmitted.current = p.search;
      setDraft(p.search);
    }
  }, [p.search]);

  function toggleStatus(s: TaskStatus) {
    const next = p.status.includes(s) ? p.status.filter((x) => x !== s) : [...p.status, s];
    p.onStatusChange(next);
  }

  const hasActiveFilters = p.status.length > 0 || p.search.length > 0;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-center">
      {/* Status chip group */}
      <div role="group" aria-label="Filter by status" className="flex flex-wrap items-center gap-1">
        {ALL_STATUSES.map((s) => {
          const active = p.status.includes(s);
          return (
            <button
              key={s}
              type="button"
              aria-pressed={active}
              onClick={() => toggleStatus(s)}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                active
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              {s}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          type="search"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Search title or body"
          aria-label="Search tasks"
          className="block w-full rounded-md border border-border bg-background py-1.5 pl-8 pr-8 text-sm placeholder:text-muted-foreground focus:border-accent focus:outline-none"
        />
        {draft && (
          <button
            type="button"
            onClick={() => setDraft("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        )}
      </div>

      {/* Order */}
      <div className="flex items-center gap-2">
        <label htmlFor="task-order" className="sr-only">
          Sort tasks
        </label>
        <select
          id="task-order"
          value={p.order}
          onChange={(e) => p.onOrderChange(e.target.value as Order)}
          className="rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:border-accent focus:outline-none"
        >
          {ORDER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              p.onStatusChange([]);
              setDraft("");
            }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
        )}

        <button
          type="button"
          onClick={p.onCreate}
          className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground transition-opacity hover:opacity-90 sm:ml-2"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Add task
        </button>
      </div>

      {/* Subtle pending indicator on the right edge so URL transitions
          don't feel inert. */}
      {p.pending && (
        <span className="sr-only" role="status">
          Loading…
        </span>
      )}
    </div>
  );
}

export type { Order };
