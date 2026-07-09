import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

type Props = {
  /** which top-level route is active, if any */
  active?: "portfolio" | "software" | null;
};

export default function SiteNav({ active = null }: Props) {
  return (
    <header className="border-b border-rule bg-paper">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-between gap-4 sm:gap-6">
        <Link
          href="/"
          className="flex items-center gap-3 group shrink-0"
          aria-label="Home"
        >
          <span
            aria-hidden="true"
            className="block w-7 h-7 bg-accent shrink-0 group-hover:rotate-12 transition-transform duration-300"
            style={{
              WebkitMaskImage: "url(/pretzel.png)",
              maskImage: "url(/pretzel.png)",
              WebkitMaskSize: "contain",
              maskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
              maskPosition: "center",
              imageRendering: "pixelated",
            }}
          />
          <span className="hidden sm:inline font-display text-[19px] sm:text-[21px] leading-none text-ink" style={{ fontStyle: "italic" }}>
            Amy Zhou
          </span>
        </Link>

        <nav className="flex items-center gap-4 sm:gap-7 meta">
          <Link
            href="/#software"
            className={
              active === "software"
                ? "text-accent"
                : "text-ink-muted hover:text-accent transition-colors"
            }
          >
            Software
          </Link>
          <Link
            href="/#objects"
            className={
              active === "portfolio"
                ? "text-accent"
                : "text-ink-muted hover:text-accent transition-colors"
            }
          >
            Objects
          </Link>
          {/* plain <a>: fragment navigation fires hashchange for the book
              overlay; Next's Link pushState never would */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/#book"
            className="text-ink-muted hover:text-accent transition-colors"
          >
            Book
          </a>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
