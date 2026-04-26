import Link from "next/link";
import SiteNav from "../site-nav";
import { formatDate, getAllPosts, readingTime, summary } from "./posts";

import type { Metadata } from "next";

const DESCRIPTION =
  "Short notes by Amy Zhou on design, engineering, AI hardware, and the things she's building.";

export const metadata: Metadata = {
  title: "Notes",
  description: DESCRIPTION,
  alternates: { canonical: "/writing" },
  openGraph: {
    type: "website",
    url: "/writing",
    title: "Notes, Amy Zhou",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Notes, Amy Zhou",
    description: DESCRIPTION,
  },
};

export default async function WritingPage() {
  const posts = await getAllPosts();

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <SiteNav active="writing" />

      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-10 sm:pt-20 pb-10 sm:pb-12">
          <p className="meta mb-4 sm:mb-5 animate-fade-up">Index, Notes</p>
          <h1 className="display text-[13vw] sm:text-[80px] md:text-[104px] leading-[0.95] mb-5 sm:mb-6 animate-fade-up delay-100">
            Thinking <span className="text-accent">out loud</span>.
          </h1>
          <p className="text-[15px] sm:text-[18px] leading-[1.55] text-ink-soft max-w-2xl animate-fade-up delay-200">
            Short notes on design, engineering, and the things I&apos;m building.
          </p>
        </section>

        <div className="rule" />

        <section className="max-w-6xl mx-auto px-5 sm:px-8 py-10 sm:py-16">
          {posts.length === 0 ? (
            <p className="text-ink-muted text-[15px]">Nothing posted yet.</p>
          ) : (
            <ul className="border-t border-rule">
              {posts.map((p, i) => (
                <li
                  key={p.slug}
                  className="border-b border-rule animate-fade-up"
                  style={{ animationDelay: `${Math.min(i * 60, 240)}ms` }}
                >
                  <Link
                    href={`/writing/${p.slug}`}
                    className="group block py-6 sm:py-9 hover:bg-card-deep/30 transition-colors"
                  >
                    <div className="grid grid-cols-12 gap-3 sm:gap-8 items-baseline">
                      <div className="col-span-12 sm:col-span-3 md:col-span-2">
                        <p className="meta">{formatDate(p.date)}</p>
                      </div>
                      <div className="col-span-12 sm:col-span-9 md:col-span-10">
                        {p.title && (
                          <h2 className="font-display italic text-[26px] sm:text-[36px] md:text-[42px] leading-[1.05] text-ink mb-3 group-hover:text-accent transition-colors">
                            {p.title}
                          </h2>
                        )}
                        <p className="text-[15px] sm:text-[16px] leading-[1.6] text-ink-soft line-clamp-2 sm:line-clamp-3 max-w-2xl mb-3">
                          {summary(p)}
                        </p>
                        <div className="flex items-baseline gap-4 meta">
                          <span className="text-ink-faint">{readingTime(p.body)}</span>
                          <span className="text-ink-faint group-hover:text-accent transition-colors">
                            Read →
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <footer className="border-t border-rule mt-auto">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-6 meta">
          <span>© 2026 Amy Zhou</span>
        </div>
      </footer>
    </div>
  );
}
