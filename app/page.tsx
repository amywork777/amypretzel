import Image from "next/image";
import Link from "next/link";
import SiteNav from "./site-nav";
import { LinkList, TextLink } from "./_ui/link";
import { SectionHeading } from "./_ui/layout";
import BookOverlay from "./book/overlay";
import { Tile } from "./_ui/items";
import { projects } from "./portfolio/projects";

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

/* The short list a visitor sees first, newest first: a picture, the title, one short line of
   proof, then where it was made and the year it launched. Objects reuse their Objects cover;
   software uses a real frame from the app ("fill", since it is a screenshot, not an object). */
const cover = (slug: string) => projects.find(p => p.slug === slug)!.cover;
const selectedWork = [
  { href: "/software/studio", image: "/home/studio.webp", fill: true, context: "Open source", year: "2026", title: "Studio", text: "Open-source AI CAD for mechanical engineers." },
  { href: "/portfolio/folding-yoga-mat", image: cover("folding-yoga-mat"), context: "Vizcom", year: "2026", title: "Folding yoga mat", text: "From a creator's render to a manufactured mat." },
  { href: "/software/region-maps", image: "/home/region-maps.webp", fill: true, context: "Vizcom", year: "2026", title: "Region Maps", text: "Shipped: per-part color and material edits." },
  { href: "/software/lipflow", image: "/home/lipflow.webp", fill: true, context: "Open source", year: "2026", title: "Lipflow", text: "Silent dictation by lip reading. 700+ stars." },
  { href: "/portfolio/taya-pendant", image: cover("taya-pendant"), context: "Founder", year: "2025", title: "Taya", text: "A wearable AI journal designed as jewelry." },
  { href: "/portfolio/ai-jewelry", image: cover("ai-jewelry"), context: "Founder", year: "2025", title: "Taiyaki Jewelry", text: "Sketches turned into cast silver and gold." },
  { href: "/portfolio/taiyaki-3d", image: cover("taiyaki-3d"), context: "Founder", year: "2025", title: "Taiyaki 3D", text: "AI concept-to-CAD, covered by Fabbaloo." },
  { href: "/portfolio/iphone-finewoven", image: cover("iphone-finewoven"), context: "Apple", year: "2023", title: "iPhone FineWoven case", text: "Led materials and integration. Patent co-inventor." },
];

export default function Home() {
  return (
    <div className="home-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />
      <BookOverlay />
      <SiteNav />
      <main id="main-content" className="ui-column">
        <section id="about" className="home-intro" aria-labelledby="intro-title">
          <h1 id="intro-title" className="sr-only">Amy Zhou</h1>
          <p className="ui-display home-statement">I like building <TextLink href="/portfolio">objects</TextLink>, and <TextLink href="/software">software</TextLink> to build objects.</p>
          <div className="personal-intro">
            <Image className="personal-portrait" src="/amy-portrait.jpg" alt="Amy Zhou" width={800} height={800} sizes="110px" priority />
            <div className="personal-copy ui-prose">
              <p>Now at Vizcom, building AI tools for industrial designers. Before that I started a few things: Taiyaki, an AI concept-to-CAD tool; Taya, a wearable AI journal as jewelry; and Mobius, materials trading and recycling. Earlier, product design engineering at Apple, and product design and mechanical engineering at Stanford.</p>
              <p>Mostly interested in AI for CAD, engineering, and making physical things.</p>
              <LinkList label="Contact Amy" links={contactLinks} />
              {/* A second pretzel, pink and sprinkled, left lying here: it leads to the secret facts page. */}
              <Link href="/facts" className="secret-pretzel" aria-label="Cool facts" title="psst"><Image src="/pretzel-secret.png" alt="" width={192} height={192} sizes="30px" /></Link>
            </div>
          </div>
        </section>
        <section className="home-work" aria-labelledby="selected-work-title">
          <SectionHeading id="selected-work-title">Selected work</SectionHeading>
          <div className="ui-tile-grid home-work-grid">
            {selectedWork.map(item => (
              <Tile key={item.href} href={item.href} image={item.image} fill={item.fill} title={item.title} text={item.text} meta={`${item.context}, ${item.year}`} as="h3" />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
