import Image from "next/image";
import Link from "next/link";
import SiteNav from "../site-nav";
import { projects } from "./projects";

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
    <div className="min-h-screen flex flex-col bg-paper">
      <SiteNav active="portfolio" />

      <main id="main-content" className="site-width portfolio-index">
        <section className="portfolio-intro">
          <h1>Objects.</h1>
          <p>Product design, mechanical engineering, jewelry, instruments, and the occasional craft.</p>
        </section>
        <section className="objects-index-grid" aria-label="All objects">
          {projects.map((p, i) => (
            <Link key={p.slug} href={`/portfolio/${p.slug}`} className="selected-project">
              <div className="selected-image object-study">
                <Image src={p.cover} alt={p.title} fill sizes="(max-width: 700px) 100vw, 50vw" priority={i < 2} />
              </div>
              <div className="project-caption"><div><h2>{p.title}</h2><p>{p.role}</p></div></div>
            </Link>
          ))}
        </section>
        <footer className="index-footer"><Link href="/" className="quiet-link">Back home</Link><a href="mailto:amzyst@gmail.com" className="quiet-link">Say hello</a></footer>
      </main>
    </div>
  );
}
