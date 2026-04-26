import type { MetadataRoute } from "next";
import { projects } from "./portfolio/projects";
import { getAllPosts } from "./writing/posts";

const SITE = "https://amypretzel.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts();
  const now = new Date();

  return [
    { url: `${SITE}/`, lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE}/portfolio`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE}/writing`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    ...projects.map((p) => ({
      url: `${SITE}/portfolio/${p.slug}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.7,
    })),
    ...posts.map((p) => ({
      url: `${SITE}/writing/${p.slug}`,
      lastModified: new Date(`${p.date}T00:00:00Z`),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
