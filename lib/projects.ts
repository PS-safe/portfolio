import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export type Status = "active" | "stable" | "experimental" | "archived";
export type Destination = "portable" | "personal" | "showcase";

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
