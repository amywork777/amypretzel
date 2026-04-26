import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";

/* ─────────────────────────────────────────────────────────────────────────────
   Notes / writing posts
   ─────────────────────────────────────────────────────────────────────────────

   Each note is one MDX file in `content/notes/<slug>.mdx`.
   The filename (minus `.mdx`) becomes the URL slug: /writing/<slug>.

   Frontmatter contract (YAML at the top of the file, between `---` lines):

     title:       string, required for "real" articles. Omit for short notes.
     date:        ISO date string "YYYY-MM-DD", required. Used for sort + meta.
     description: string, optional. ~140-160 chars, ends on a period. Used for
                  <meta name="description">, og:description, twitter:description,
                  and the JSON-LD description on the article page. Falls back to
                  the first body paragraph (truncated to 160 chars) if omitted.
                  Hand-write it for any article you want to share, since the
                  auto-fallback often cuts mid-sentence.
     originalUrl: string, optional. Link to the original post (e.g. an X thread)
                  if the note was published elsewhere first. Renders as a small
                  "Originally posted on X ↗" link in the header and is added
                  to JSON-LD `sameAs`.

   Body: standard MDX. Renderer is `app/writing/mdx-components.tsx`, which
   styles h1/h2/h3 (use `##` and `###` for sections), paragraphs, lists,
   blockquotes, links, code, and `<hr />`. No imports of React components in
   the MDX body unless you also extend mdxComponents.

   ───────────────────────────────────────────────────────────────────────────── */

const NOTES_DIR = path.join(process.cwd(), "content", "notes");

export type PostMeta = {
  slug: string;
  date: string;            // ISO "2026-04-15"
  title?: string;
  description?: string;
  originalUrl?: string;
};

export type PostFull = PostMeta & {
  /** Raw MDX body, no frontmatter */
  body: string;
};

async function readPostFile(file: string): Promise<PostFull> {
  const slug = file.replace(/\.mdx?$/, "");
  const raw = await fs.readFile(path.join(NOTES_DIR, file), "utf8");
  const { data, content } = matter(raw);
  return {
    slug,
    date: String(data.date ?? ""),
    title: data.title ? String(data.title) : undefined,
    description: data.description ? String(data.description) : undefined,
    originalUrl: data.originalUrl ? String(data.originalUrl) : undefined,
    body: content.trim(),
  };
}

/** All posts, newest first */
export async function getAllPosts(): Promise<PostFull[]> {
  const entries = await fs.readdir(NOTES_DIR);
  const files = entries.filter((f) => f.endsWith(".mdx") || f.endsWith(".md"));
  const posts = await Promise.all(files.map(readPostFile));
  posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return posts;
}

/** Single post by slug, or null if missing */
export async function getPost(slug: string): Promise<PostFull | null> {
  const posts = await getAllPosts();
  return posts.find((p) => p.slug === slug) ?? null;
}

export function readingTime(body: string): string {
  const words = body.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.round(words / 220));
  return `${minutes} min read`;
}

export function excerpt(body: string): string {
  // first non-heading, non-list paragraph
  const blocks = body.split(/\n\s*\n/);
  for (const b of blocks) {
    const trimmed = b.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("#") || trimmed.startsWith("- ")) continue;
    return trimmed;
  }
  return blocks[0] ?? "";
}

/** Card / index preview text. Prefers the handwritten frontmatter
 *  `description` (also used as the SEO meta description) and falls back to
 *  the first body paragraph. Use this anywhere a post preview is shown. */
export function summary(post: { description?: string; body: string }): string {
  return post.description ?? excerpt(post.body);
}

export function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
