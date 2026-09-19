import type { Metadata } from "next";
import Link from "next/link";
import SiteNav from "../site-nav";
import SoftwareProjectList from "./project-list";

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
      <section aria-labelledby="all-software-title">
        <header className="section-heading"><h2 id="all-software-title">All software</h2></header>
        <SoftwareProjectList />
      </section>
      <footer className="index-footer">
          <p className="text-display signoff">i love meeting people who make things. <a href="mailto:amzyst@gmail.com">say hi :)</a></p>
          <Link href="/" className="quiet-link">Home</Link>
        </footer>
    </main>
  </div>;
}
