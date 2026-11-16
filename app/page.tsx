import Image from "next/image";
import Link from "next/link";
import SiteNav from "./site-nav";
import { LinkList, TextLink } from "./_ui/link";
import { SectionHeading, SiteFooter } from "./_ui/layout";
import BookOverlay from "./book/overlay";
import { Tile } from "./_ui/items";
import { FoldGrid } from "./_ui/fold";
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

/* Two halves, as the statement says: objects, then software. Each leads with
   its strongest work as full tiles: a picture, the title with its launch year,
   and one short line of proof that says where it was made when that matters.
   Manufacturing leads Objects and the CAD tools lead Software. Everything else
   follows as small titled thumbnails folded behind one pill. Objects use their cover; software uses a
   real frame of the app in use ("fill", since it is a screenshot, not an object). */
type Work = { href: string; image: string; fill?: boolean; title: string; text?: string; year?: string };
const object = (slug: string) => projects.find(p => p.slug === slug)!;
const software = (slug: string) => softwareProjects.find(p => p.slug === slug)!;

const objectsTop: Work[] = [
  { href: "/portfolio/folding-yoga-mat", image: object("folding-yoga-mat").cover, year: "2026", title: "Folding yoga mat", text: "A creator's render, made into a real mat at Vizcom." },
  { href: "/portfolio/taya-pendant", image: object("taya-pendant").cover, year: "2025", title: "Taya", text: "A wearable AI journal designed as jewelry." },
  { href: "/portfolio/ai-jewelry", image: object("ai-jewelry").cover, year: "2025", title: "Taiyaki Jewelry", text: "Sketches turned into cast silver and gold." },
  { href: "/portfolio/iphone-finewoven", image: object("iphone-finewoven").cover, year: "2023", title: "iPhone FineWoven case", text: "At Apple: led materials, patent co-inventor." },
];
const objectsMore: Work[] = [object("ipad-smart-folio"), ...studyProjects].map(p => ({
  href: `/portfolio/${p.slug}`, image: p.cover, title: p.title,
}));

const softwareTop: Work[] = [
  { href: "/software/studio", image: "/home/studio.webp", fill: true, year: "2026", title: "Studio", text: "Open-source AI CAD for mechanical engineers." },
  { href: "/software/taiyaki-3d", image: object("taiyaki-3d").cover, year: "2025", title: "Taiyaki 3D", text: "AI concept-to-CAD, covered by Fabbaloo." },
  { href: "/software/region-maps", image: "/home/region-maps.webp", fill: true, year: "2026", title: "Region Maps", text: "Shipped at Vizcom: per-part color and material edits." },
  { href: "/software/lipflow", image: "/home/lipflow-in-use.webp", fill: true, year: "2026", title: "Lipflow", text: "Open-source silent dictation by lip reading. 700+ stars." },
];
const softwareMore: Work[] = ["cad-steps", "extract", "smart-dropper", "voice-input", "sf-rats", "cute-ghostty", "screenie", "selfie-booth"].map(slug => {
  return { href: `/software/${slug}`, image: `/work/${slug}.webp`, fill: true, title: software(slug).title };
});

function WorkSection({ id, title, top, more }: { id: string; title: string; top: Work[]; more: Work[] }) {
  return (
    <section id={id} className="home-work" aria-labelledby={`${id}-title`}>
      <SectionHeading id={`${id}-title`}>{title}</SectionHeading>
      <div className="ui-tile-grid home-work-grid">
        {top.map(item => <Tile key={item.href} href={item.href} image={item.image} fill={item.fill} title={item.title} text={item.text} year={item.year} as="h3" />)}
      </div>
      <FoldGrid label={`More ${title.toLowerCase()}`} total={more.length}>
        {more.map(item => <Tile key={item.href} href={item.href} image={item.image} fill={item.fill} title={item.title} small as="h3" />)}
      </FoldGrid>
    </section>
  );
}

export default function Home() {
  return (
    <div className="home-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />
      <BookOverlay />
      <SiteNav />
      <main id="main-content" className="ui-column">
        <section id="about" className="home-intro" aria-labelledby="intro-title">
          <h1 id="intro-title" className="sr-only">Amy Zhou</h1>
          <p className="ui-display home-statement">I like building <TextLink href="#objects">objects</TextLink>, and <TextLink href="#software">software</TextLink> to build objects.</p>
          <div className="personal-intro">
            <Image className="personal-portrait" src="/amy-portrait.jpg" alt="Amy Zhou" width={800} height={800} sizes="110px" priority />
            <div className="personal-copy ui-prose">
              <p>Now at Vizcom, building AI tools for industrial designers. Before that, my own startups, Apple and Stanford.</p>
              <LinkList label="Contact Amy" links={contactLinks} />
              {/* A second pretzel, pink and sprinkled, left lying here: it leads to the secret facts page. */}
              <Link href="/facts" className="secret-pretzel" aria-label="Cool facts" title="psst"><Image src="/pretzel-secret.png" alt="" width={192} height={192} sizes="30px" /></Link>
            </div>
          </div>
        </section>
        <WorkSection id="objects" title="Objects" top={objectsTop} more={objectsMore} />
        <WorkSection id="software" title="Software" top={softwareTop} more={softwareMore} />
        <SiteFooter home={false} />
      </main>
    </div>
  );
}
