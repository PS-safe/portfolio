import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Project } from "@/lib/projects";

const statusLabel: Record<Project["status"], string> = {
  active: "Active",
  stable: "Stable",
  experimental: "Experimental",
  archived: "Archived",
};

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group block rounded-lg border border-border bg-card p-5 transition-colors hover:border-accent"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-card-foreground">
          {project.title}
        </h3>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-accent" />
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{project.summary}</p>
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
        <span className="font-mono">{project.year}</span>
        <span className="opacity-50">·</span>
        <span>{statusLabel[project.status]}</span>
        <span className="opacity-50">·</span>
        <span className="font-mono">{project.tech.slice(0, 3).join(" · ")}</span>
      </div>
    </Link>
  );
}
