import Image from "next/image";
import Link from "next/link";
import SiteNav from "./site-nav";
import { LinkList, TextLink } from "./_ui/link";
import { SiteFooter } from "./_ui/layout";
import { OpenOnHash } from "./_ui/open-on-hash";
import BookOverlay from "./book/overlay";
import { Earlier, Group, List, type ListItem } from "./_ui/list";
import { projects, studyProjects, thumbOf } from "./portfolio/projects";
import { softwareProjects } from "./software/projects";

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Amy Zhou",
  alternateName: "amypretzel",
  url: "https://amypretzel.com",
  image: "https://amypretzel.com/amy-portrait.jpg",
  description:
    "Builds objects, and software to build objects. Building AI tools for industrial designers at Vizcom. Previously Apple, Stanford.",
  worksFor: { "@type": "Organization", name: "Vizcom", url: "https://www.vizcom.ai" },
  alumniOf: [
    { "@type": "CollegeOrUniversity", name: "Stanford University", url: "https://www.stanford.edu" },
  ],
  knowsAbout: [
    "Product design",
    "Mechanical engineering",
    "Industrial design",
    "AI hardware",
    "Wearables",
    "Jewelry design",
  ],
  address: {
    "@type": "PostalAddress",
    addressLocality: "San Francisco",
    addressRegion: "CA",
    addressCountry: "US",
  },
  sameAs: [
    "https://x.com/amypretzel",
    "https://linkedin.com/in/amy7",
    "https://github.com/amywork777",
  ],
};

const contactLinks = [
  { href: "mailto:amzyst@gmail.com", label: "amzyst@gmail.com" },
  { href: "https://x.com/amypretzel", label: "Twitter" },
  { href: "https://github.com/amywork777", label: "GitHub" },
  { href: "https://linkedin.com/in/amy7", label: "LinkedIn" },
];

/* Amy's own bio and portrait, then the things grouped by kind, each group
   closed to one line with a strip of its pictures so the page stays short.
   Opened, a group is a plain list like Felix Rieseberg's site: a picture, a
   title, one line and a year. Physical products lead, since manufacturing is
   what Amy is most into; the earlier studies fold away under one line. Years
   come from a real source (launch post, repo, patent). */
const cover = (slug: string) => projects.find(p => p.slug === slug)!;
const object = (slug: string, text: string, year?: string): ListItem => ({ href: `/portfolio/${slug}`, ...thumbOf(slug), title: cover(slug).title, text, year });
const objects: ListItem[] = [
  object("folding-yoga-mat", "From a creator's render to a manufactured mat.", "2026"),
  object("taya-pendant", "A wearable AI journal designed as jewelry.", "2025"),
  object("ai-jewelry", "Sketches cast in silver and gold.", "2025"),
  object("iphone-finewoven", "Led materials and integration. Patent co-inventor.", "2023"),
  object("ipad-smart-folio", "Apple accessories."),
];
const earlier: ListItem[] = studyProjects.map(p => ({ href: `/portfolio/${p.slug}`, ...thumbOf(p.slug), title: p.title, text: p.role }));

const app = (slug: string, text: string, year: string): ListItem => {
  const p = softwareProjects.find(p => p.slug === slug)!;
  return { href: `/software/${slug}`, image: p.picture!.image, cutout: p.picture!.cutout, title: p.title, text, year };
};
const aiTools: ListItem[] = [
  app("region-maps", "Edit each part's color and material in a render.", "2026"),
  app("extract", "Pull colors, materials and parts out of an image.", "2026"),
  app("smart-dropper", "Copy one image's style onto another.", "2026"),
  app("voice-input", "Speak prompts, in any language.", "2026"),
];
const cad: ListItem[] = [
  app("studio", "Open-source AI CAD for mechanical engineers.", "2026"),
  app("taiyaki-3d", "AI concept-to-CAD for hardware teams.", "2025"),
  app("cad-steps", "A dataset of CAD models built step by step.", "2026"),
];
const tools: ListItem[] = [
  app("lipflow", "Silent dictation by lip reading. 700+ stars.", "2026"),
  app("sf-rats", "A live map of free Bay Area events.", "2024"),
  app("cute-ghostty", "A pastel terminal setup.", "2026"),
  app("screenie", "A screen recorder that edits while you record.", "2026"),
  app("selfie-booth", "An iPad photo booth that prints stickers.", "2026"),
];

export default function Home() {
  return (
    <div className="home-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />
      <BookOverlay />
      <SiteNav />
      <main id="main-content" className="ui-column ui-column--list">
        <section id="about" className="home-intro" aria-labelledby="intro-title">
          <h1 id="intro-title" className="sr-only">Amy Zhou</h1>
          <p className="ui-display home-statement">I like building <TextLink href="#products">objects</TextLink>, and <TextLink href="#ai-tools">software</TextLink> to build objects.</p>
          <div className="personal-intro">
            <Image className="personal-portrait" src="/amy-portrait.jpg" alt="Amy Zhou" width={800} height={800} sizes="110px" priority />
            <div className="personal-copy ui-prose">
              <p>Now at <strong>Vizcom</strong>. Before that I had a startup where we explored a few ideas: materials recycling, AI concept-to-CAD, and an AI journal you wear as jewelry. Earlier, <strong>Apple</strong> and <strong>Stanford</strong>.</p>
              <p>Mostly interested in AI for CAD, engineering, and making physical things.</p>
              <LinkList label="Contact Amy" links={contactLinks} />
              {/* A second pretzel, pink and sprinkled, left lying here: it leads to the secret facts page. */}
              <Link href="/facts" className="secret-pretzel" aria-label="Cool facts" title="psst"><Image src="/pretzel-secret.png" alt="" width={192} height={192} sizes="30px" /></Link>
            </div>
          </div>
        </section>
        <div className="home-groups">
          <Group id="products" title="Physical products" note="Things I designed and took from sketch to factory." items={objects}>
            <List items={objects} label="Physical products" />
            <Earlier title="Earlier, at Stanford and home" count={earlier.length}>
              <List items={earlier} label="Earlier objects" small />
            </Earlier>
          </Group>
          <Group id="ai-tools" title="AI tools for designers" note="Features I built at Vizcom for industrial designers." items={aiTools}>
            <List items={aiTools} label="AI tools for designers" />
          </Group>
          <Group id="cad" title="3D and CAD" note="Software and data for turning ideas into real CAD." items={cad}>
            <List items={cad} label="3D and CAD" />
          </Group>
          <Group id="tools" title="Tools and toys" note="Side projects, mostly made for fun." items={tools}>
            <List items={tools} label="Tools and toys" />
          </Group>
        </div>
        <OpenOnHash />
        <SiteFooter home={false} />
      </main>
    </div>
  );
}
