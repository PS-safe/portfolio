import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export type Status = "active" | "stable" | "experimental" | "archived";
export type Destination = "portable" | "personal" | "showcase";
export type Category = "library" | "microservice" | "project";

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

/** Order categories appear in on /projects (libraries first — they're the
 * carry-anywhere artifacts; microservices and projects follow). */
export const CATEGORY_ORDER: Category[] = ["library", "microservice", "project"];

export const CATEGORY_LABEL: Record<Category, string> = {
  library: "Libraries",
  microservice: "Microservices",
  project: "Projects",
};

export const CATEGORY_BLURB: Record<Category, string> = {
  library:
    "Importable Go modules — drop-in pieces designed to carry across services and employers.",
  microservice:
    "Service-shaped features with their own API, storage, and lifecycle.",
  project: "Full applications and products.",
};

/** groupByCategory returns projects bucketed by category, preserving the
 * existing per-project order inside each bucket. Items with no category
 * land in "project" by default — a safe catch-all. */
export function groupByCategory(projects: Project[]): Record<Category, Project[]> {
  const out: Record<Category, Project[]> = {
    library: [],
    microservice: [],
    project: [],
  };
  for (const p of projects) {
    const cat = p.category ?? "project";
    out[cat].push(p);
  }
  return out;
}
