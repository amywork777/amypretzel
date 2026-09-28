import type { ReactNode } from "react";
import SiteNav from "../site-nav";
import { QuietLink, TextLink } from "./link";

type Section = "portfolio" | "software" | null;

/* Every page: the header, then one centred column. "wide" for indexes, "narrow" for reading. */
export function Page({ active = null, width = "wide", children }: { active?: Section; width?: "wide" | "narrow"; children: ReactNode }) {
  return (
    <div className="ui-page">
      <SiteNav active={active} />
      <main id="main-content" className={width === "wide" ? "ui-column" : "ui-column ui-column--narrow"}>{children}</main>
    </div>
  );
}

/* Page title with a short lede under it. */
export function PageIntro({ title, meta, children }: { title: string; meta?: ReactNode; children?: ReactNode }) {
  return (
    <header className="ui-intro">
      <div className="ui-intro-title">
        <h1 className="ui-display">{title}</h1>
        {meta && <span className="ui-meta">{meta}</span>}
      </div>
      {children && <p className="ui-lede">{children}</p>}
    </header>
  );
}

/* A small label sitting on a hairline, above a group of items. */
export function SectionHeading({ id, children }: { id?: string; children: ReactNode }) {
  return <header className="ui-section-heading"><h2 id={id}>{children}</h2></header>;
}

/* Sign-off at the bottom of the index pages. */
export function SiteFooter() {
  return (
    <footer className="ui-footer">
      <p className="ui-display ui-footer-signoff">i love meeting people who make things. <TextLink href="mailto:amzyst@gmail.com">say hi :)</TextLink></p>
      <QuietLink href="/">Home</QuietLink>
    </footer>
  );
}
