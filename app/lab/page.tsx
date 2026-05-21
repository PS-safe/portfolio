import type { Metadata } from "next";
import { HeroSpotlight } from "@/components/hero-spotlight";
import { LabCard } from "@/components/lab/lab-card";
import { getLabDemos } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Lab",
  description:
    "Interactive demos you can touch in the browser — each one proves a slice of the stack, from full-stack composition to client-side problem solving.",
};

export default async function LabPage() {
  const demos = await getLabDemos();

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <header className="border-b border-border pb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">Lab</p>
        <HeroSpotlight className="mt-3 block">
          <h1 className="hero-text text-4xl font-bold tracking-tight">
            Things you can touch
          </h1>
        </HeroSpotlight>
        <p className="mt-3 max-w-2xl text-base text-muted-foreground">
          Live, interactive demos — no video, no screenshots. Each one runs in
          your browser and proves a specific slice of the craft. Try it here,
          then read the writeup on the project page.
        </p>
      </header>

      {demos.length === 0 ? (
        <p className="mt-12 text-sm text-muted-foreground">No demos yet.</p>
      ) : (
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {demos.map((demo, i) => (
            <div
              key={demo.slug}
              className="reveal"
              style={{ ["--reveal-delay" as never]: `${i * 50}ms` }}
            >
              <LabCard project={demo} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
