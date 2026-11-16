import Image from "next/image";
import Link from "next/link";
import SiteNav from "./site-nav";
import { LinkList, TextLink } from "./_ui/link";
import { SectionHeading } from "./_ui/layout";
import BookOverlay from "./book/overlay";

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

/* The short list a visitor sees first: where each thing was made, what it is, and the proof. */
const selectedWork = [
  { href: "/software/studio", context: "Open source", title: "Studio", text: "A free AI CAD app for mechanical engineers. Describe a part, get a real feature-tree model, test it and send it to be made." },
  { href: "/software/region-maps", context: "Vizcom", title: "Region Maps", text: "Shipped: edit each part's color, material and pattern in a product render without re-rendering." },
  { href: "/portfolio/folding-yoga-mat", context: "Vizcom", title: "Folding yoga mat", text: "A creator's render taken to a manufactured origami mat, with AI agents doing the CAD, drawings and supplier work." },
  { href: "/portfolio/iphone-finewoven", context: "Apple", title: "iPhone FineWoven case", text: "Led materials development and mechanical integration. Co-inventor on the patent." },
  { href: "/software/lipflow", context: "Open source", title: "Lipflow", text: "Silent dictation by lip reading, running locally. 700+ stars on GitHub." },
  { href: "/portfolio/taiyaki-3d", context: "Founder", title: "Taiyaki 3D", text: "AI concept-to-CAD for hardware teams, covered by Fabbaloo and 3Printr." },
  { href: "/portfolio/taya-pendant", context: "Founder", title: "Taya", text: "A wearable AI journal designed as jewelry: enclosure, audio hardware and app." },
  { href: "/portfolio/ai-jewelry", context: "Founder", title: "Taiyaki Jewelry", text: "Sketches and photos turned into cast silver and gold pieces, for real customers." },
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
          <ul>
            {selectedWork.map(item => (
              <li key={item.href}>
                <Link href={item.href} className="home-work-row">
                  <span className="home-work-context">{item.context}</span>
                  <h3 className="ui-item-title">{item.title}</h3>
                  <p className="ui-item-text">{item.text}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
