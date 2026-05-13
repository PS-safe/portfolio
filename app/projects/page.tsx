import type { Metadata } from "next";
import { ProjectCard } from "@/components/project-card";
import { getAllProjects } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Projects",
  description: "Things I've built — research-mode libraries, work projects, and learning experiments.",
};

export default async function ProjectsPage() {
  const projects = await getAllProjects();

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <header className="border-b border-border pb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">
          Projects
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground">
          Things I&apos;ve built
        </h1>
        <p className="mt-3 max-w-2xl text-base text-muted-foreground">
          A mix of reusable libraries from research mode, work projects, and
          learning experiments. The libraries are designed to drop into future
          projects as plugins.
        </p>
      </header>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {projects.map((p, i) => (
          <div
            key={p.slug}
            className="reveal"
            style={{ ["--reveal-delay" as never]: `${i * 50}ms` }}
          >
            <ProjectCard project={p} />
          </div>
        ))}
      </div>
    </div>
  );
}
