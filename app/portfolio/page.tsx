import { Page, PageIntro, SectionHeading, SiteFooter } from "../_ui/layout";
import { Tile, TileGrid } from "../_ui/items";
import { FoldGrid } from "../_ui/fold";
import { selectedProjects, studyProjects, workStudyProjects } from "./projects";

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
      <PageIntro title="Objects.">Products I designed and engineered, at Apple, at Vizcom and at my own companies. Below them, <span className="work-only">earlier studies from Stanford.</span><span className="personal-only">earlier studies from Stanford and things I make for fun.</span></PageIntro>
      <SectionHeading>Selected</SectionHeading>
      <TileGrid label="Selected objects">
        {selectedProjects.map((p, i) => (
          <Tile key={p.slug} href={`/portfolio/${p.slug}`} image={p.cover} title={p.title} text={p.role} priority={i < 3} as="h3" />
        ))}
      </TileGrid>
      <section className="objects-earlier" aria-labelledby="earlier-work-title">
        <SectionHeading id="earlier-work-title">Earlier work</SectionHeading>
        <div className="work-only">
          <FoldGrid label="Earlier work" total={workStudyProjects.length}>
            {workStudyProjects.map(p => (
              <Tile key={p.slug} href={`/portfolio/${p.slug}`} image={p.cover} title={p.title} text={p.role} small as="h3" />
            ))}
          </FoldGrid>
        </div>
        <div className="personal-only">
          <FoldGrid label="Earlier work and crafts" total={studyProjects.length}>
            {studyProjects.map(p => (
              <Tile key={p.slug} href={`/portfolio/${p.slug}`} image={p.cover} title={p.title} text={p.role} small as="h3" />
            ))}
          </FoldGrid>
        </div>
      </section>
      <SiteFooter />
    </Page>
  );
}
