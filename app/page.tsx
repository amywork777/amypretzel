import Image from "next/image";
import Link from "next/link";
import SiteNav from "./site-nav";
import { LinkList } from "./_ui/link";
import { SectionHeading, SiteFooter } from "./_ui/layout";
import BookOverlay from "./book/overlay";
import { Earlier, List, type ListItem } from "./_ui/list";
import { projects, studyProjects } from "./portfolio/projects";
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

/* Plain lists, like Felix Rieseberg's site: a short Work list of names and
   roles, then the things grouped by kind. Each row is a small picture, a
   title, one line and a year. Physical products lead, since manufacturing is
   what Amy is most into; the earlier studies fold away under one line. Years
   come from a real source (launch post, repo, patent). */
const work = [
  { name: "Vizcom", role: "Now" },
  { name: "Taiyaki", role: "Founder" },
  { name: "Taya", role: "Founder" },
  { name: "Mobius", role: "Founder" },
  { name: "Apple", role: "Product design engineer" },
  { name: "Stanford", role: "Student" },
];

const cover = (slug: string) => projects.find(p => p.slug === slug)!;
const object = (slug: string, text: string, year?: string): ListItem => ({ href: `/portfolio/${slug}`, image: cover(slug).cover, title: cover(slug).title, text, year });
const objects: ListItem[] = [
  object("folding-yoga-mat", "From a creator's render to a manufactured mat.", "2026"),
  object("taya-pendant", "A wearable AI journal designed as jewelry.", "2025"),
  object("ai-jewelry", "Sketches cast in silver and gold.", "2025"),
  object("iphone-finewoven", "Led materials and integration. Patent co-inventor.", "2023"),
  object("ipad-smart-folio", "Apple accessories."),
];
const earlier: ListItem[] = studyProjects.map(p => ({ href: `/portfolio/${p.slug}`, image: p.cover, title: p.title, text: p.role }));

const screenshot: Record<string, string> = { studio: "/home/studio.webp", "taiyaki-3d": cover("taiyaki-3d").cover, "region-maps": "/home/region-maps.webp", lipflow: "/home/lipflow-in-use.webp" };
const app = (slug: string, text: string, year: string): ListItem => ({
  href: `/software/${slug}`, image: screenshot[slug] ?? `/work/${slug}.webp`, screen: slug !== "taiyaki-3d",
  title: softwareProjects.find(p => p.slug === slug)!.title, text, year,
});
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
          <h1 id="intro-title" className="ui-display home-hello">Hi, I&apos;m Amy.</h1>
          <p className="home-lede">I build objects, and software to build objects. Right now I work on AI tools for industrial designers at Vizcom in San Francisco.</p>
          <LinkList label="Contact Amy" links={contactLinks} />
          {/* A second pretzel, pink and sprinkled, left lying here: it leads to the secret facts page. */}
          <Link href="/facts" className="secret-pretzel" aria-label="Cool facts" title="psst"><Image src="/pretzel-secret.png" alt="" width={192} height={192} sizes="30px" /></Link>
        </section>
        <section id="work" className="home-list" aria-labelledby="work-title">
          <SectionHeading id="work-title">Work</SectionHeading>
          <ul className="ui-list ui-list--plain">
            {work.map(w => (
              <li key={w.name} className="ui-list-row">
                <span className="ui-list-title">{w.name}</span>
                <span className="ui-list-year">{w.role}</span>
              </li>
            ))}
          </ul>
        </section>
        <section id="products" className="home-list" aria-labelledby="products-title">
          <SectionHeading id="products-title" note="Manufactured">Physical products</SectionHeading>
          <List items={objects} label="Physical products" />
          <Earlier title="Earlier, at Stanford and home" count={earlier.length}>
            <List items={earlier} label="Earlier objects" small />
          </Earlier>
        </section>
        <section id="ai-tools" className="home-list" aria-labelledby="ai-tools-title">
          <SectionHeading id="ai-tools-title" note="At Vizcom">AI tools for designers</SectionHeading>
          <List items={aiTools} label="AI tools for designers" />
        </section>
        <section id="cad" className="home-list" aria-labelledby="cad-title">
          <SectionHeading id="cad-title">3D and CAD</SectionHeading>
          <List items={cad} label="3D and CAD" />
        </section>
        <section id="tools" className="home-list" aria-labelledby="tools-title">
          <SectionHeading id="tools-title" note="Side projects">Tools and toys</SectionHeading>
          <List items={tools} label="Tools and toys" />
        </section>
        <SiteFooter home={false} />
      </main>
    </div>
  );
}
