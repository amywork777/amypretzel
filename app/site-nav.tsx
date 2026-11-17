import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import BookNavLink from "./book/nav-link";

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
        <Link href="/" className="site-mark" aria-label="Amy Zhou, home"><Image src="/pretzel.png" alt="" width={192} height={192} sizes="44px" priority /></Link>
        <nav aria-label="Main navigation">
          {/* Native fragments so the links also work from project pages. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/#work">Work</a>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/#about">About</a>
          <BookNavLink />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
