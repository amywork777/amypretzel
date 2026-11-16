import { Page, PageIntro, SectionHeading, SiteFooter } from "../_ui/layout";
import { Tile, TileGrid } from "../_ui/items";
import { selectedProjects, studyProjects } from "./projects";

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
      <PageIntro title="Objects.">Products I designed and engineered, at Apple, at Vizcom and at my own companies. Below them, studies from Stanford and things I make for fun.</PageIntro>
      <SectionHeading>Selected</SectionHeading>
      <TileGrid label="Selected objects">
        {selectedProjects.map((p, i) => (
          <Tile key={p.slug} href={`/portfolio/${p.slug}`} image={p.cover} title={p.title} text={p.role} priority={i < 3} as="h3" />
        ))}
      </TileGrid>
      <SectionHeading>Studies and crafts</SectionHeading>
      <TileGrid label="Studies and crafts" compact>
        {studyProjects.map(p => (
          <Tile key={p.slug} href={`/portfolio/${p.slug}`} image={p.cover} title={p.title} text={p.role} compact as="h3" />
        ))}
      </TileGrid>
      <SiteFooter />
    </Page>
  );
}
