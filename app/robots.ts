import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: "https://amypretzel.com/sitemap.xml",
    host: "https://amypretzel.com",
  };
}
