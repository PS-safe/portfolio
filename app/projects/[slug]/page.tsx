import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, ExternalLink } from "lucide-react";
import { GithubIcon } from "@/components/icons";
import { Mdx } from "@/components/mdx";
import { getAllProjects, getProjectBySlug } from "@/lib/projects";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const projects = await getAllProjects();
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return {};
  return {
    title: project.title,
    description: project.summary,
  };
}

const statusLabel = {
  active: "Active",
  stable: "Stable",
  experimental: "Experimental",
  archived: "Archived",
} as const;

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to projects
      </Link>

      <header className="mt-8 border-b border-border pb-8">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs uppercase tracking-widest text-accent">
          <span>{project.year}</span>
          <span className="opacity-50">·</span>
          <span>{statusLabel[project.status]}</span>
        </div>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground">
          {project.title}
        </h1>
        <p className="mt-3 text-base text-muted-foreground">{project.summary}</p>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {project.tech.map((t) => (
            <span
              key={t}
              className="rounded-md border border-border bg-muted px-2 py-1 font-mono text-xs text-muted-foreground"
            >
              {t}
            </span>
          ))}
        </div>

        {(project.repo || project.liveUrl) && (
          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
            {project.repo && (
              <a
                href={project.repo}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-foreground transition-colors hover:text-accent"
              >
                <GithubIcon className="h-4 w-4" /> Repository
              </a>
            )}
            {project.liveUrl &&
              (project.liveUrl.startsWith("/lab/") ? (
                <Link
                  href={project.liveUrl}
                  className="inline-flex items-center gap-1.5 font-medium text-accent transition-colors hover:text-accent/80"
                >
                  <ArrowUpRight className="h-4 w-4" /> Try it live
                </Link>
              ) : (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-foreground transition-colors hover:text-accent"
                >
                  <ExternalLink className="h-4 w-4" /> Live
                </a>
              ))}
          </div>
        )}
      </header>

      <article className="pt-2">
        <Mdx source={project.content} />
      </article>
    </div>
  );
}
