import { Page, PageIntro, SectionHeading, SiteFooter } from "../_ui/layout";
import { Row, RowGroup, Tile, TileGrid } from "../_ui/items";
import { earlierGroups, projects, selectedProjects } from "./projects";

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

const titleOf = Object.fromEntries(projects.map(p => [p.slug, p.title]));

export default function PortfolioPage() {
  return (
    <Page active="portfolio">
      <PageIntro title="Objects.">Products I designed and engineered, at Apple, at Vizcom and at my own companies. Below them, earlier studies from Stanford and my own projects.</PageIntro>
      <SectionHeading>Selected</SectionHeading>
      <TileGrid label="Selected objects">
        {selectedProjects.map((p, i) => (
          <Tile key={p.slug} href={`/portfolio/${p.slug}`} image={p.cover} title={p.title} text={p.role} priority={i < 3} as="h3" />
        ))}
      </TileGrid>
      <section className="objects-earlier" aria-labelledby="earlier-work-title">
        <SectionHeading id="earlier-work-title">Earlier work</SectionHeading>
        {earlierGroups.map(group => (
          <RowGroup key={group.title} title={group.title}>
            {group.items.map(item => (
              <Row key={item.slug} href={`/portfolio/${item.slug}`} title={titleOf[item.slug]} text={item.text} as="h4" />
            ))}
          </RowGroup>
        ))}
      </section>
      <SiteFooter />
    </Page>
  );
}
