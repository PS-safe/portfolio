// Linear/Vercel-style row skeleton (per PLAN §5 — loading uses placeholders,
// not spinners). 6 rows because that's roughly the default page size; the
// list shrinks visually instead of jumping when the real data lands.

export function TaskListSkeleton() {
  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-card">
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-4 w-2/5 animate-pulse rounded bg-muted" />
            <div className="ml-auto h-4 w-16 animate-pulse rounded-full bg-muted" />
          </div>
          <div className="mt-2 h-3 w-3/5 animate-pulse rounded bg-muted/70" />
        </li>
      ))}
    </ul>
  );
}
