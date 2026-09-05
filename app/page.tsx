import Image from "next/image";
import Link from "next/link";
import SiteNav from "./site-nav";
import BookOverlay from "./book/overlay";
import ReadTheBookLink from "./book/read-the-book-link";
import { FishIcon } from "./fish-icon";
import { projects } from "./portfolio/projects";
import SoftwareProjectList from "./software/project-list";
import ProjectGrid from "./project-grid";

const selectedSlugs = ["taya-pendant", "harp-instrument", "injection-molded-fabric", "pretzels-favorite-food"];
const selectedObjects = selectedSlugs.flatMap(slug => projects.find(p => p.slug === slug) ?? []);
const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Amy Zhou",
  alternateName: "amypretzel",
  url: "https://amypretzel.com",
  image: "https://amypretzel.com/amy-portrait.jpg",
  description:
    "Designer and engineer in San Francisco working on AI tools for industrial designers at Vizcom. Previously Apple, Stanford.",
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
          <div className="intro-title-row">
            <h1 id="intro-title">Amy Zhou</h1>
            <p className="intro-location">Designer & engineer<br />San Francisco, CA</p>
          </div>
          <div className="personal-intro">
            <Image className="personal-portrait" src="/amy-portrait.jpg" alt="Amy Zhou" width={800} height={800} sizes="(max-width: 540px) 100px, 145px" priority />
            <div className="personal-copy">
              <p className="intro-statement">I make hardware, software, and the in-between.</p>
              <p>Currently building AI tools for industrial designers at Vizcom.</p>
              <p>I studied product design and mechanical engineering at Stanford, with a minor in music. I also worked at Apple as a product design engineer, focusing on hardware that was useful, durable, and better for the environment.</p>
              <p>Since then: Taiyaki, an AI-assisted concept-to-CAD system; Taya, a wearable AI journal designed as jewelry; a custom AI jewelry pipeline; and Mobius, a company focused on materials trading and recycling.</p>
              <p>I live in San Francisco and spend my time learning, building, and exploring new ideas. I care about thoughtful design, clear engineering, and making things that feel personal and meaningful.</p>
              <nav className="personal-links" aria-label="Contact Amy">
                <a href="mailto:amzyst@gmail.com">amzyst@gmail.com</a>
                <a href="https://x.com/amypretzel" target="_blank" rel="noopener noreferrer">Twitter</a>
                <a href="https://github.com/amywork777" target="_blank" rel="noopener noreferrer">GitHub</a>
                <a href="https://linkedin.com/in/amy7" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                <ReadTheBookLink className="quiet-link" />
              </nav>
            </div>
          </div>
        </section>

        <div className="project-sections">
          <section id="objects" className="home-section" aria-labelledby="objects-title">
            <header className="section-heading">
              <h2 id="objects-title">Objects</h2>
              <Link href="/portfolio" className="quiet-link">All objects</Link>
            </header>
            <ProjectGrid projects={selectedObjects.map(p => ({ title: p.title, caption: p.role, cover: p.cover, href: `/portfolio/${p.slug}` }))} />
          </section>
          <section id="software" className="home-section" aria-labelledby="software-title">
            <header className="section-heading">
              <h2 id="software-title">Software</h2>
              <Link href="/software" className="quiet-link">All software</Link>
            </header>
            <SoftwareProjectList />
          </section>
        </div>

        <footer className="home-footer">
          <div className="footer-bottom"><span>Amy Zhou</span>
            <Link href="/fishing" aria-label="Fishing" className="footer-fish"><FishIcon className="h-5 w-auto" /></Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
