import Image from "next/image";
import Link from "next/link";
import SiteNav from "./site-nav";
import { LinkList, TextLink } from "./_ui/link";
import { SiteFooter } from "./_ui/layout";
import BookOverlay from "./book/overlay";
import { Shelf, type ShelfItem } from "./_ui/shelf";
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

/* The work, as a shelf: every object straight on the page, manufacturing first
   (what Amy cares most about now), then Apple, then the earlier studies from
   Stanford and home. Software follows as one quiet row of screenshots of each
   app in use, CAD tools first. Names show on hover; details live on each
   project's page. */
const object = (slug: string): ShelfItem => {
  const p = projects.find(p => p.slug === slug)!;
  return { href: `/portfolio/${slug}`, image: p.cover, title: p.title };
};
const objects: ShelfItem[] = [
  ...["folding-yoga-mat", "taya-pendant", "ai-jewelry", "iphone-finewoven", "ipad-smart-folio"].map(object),
  ...studyProjects.map(p => object(p.slug)),
];

const screenshot: Record<string, string> = { studio: "/home/studio.webp", "taiyaki-3d": projects.find(p => p.slug === "taiyaki-3d")!.cover, "region-maps": "/home/region-maps.webp", lipflow: "/home/lipflow-in-use.webp" };
const software: ShelfItem[] = ["studio", "taiyaki-3d", "region-maps", "lipflow", "cad-steps", "extract", "smart-dropper", "voice-input", "sf-rats", "cute-ghostty", "screenie", "selfie-booth"].map(slug => ({
  href: `/software/${slug}`,
  image: screenshot[slug] ?? `/work/${slug}.webp`,
  title: softwareProjects.find(p => p.slug === slug)!.title,
}));

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
        <section id="objects" className="home-shelf" aria-labelledby="objects-title">
          <h2 id="objects-title" className="sr-only">Objects</h2>
          <Shelf items={objects} label="Objects" />
        </section>
        <section id="software" className="home-shelf" aria-labelledby="software-title">
          <h2 id="software-title" className="home-shelf-title">And software to build them</h2>
          <Shelf items={software} variant="screens" label="Software" />
        </section>
        <SiteFooter home={false} />
      </main>
    </div>
  );
}
