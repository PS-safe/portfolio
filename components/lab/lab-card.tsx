import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Project } from "@/lib/projects";

// Status → dot colour. Color is never the only signal — the label sits beside
// the dot (lab a11y rule, PLAN §5).
const statusDot: Record<Project["status"], string> = {
  active: "bg-accent",
  stable: "bg-accent",
  experimental: "bg-amber-500",
  archived: "bg-muted-foreground",
};

const statusLabel: Record<Project["status"], string> = {
  active: "Active",
  stable: "Stable",
  experimental: "Experimental",
  archived: "Archived",
};

// No TiltCard here — the lab surface is honest, not a toy (PLAN §5). The card
// carries two destinations: the live demo (primary) and its writeup.
export function LabCard({ project }: { project: Project }) {
  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-card-foreground">
          {project.title}
        </h3>
        <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
          <span className={`h-1.5 w-1.5 rounded-full ${statusDot[project.status]}`} />
          {statusLabel[project.status]}
        </span>
      </div>

      <p className="mt-2 text-sm text-muted-foreground">{project.summary}</p>

      {project.proves && project.proves.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {project.proves.map((p) => (
            <li
              key={p}
              className="rounded border border-border px-2 py-0.5 font-mono text-[0.7rem] text-muted-foreground"
            >
              {p}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-sm">
        <Link
          href={project.liveUrl!}
          className="group inline-flex items-center gap-1 font-medium text-accent"
        >
          Try it live
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
        <Link
          href={`/projects/${project.slug}`}
          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Writeup
        </Link>
      </div>
    </div>
  );
}
