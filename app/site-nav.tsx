import { PretzelMark } from "./_ui/pretzel-mark";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

const columns = {
  list: "ui-column ui-column--list",
  narrow: "ui-column ui-column--narrow",
  wide: "ui-column",
};

/* The header sits on the same column as the page under it, so the pretzel
   lines up with the text and the links end where the text ends. */
/* back: on a project page, a pill beside the pretzel that returns to the
   project's group on the homepage, opened (Amy's feedback, 2026-11-18: make
   it easy to step back out of a project). */
export default function SiteNav({ column = "wide", back }: { column?: keyof typeof columns; back?: { href: string; title: string } }) {
  return (
    <header className="site-header">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <div className={`${columns[column]} site-header-inner`}>
        <div className="site-header-start">
          <Link href="/" className="site-mark" aria-label="Amy Zhou, home"><PretzelMark weight={2.4} /></Link>
          {back && <Link href={back.href} className="ui-link site-back">Back to {back.title}</Link>}
        </div>
        {/* Only the theme switch: Amy removed Work and About (2026-11-16); the
            pretzel goes home, and the page itself is the work and the about. */}
        <nav aria-label="Site">
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
