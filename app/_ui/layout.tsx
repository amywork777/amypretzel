import type { ReactNode } from "react";
import Link from "next/link";
import SiteNav from "../site-nav";
import { PretzelMark } from "./pretzel-mark";

/* Every page: the header, then one centred column. "wide" for indexes, "narrow" for reading.
   "bar" is the project bar (ProjectBar) on project pages. */
export function Page({ width = "wide", bar, children }: { width?: "wide" | "narrow"; bar?: ReactNode; children: ReactNode }) {
  return (
    <div className="ui-page">
      <SiteNav column={width} />
      {bar}
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

/* The end of every page: room to breathe, and a tiny pretzel lying at the
   bottom that leads to the secret facts page (Amy, 2026-11-16: one pretzel
   in view is enough, so the second one hides down here). No sign-off: Amy
   removed it the same day. The project bar uses the footer to know where the
   page ends. The facts page leaves the pretzel out. */
export function SiteFooter({ secret = true }: { secret?: boolean }) {
  return (
    <footer className="ui-footer">
      {secret && <Link href="/facts" className="secret-pretzel" aria-label="Cool facts" title="psst"><PretzelMark weight={1.5} /></Link>}
    </footer>
  );
}
