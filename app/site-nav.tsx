import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import BookNavLink from "./book/nav-link";

export default function SiteNav() {
  return (
    <header className="site-header">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <div className="ui-column site-header-inner">
        <Link href="/" className="site-mark" aria-label="Amy Zhou, home"><Image src="/pretzel.png" alt="" width={192} height={192} sizes="44px" priority /></Link>
        <nav aria-label="Main navigation">
          {/* Native fragments so the links also work from project pages. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/#work">Work</a>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/#objects">Objects</a>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/#software">Software</a>
          <BookNavLink />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
