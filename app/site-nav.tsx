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
export default function SiteNav({ column = "wide" }: { column?: keyof typeof columns }) {
  return (
    <header className="site-header">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <div className={`${columns[column]} site-header-inner`}>
        <Link href="/" className="site-mark" aria-label="Amy Zhou, home"><PretzelMark weight={2.4} /></Link>
        {/* Only the theme switch: Amy removed Work and About (2026-11-16); the
            pretzel goes home, and the page itself is the work and the about. */}
        <nav aria-label="Site">
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
