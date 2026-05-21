import type { Metadata } from "next";
import Link from "next/link";
import { Pathfinder } from "@/components/lab/pathfinder/pathfinder";

export const metadata: Metadata = {
  title: "Pathfinding visualizer",
  description:
    "Draw walls and weights, then watch BFS, Dijkstra, and A* search the grid — a from-scratch graph-search visualizer with a keyboard-accessible grid.",
};

export default function PathfinderPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <header className="border-b border-border pb-6">
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            <Link href="/lab" className="hover:text-foreground">
              Lab
            </Link>
            <span className="mx-1.5 opacity-50">/</span>Pathfinder
          </p>
          <Link
            href="/projects/pathfinder"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Read the writeup &rarr;
          </Link>
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
          Pathfinding visualizer
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Draw walls, drop weights, then watch the classic graph-search
          algorithms explore the grid. Built from scratch — a hand-rolled
          min-heap, admissible heuristics, and a compute/replay split so the
          animation stays smooth.
        </p>
      </header>

      <div className="mt-8">
        <Pathfinder />
      </div>
    </div>
  );
}
