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
        <ul className="index-list" aria-label="All objects">
          {projects.map((p, i) => (
            <li key={p.slug}>
              <Link href={`/portfolio/${p.slug}`} className="index-row">
                <span className="index-thumb"><Image src={p.cover} alt="" fill sizes="84px" priority={i < 4} /></span>
                <span className="text-display index-title">{p.title}</span>
                <span className="index-meta">{p.role}</span>
              </Link>
            </li>
          ))}
        </ul>
        <footer className="index-footer">
          <p className="text-display signoff">Made a thing? <a href="mailto:amzyst@gmail.com">Say hi.</a></p>
          <Link href="/" className="quiet-link">Home</Link>
        </footer>
      </main>
    </div>
  );
}
