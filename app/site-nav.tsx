import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import BookNavLink from "./book/nav-link";

type Props = { active?: "portfolio" | "software" | null };

export default function SiteNav({ active = null }: Props) {
  return (
    <header className="site-header">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <div className="ui-column site-header-inner">
        <Link href="/" className="site-mark" aria-label="Amy Zhou, home">
          {/* Chrome shows what it reflects, so there's a render lit for each theme. */}
          <Image className="site-mark-light" src="/pretzel-chrome-on-white.png" alt="" width={192} height={192} priority unoptimized />
          <Image className="site-mark-dark" src="/pretzel-chrome-on-black.png" alt="" width={192} height={192} priority unoptimized />
        </Link>
        <nav aria-label="Main navigation">
          <Link href="/portfolio" aria-current={active === "portfolio" ? "page" : undefined}>Objects</Link>
          <Link href="/software" aria-current={active === "software" ? "page" : undefined}>Software</Link>
          <BookNavLink />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
