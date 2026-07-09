import type { MetadataRoute } from "next";
import { projects } from "./portfolio/projects";

const SITE = "https://amypretzel.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    { url: `${SITE}/`, lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE}/work`, lastModified: now, changeFrequency: "monthly", priority: 0.98 },
    { url: `${SITE}/software`, lastModified: now, changeFrequency: "monthly", priority: 0.95 },
    { url: `${SITE}/portfolio`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    ...projects.map((p) => ({
      url: `${SITE}/portfolio/${p.slug}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.7,
    })),
  ];
}
