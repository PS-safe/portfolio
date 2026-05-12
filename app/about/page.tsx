import type { Metadata } from "next";
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
      <header className="border-b border-border pb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">
          About
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground">
          {about.name}
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          {about.title} · {about.location}
        </p>
      </header>
      <article className="pt-2">
        <Mdx source={about.content} />
      </article>
    </div>
  );
}
