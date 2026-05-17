import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProjectCard } from "@/components/project-card";
import { Mermaid } from "@/components/mermaid";
import { HeroSpotlight } from "@/components/hero-spotlight";
import { TiltCard } from "@/components/tilt-card";
import { getFeaturedProjects } from "@/lib/projects";

const overviewDiagram = `flowchart LR
  V[Visitor] --> P[Portfolio<br/>Vercel + Next.js 16]
  P --> SL[shortlink]
  P --> OTP[otp]
  P --> RL[ratelimit]
  P --> WH[webhookd]
  P --> LAB[lab]
  SL & OTP & RL & WH & LAB --> N[(Neon Postgres)]
  OTP --> B[Brevo email]
  WH --> X[Target URL]
  WH -.uses lib.-> RL
  LAB -.composes.-> RL
`;

export default async function Home() {
  const featured = await getFeaturedProjects();

  return (
    <div className="mx-auto max-w-4xl px-6">
      <section className="py-20 sm:py-28">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">
          Backend engineer · Thailand
        </p>
        <HeroSpotlight className="mt-4 block">
          <h1 className="hero-text text-4xl font-bold tracking-tight sm:text-5xl">
            Phatdanai Shinpanjapol
          </h1>
        </HeroSpotlight>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
          I build production Go services — real-time APIs, microservices, and
          core financial/auth systems. Currently growing toward full-stack and
          shipping reusable tools I plan to carry across employers.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3 text-sm">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 font-medium text-accent-foreground transition-opacity hover:opacity-90"
          >
            See projects <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 font-medium text-foreground transition-colors hover:bg-muted"
          >
            About me
          </Link>
        </div>
      </section>

      <section className="border-t border-border py-14">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Featured
          </h2>
          <Link
            href="/projects"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            All projects →
          </Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {featured.map((p, i) => (
            <div
              key={p.slug}
              className="reveal"
              style={{ ["--reveal-delay" as never]: `${i * 60}ms` }}
            >
              <TiltCard>
                <ProjectCard project={p} />
              </TiltCard>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border py-14">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          How this site works
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Everything you can click runs on one Vercel deployment talking to one
          Neon Postgres database. Research libraries from separate repos are
          ported into the portfolio and compose with each other.
        </p>
        <Mermaid caption="Portfolio system overview" chart={overviewDiagram} />
      </section>
    </div>
  );
}
