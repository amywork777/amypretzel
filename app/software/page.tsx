import type { Metadata } from "next";
import Link from "next/link";
import SiteNav from "../site-nav";
import ProjectGrid from "../project-grid";
import { selectedSoftware, softwareSections } from "./projects";

export const metadata: Metadata = {
  title: "Software",
  description: "Software by Amy Zhou: AI design tools, CAD systems, maps, and small useful apps.",
  alternates: { canonical: "/software" },
};

export default function SoftwarePage() {
  return <div className="min-h-screen flex flex-col bg-paper">
    <SiteNav active="software" />
    <main id="main-content" className="site-width">
      <section className="portfolio-intro"><h1>Software.</h1><p>AI design tools, CAD systems, and small things that make everyday work better.</p></section>
      <section aria-label="Selected software">
        <ProjectGrid kind="software" projects={selectedSoftware.map(p => ({ title: p.title, caption: p.meta, cover: p.cover, href: `/software/${p.slug}` }))} />
      </section>
      <section className="software-section" aria-labelledby="all-software-title">
        <header className="section-heading"><h2 id="all-software-title">All software</h2></header>
        {softwareSections.map(section => <div className="software-group" key={section.title}>
          <h3>{section.title}</h3>
          <div>{section.projects.map(p => <Link key={p.slug} href={`/software/${p.slug}`} className="software-row">
            <h4>{p.title}</h4><p>{p.summary}</p><span aria-hidden="true">↗</span>
          </Link>)}</div>
        </div>)}
      </section>
      <footer className="index-footer"><Link href="/" className="quiet-link">← Back home</Link><a href="mailto:amzyst@gmail.com" className="quiet-link">Say hello ↗</a></footer>
    </main>
  </div>;
}
