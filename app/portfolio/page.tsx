import Image from "next/image";
import Link from "next/link";
import SiteNav from "../site-nav";
import { projects } from "./projects";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Selected projects by Amy Zhou: AI hardware, wearables, jewelry, mechanical engineering, and product design from Vizcom, Apple, and Stanford.",
  alternates: { canonical: "/portfolio" },
  openGraph: {
    type: "website",
    url: "/portfolio",
    title: "Work, Amy Zhou",
    description:
      "Selected projects by Amy Zhou: AI hardware, wearables, jewelry, mechanical engineering, and product design from Vizcom, Apple, and Stanford.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Work, Amy Zhou",
    description:
      "Selected projects by Amy Zhou: AI hardware, wearables, jewelry, mechanical engineering, and product design.",
  },
};

export default function PortfolioPage() {
  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <SiteNav active="portfolio" />

      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-10 sm:pt-20 pb-10 sm:pb-12">
          <p className="meta mb-4 sm:mb-5 animate-fade-up">Index, Selected Work</p>
          <h1 className="display text-[13vw] sm:text-[80px] md:text-[104px] leading-[0.95] mb-5 sm:mb-6 animate-fade-up delay-100">
            Things I&apos;ve <span className="text-accent">made</span>.
          </h1>
          <p className="text-[15px] sm:text-[18px] leading-[1.55] text-ink-soft max-w-2xl animate-fade-up delay-200">
            Product design, mechanical engineering, jewelry, instruments, and the
            occasional craft. Click any tile to see the full project.
          </p>
        </section>

        <div className="rule" />

        <section className="max-w-6xl mx-auto px-5 sm:px-8 py-10 sm:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-7">
            {projects.map((p, i) => (
              <Link
                key={p.slug}
                href={`/portfolio/${p.slug}`}
                className="tile group rounded-sm border border-rule animate-fade-up"
                style={{ animationDelay: `${Math.min(i * 35, 360)}ms` }}
              >
                <div className="tile-img-wrap aspect-[4/3] overflow-hidden relative">
                  <Image
                    src={p.cover}
                    alt={p.title}
                    width={800}
                    height={600}
                    className={`absolute inset-0 w-full h-full object-contain p-5 transition-all duration-500 ease-out group-hover:scale-[1.03] ${
                      p.coverHover ? "group-hover:opacity-0" : ""
                    }`}
                  />
                  {p.coverHover && (
                    <Image
                      src={p.coverHover}
                      alt=""
                      aria-hidden="true"
                      width={800}
                      height={600}
                      className="absolute inset-0 w-full h-full object-cover opacity-0 transition-all duration-500 ease-out group-hover:opacity-100 group-hover:scale-[1.03]"
                    />
                  )}
                </div>
                <div className="px-4 py-3.5 border-t border-rule bg-card">
                  <h3 className="font-display italic text-[20px] leading-[1.2] text-ink truncate pb-0.5 group-hover:text-accent transition-colors">
                    {p.title}
                  </h3>
                  <p className="meta mt-1 truncate">{p.role}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

    </div>
  );
}
