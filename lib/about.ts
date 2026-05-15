import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export type AboutFrontmatter = {
  name: string;
  title: string;
  location: string;
  email: string;
  github?: string;
  linkedin?: string;
  /** Short "what I'm doing right now" line for the status pill. */
  currently?: string;
};

export type About = AboutFrontmatter & { content: string };

export async function getAbout(): Promise<About> {
  const filePath = path.join(process.cwd(), "content", "about.mdx");
  const raw = await fs.readFile(filePath, "utf8");
  const { data, content } = matter(raw);
  return { ...(data as AboutFrontmatter), content };
}
