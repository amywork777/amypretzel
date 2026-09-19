import Image from "next/image";
import Link from "next/link";
import SiteNav from "./site-nav";
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

export default function Home() {
  return (
    <div className="home-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />
      <BookOverlay />
      <SiteNav />
      <main id="main-content" className="site-width">
        <section id="about" className="home-intro" aria-labelledby="intro-title">
          <h1 id="intro-title" className="sr-only">Amy Zhou</h1>
          <p className="text-display intro-statement">I like building <Link href="/portfolio">objects</Link>, and <Link href="/software">software</Link> to build objects.</p>
          <div className="personal-intro">
            <Image className="personal-portrait" src="/amy-portrait.jpg" alt="Amy Zhou" width={800} height={800} sizes="110px" priority />
            <div className="personal-copy">
              <p>Now at Vizcom, building AI tools for industrial designers. Before that I started a few things: Taiyaki, an AI concept-to-CAD tool; Taya, a wearable AI journal as jewelry; and Mobius, materials trading and recycling. Earlier, product design engineering at Apple, and product design and mechanical engineering at Stanford.</p>
              <p>Mostly interested in AI for CAD, engineering, and making physical things.</p>
              <nav className="personal-links" aria-label="Contact Amy">
                <a href="mailto:amzyst@gmail.com">amzyst@gmail.com</a>
                <a href="https://x.com/amypretzel" target="_blank" rel="noopener noreferrer">Twitter</a>
                <a href="https://github.com/amywork777" target="_blank" rel="noopener noreferrer">GitHub</a>
                <a href="https://linkedin.com/in/amy7" target="_blank" rel="noopener noreferrer">LinkedIn</a>
              </nav>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
