import type { Trace } from "@/lib/lab/pathfinder";

function formatCost(cost: number): string {
  return Number.isInteger(cost) ? String(cost) : cost.toFixed(2);
}

function formatCompute(micros: number): string {
  // Shown in ms: browser clocks are coarse, so µs precision would oversell it.
  const ms = micros / 1000;
  return ms < 0.01 ? "<0.01 ms" : `${ms.toFixed(2)} ms`;
}

export function StatsPanel({ trace, algoLabel }: { trace: Trace | null; algoLabel: string }) {
  const rows: Array<[string, string]> = trace
    ? [
        ["Algorithm", algoLabel],
        ["Visited", String(trace.visited)],
        ["Path", trace.found ? `${Math.max(0, trace.path.length - 1)} steps` : "—"],
        ["Cost", trace.found ? formatCost(trace.cost) : "—"],
        ["Compute", formatCompute(trace.elapsedMicros)],
      ]
    : [["Algorithm", algoLabel]];

  return (
    <section aria-label="Run stats">
      <h2 className="font-mono text-[0.7rem] uppercase tracking-widest text-accent">Stats</h2>
      {!trace && (
        <p className="mt-3 text-xs text-muted-foreground">Run a search to see results.</p>
      )}
      <dl className="mt-3 space-y-1.5">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-3 text-xs">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="font-mono tabular-nums text-foreground">{v}</dd>
          </div>
        ))}
      </dl>
      {trace && !trace.found && (
        <p className="mt-2 text-xs text-amber-500">No path — the goal is walled off.</p>
      )}
    </section>
  );
}
