import Image from "next/image";
import Link from "next/link";
import SiteNav from "./site-nav";
import BookOverlay from "./book/overlay";
import ReadTheBookLink from "./book/read-the-book-link";
import { FishIcon } from "./fish-icon";
import { projects } from "./portfolio/projects";
import { softwareSections } from "./software/projects";

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
        <section className="home-intro" aria-labelledby="intro-title">
          <div className="intro-title-row">
            <h1 id="intro-title">Amy Zhou</h1>
            <p className="intro-location">Designer & engineer<span className="location-divider"> · </span><br />San Francisco, CA</p>
          </div>
          <div className="intro-bottom">
            <p className="intro-statement">I make hardware, software, and the in-between.</p>
            <div className="intro-aside">
              <p>Currently building AI tools for industrial designers at Vizcom. Previously Apple and Stanford.</p>
              <a href="#about" className="quiet-link">A little about me <span aria-hidden="true">↗</span></a>
            </div>
          </div>
        </section>

        <section id="objects" className="home-section" aria-labelledby="objects-title">
          <header className="section-heading">
            <h2 id="objects-title">Selected objects</h2>
            <Link href="/portfolio" className="quiet-link">All objects <span aria-hidden="true">↗</span></Link>
          </header>
          <div className="selected-grid">
            {selectedObjects.map((p, i) => (
              <Link key={p.slug} href={`/portfolio/${p.slug}`} className="selected-project">
                <div className="selected-image">
                  <Image src={p.cover} alt={p.title} fill sizes="(max-width: 540px) 45vw, 400px" priority={i === 0} />
                </div>
                <div className="project-caption">
                  <div><h3>{p.title}</h3><p>{p.role}</p></div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section id="software" className="home-section software-section" aria-labelledby="software-title">
          <header className="section-heading"><h2 id="software-title">Software</h2><span className="section-note">Tools for making things.</span></header>
          {softwareSections.filter(s => s.title !== "AI and CAD").map(section => (
            <div className="software-group" key={section.title}>
              <h3>{section.title === "Vizcom" ? "At Vizcom" : section.title}</h3>
              <div>{section.projects.map(p => (
                <Link key={p.slug} href={`/software/${p.slug}`} className="software-row">
                  <h4>{p.title}</h4><p>{p.summary}</p><span aria-hidden="true">↗</span>
                </Link>
              ))}</div>
            </div>
          ))}
          <div className="software-group"><h3>Independent</h3><div>
            {softwareSections.find(s => s.title === "AI and CAD")?.projects.filter(p => !p.slug.startsWith("taiyaki")).map(p => (
              <Link key={p.slug} href={`/software/${p.slug}`} className="software-row"><h4>{p.title}</h4><p>{p.summary}</p><span aria-hidden="true">↗</span></Link>
            ))}
          </div></div>
        </section>

        <section id="about" className="home-section about-section" aria-labelledby="about-title">
          <div className="about-portrait"><Image src="/amy-portrait.jpg" alt="Amy Zhou" width={800} height={800} sizes="(max-width: 700px) 70vw, 30vw" /><span>Amy, usually making something.</span></div>
          <div className="about-copy">
            <h2 id="about-title">A little about me.</h2>
            <p>I studied product design and mechanical engineering at Stanford, with a minor in music. I also worked at Apple as a product design engineer, focusing on hardware that was useful, durable, and better for the environment.</p>
            <p>Since then: Taiyaki, an AI-assisted concept-to-CAD system; Taya, a wearable AI journal designed as jewelry; a custom AI jewelry pipeline; and Mobius, a company focused on materials trading and recycling.</p>
            <p>I live in San Francisco and spend my time learning, building, and exploring new ideas. I care about thoughtful design, clear engineering, and making things that feel personal and meaningful.</p>
            <ReadTheBookLink className="quiet-link about-book-link" />
          </div>
        </section>
        <footer className="home-footer">
          <div className="footer-invitation"><a href="mailto:amzyst@gmail.com">amzyst@gmail.com</a></div>
          <div className="footer-bottom"><span>Amy Zhou</span><div className="footer-links">
            <a href="https://x.com/amypretzel" target="_blank" rel="noopener noreferrer">Twitter</a>
            <a href="https://github.com/amywork777" target="_blank" rel="noopener noreferrer">GitHub</a>
            <a href="https://linkedin.com/in/amy7" target="_blank" rel="noopener noreferrer">LinkedIn</a>
            <Link href="/fishing" aria-label="Fishing" className="footer-fish"><FishIcon className="h-5 w-auto" /></Link>
          </div></div>
        </footer>
      </main>
    </div>
  );
}
