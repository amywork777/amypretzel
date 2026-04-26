import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

type Props = {
  /** which top-level route is active, if any */
  active?: "portfolio" | "writing" | null;
};

export default function SiteNav({ active = null }: Props) {
  return (
    <header className="border-b border-rule bg-paper">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-between gap-6">
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
          <span className="font-display text-[19px] sm:text-[21px] leading-none text-ink" style={{ fontStyle: "italic" }}>
            Amy Zhou
          </span>
        </Link>

        <nav className="flex items-center gap-5 sm:gap-7 meta">
          <Link
            href="/writing"
            className={
              active === "writing"
                ? "text-accent"
                : "text-ink-muted hover:text-accent transition-colors"
            }
          >
            Notes
          </Link>
          <Link
            href="/portfolio"
            className={
              active === "portfolio"
                ? "text-accent"
                : "text-ink-muted hover:text-accent transition-colors"
            }
          >
            Work
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
