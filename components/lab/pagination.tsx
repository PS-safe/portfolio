"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  disabled?: boolean;
};

// Compact prev / next + page indicators. Numbers are dumb here — the URL
// is the source of truth (PLAN §4), so onChange just emits the next page
// number and the parent drives the URL update.
export function Pagination({ page, totalPages, onChange, disabled }: Props) {
  if (totalPages <= 1) return null;

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className="mt-4 flex items-center justify-between text-xs text-muted-foreground"
    >
      <span>
        Page <span className="font-mono text-foreground">{page}</span> of{" "}
        <span className="font-mono text-foreground">{totalPages}</span>
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={disabled || page <= 1}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
          Prev
        </button>
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={disabled || page >= totalPages}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next page"
        >
          Next
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
    </nav>
  );
}
