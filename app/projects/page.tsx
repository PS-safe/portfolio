import type { Metadata } from "next";
import { ProjectCard } from "@/components/project-card";
import { HeroSpotlight } from "@/components/hero-spotlight";
import { TiltCard } from "@/components/tilt-card";
import {
  CATEGORY_BLURB,
  CATEGORY_LABEL,
  CATEGORY_ORDER,
  getAllProjects,
  groupByCategory,
} from "@/lib/projects";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Things I've built — research-mode libraries, microservices, and full projects.",
};

export default async function ProjectsPage() {
  const projects = await getAllProjects();
  const grouped = groupByCategory(projects);

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <header className="border-b border-border pb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">
          Projects
        </p>
        <HeroSpotlight className="mt-3 block">
          <h1 className="hero-text text-4xl font-bold tracking-tight">
            Things I&apos;ve built
          </h1>
        </HeroSpotlight>
        <p className="mt-3 max-w-2xl text-base text-muted-foreground">
          Grouped by shape: importable Go libraries and full applications.
        </p>
      </header>

      {CATEGORY_ORDER.map((cat) => {
        const items = grouped[cat];
        if (items.length === 0) return null;
        return (
          <section key={cat} className="mt-12">
            <div className="flex items-baseline justify-between border-b border-border pb-3">
              <div>
                <p className="font-mono text-[0.7rem] uppercase tracking-widest text-accent">
                  {String(items.length).padStart(2, "0")} · {cat}
                </p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
                  {CATEGORY_LABEL[cat]}
                </h2>
              </div>
              <p className="hidden max-w-xs text-right text-xs text-muted-foreground sm:block">
                {CATEGORY_BLURB[cat]}
              </p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {items.map((p, i) => (
                <div
                  key={p.slug}
                  className="reveal"
                  style={{ ["--reveal-delay" as never]: `${i * 50}ms` }}
                >
                  <TiltCard>
                    <ProjectCard project={p} />
                  </TiltCard>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
