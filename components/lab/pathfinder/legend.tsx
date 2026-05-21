type Item =
  | { label: string; kind: string }
  | { label: string; state: string };

const ITEMS: ReadonlyArray<Item> = [
  { label: "Start", kind: "start" },
  { label: "End", kind: "end" },
  { label: "Wall", kind: "wall" },
  { label: "Weight ×5", kind: "weight" },
  { label: "Frontier", state: "open" },
  { label: "Visited", state: "closed" },
  { label: "Path", state: "path" },
];

export function Legend() {
  return (
    <aside aria-label="Legend" className="shrink-0 lg:w-44">
      <h2 className="font-mono text-[0.7rem] uppercase tracking-widest text-accent">Legend</h2>
      <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 lg:grid-cols-1">
        {ITEMS.map((it) => (
          <li key={it.label} className="flex items-center gap-2 text-xs text-muted-foreground">
            <span
              className="pf-cell pf-legend-swatch shrink-0"
              {...("kind" in it ? { "data-kind": it.kind } : { "data-state": it.state })}
            />
            {it.label}
          </li>
        ))}
      </ul>
    </aside>
  );
}
