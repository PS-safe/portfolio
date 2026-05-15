import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/icons";
import { Mdx } from "@/components/mdx";
import { getAbout } from "@/lib/about";

export const metadata: Metadata = {
  title: "About",
  description:
    "Backend engineer with production Go experience, currently growing toward full-stack.",
};

export default async function AboutPage() {
  const about = await getAbout();

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <header className="pb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">
          About
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground">
          {about.name}
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          {about.title} · {about.location}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3 text-xs">
          {about.currently && (
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 font-mono text-muted-foreground">
              <span className="status-dot" aria-hidden />
              {about.currently}
            </span>
          )}

          <a
            href={`mailto:${about.email}`}
            className="nav-link inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <Mail className="h-3.5 w-3.5" />
            {about.email}
          </a>
          {about.github && (
            <a
              href={about.github}
              target="_blank"
              rel="noreferrer"
              className="nav-link inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <GithubIcon className="h-3.5 w-3.5" />
              GitHub
            </a>
          )}
          {about.linkedin && (
            <a
              href={about.linkedin}
              target="_blank"
              rel="noreferrer"
              className="nav-link inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <LinkedinIcon className="h-3.5 w-3.5" />
              LinkedIn
            </a>
          )}
        </div>

        <div className="mt-8 accent-divider" aria-hidden />
      </header>

      <article className="article-counters pt-2">
        <Mdx source={about.content} />
      </article>
    </div>
  );
}
