import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export type Status = "active" | "stable" | "experimental" | "archived";
export type Destination = "portable" | "personal" | "showcase";
export type Category = "library" | "project";

export type ProjectFrontmatter = {
  title: string;
  slug: string;
  summary: string;
  year: number;
  tech: string[];
  repo?: string;
  liveUrl?: string;
  status: Status;
  destination?: Destination[];
  featured?: boolean;
  order?: number;
  /** Coarse shape of the artifact — drives the grouping on /projects. */
  category?: Category;
  /** Skills this demo demonstrates — surfaced as pills on the /lab portal. */
  proves?: string[];
};

export type Project = ProjectFrontmatter & { content: string };

const PROJECTS_DIR = path.join(process.cwd(), "content", "projects");

async function readProjectFile(filename: string): Promise<Project> {
  const filePath = path.join(PROJECTS_DIR, filename);
  const raw = await fs.readFile(filePath, "utf8");
  const { data, content } = matter(raw);
  const slug = filename.replace(/\.mdx$/, "");
  return { ...(data as ProjectFrontmatter), slug, content };
}

export async function getAllProjects(): Promise<Project[]> {
  const files = (await fs.readdir(PROJECTS_DIR)).filter((f) => f.endsWith(".mdx"));
  const projects = await Promise.all(files.map(readProjectFile));
  return projects.sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
    if (a.order !== undefined) return -1;
    if (b.order !== undefined) return 1;
    return b.year - a.year;
  });
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  try {
    return await readProjectFile(`${slug}.mdx`);
  } catch {
    return null;
  }
}

export async function getFeaturedProjects(): Promise<Project[]> {
  const all = await getAllProjects();
  return all.filter((p) => p.featured);
}

/** Projects with a live, interactive demo mounted under /lab/<slug>. Powers
 * the /lab portal index — a project opts in simply by giving its frontmatter a
 * liveUrl under /lab/. */
export async function getLabDemos(): Promise<Project[]> {
  const all = await getAllProjects();
  return all.filter((p) => p.liveUrl?.startsWith("/lab/"));
}

/** Order categories appear in on /projects. Libraries first — they're the
 * carry-anywhere artifacts; projects follow. A "microservice" category will
 * come back if and when there's a real independently-deployed service to
 * put in it. */
export const CATEGORY_ORDER: Category[] = ["library", "project"];

export const CATEGORY_LABEL: Record<Category, string> = {
  library: "Libraries",
  project: "Projects",
};

export const CATEGORY_BLURB: Record<Category, string> = {
  library:
    "Importable Go modules — drop-in pieces designed to carry across services and employers.",
  project: "Full applications and portfolio features.",
};

/** groupByCategory returns projects bucketed by category. Each bucket gets
 * its own sort rule, chosen to match the reader's expectation for that
 * bucket — libraries are "chronological-shipped, oldest first" so the
 * lineage of how the toolkit grew reads left-to-right; projects are
 * "newest year first" so the most recent work is what catches the eye. */
export function groupByCategory(projects: Project[]): Record<Category, Project[]> {
  const out: Record<Category, Project[]> = {
    library: [],
    project: [],
  };
  for (const p of projects) {
    const cat = p.category ?? "project";
    out[cat].push(p);
  }
  out.library.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));
  out.project.sort(
    (a, b) => b.year - a.year || (a.order ?? Infinity) - (b.order ?? Infinity),
  );
  return out;
}
