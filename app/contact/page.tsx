import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Contact",
  description: "Reach me on email, LinkedIn, or GitHub.",
};

const links = [
  {
    label: "Email",
    value: "phatdanai.shin@gmail.com",
    href: "mailto:phatdanai.shin@gmail.com",
    Icon: Mail,
  },
  {
    label: "LinkedIn",
    value: "linkedin.com/in/ps-shin",
    href: "https://www.linkedin.com/in/ps-shin/",
    Icon: LinkedinIcon,
  },
  {
    label: "GitHub",
    value: "github.com/PS-safe",
    href: "https://github.com/PS-safe",
    Icon: GithubIcon,
  },
];

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <header className="border-b border-border pb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">
          Contact
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground">
          Get in touch
        </h1>
        <p className="mt-3 max-w-2xl text-base text-muted-foreground">
          Open to interesting backend / full-stack roles and collaboration on
          reusable developer tooling. Easiest reach is email or LinkedIn.
        </p>
      </header>

      <ul className="mt-10 space-y-3">
        {links.map(({ label, value, href, Icon }) => (
          <li key={label}>
            <a
              href={href}
              target={href.startsWith("mailto:") ? undefined : "_blank"}
              rel="noreferrer"
              className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-5 transition-colors hover:border-accent"
            >
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    {label}
                  </p>
                  <p className="mt-0.5 font-mono text-sm text-foreground">
                    {value}
                  </p>
                </div>
              </div>
              <span className="text-sm text-muted-foreground">→</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
