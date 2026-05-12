import { GithubIcon, LinkedinIcon } from "./icons";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
        <p>&copy; {new Date().getFullYear()} Phatdanai Shinpanjapol</p>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/PS-safe"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-foreground"
            aria-label="GitHub"
          >
            <GithubIcon className="h-4 w-4" />
          </a>
          <a
            href="https://www.linkedin.com/in/ps-shin/"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-foreground"
            aria-label="LinkedIn"
          >
            <LinkedinIcon className="h-4 w-4" />
          </a>
        </div>
      </div>
    </footer>
  );
}
