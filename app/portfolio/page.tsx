import { Page, PageIntro, SiteFooter } from "../_ui/layout";
import { Tile, TileGrid } from "../_ui/items";
import { projects } from "./projects";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Objects",
  description:
    "Physical projects by Amy Zhou: AI hardware, wearables, jewelry, mechanical engineering, and product design from Apple, Stanford, and personal work.",
  alternates: { canonical: "/portfolio" },
  openGraph: {
    type: "website",
    url: "/portfolio",
    title: "Objects, Amy Zhou",
    description:
      "Physical projects by Amy Zhou: AI hardware, wearables, jewelry, mechanical engineering, and product design from Apple, Stanford, and personal work.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Objects, Amy Zhou",
    description:
      "Physical projects by Amy Zhou: AI hardware, wearables, jewelry, mechanical engineering, and product design.",
  },
};

export default function PortfolioPage() {
  return (
    <Page active="portfolio">
      <PageIntro title="Objects.">Product design, mechanical engineering, jewelry, instruments, and the occasional craft.</PageIntro>
      <TileGrid label="All objects">
        {projects.map((p, i) => (
          <Tile key={p.slug} href={`/portfolio/${p.slug}`} image={p.cover} title={p.title} text={p.role} priority={i < 2} />
        ))}
      </TileGrid>
      <SiteFooter />
    </Page>
  );
}
