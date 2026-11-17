import type { ReactNode } from "react";
import SiteNav from "../site-nav";
import { TextLink } from "./link";

/* Every page: the header, then one centred column. "wide" for indexes, "narrow" for reading. */
export function Page({ width = "wide", children }: { width?: "wide" | "narrow"; children: ReactNode }) {
  return (
    <div className="ui-page">
      <SiteNav />
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
export function SectionHeading({ id, note, children }: { id?: string; note?: string; children: ReactNode }) {
  return <header className="ui-section-heading"><h2 id={id}>{children}</h2>{note && <p className="ui-section-note">{note}</p>}</header>;
}

/* Sign-off at the bottom of the page. The homepage leaves out the link home. */
export function SiteFooter({ home = true }: { home?: boolean }) {
  return (
    <footer className="ui-footer">
      <p className="ui-display ui-footer-signoff">I love meeting people who make things. <TextLink href="mailto:amzyst@gmail.com">Email me</TextLink></p>
      {home && <TextLink href="/" standalone>Home</TextLink>}
    </footer>
  );
}
