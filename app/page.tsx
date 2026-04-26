import Image from "next/image";
import Link from "next/link";
import SiteNav from "./site-nav";
import { projects } from "./portfolio/projects";
import { getAllPosts, summary } from "./writing/posts";

const featured = projects.slice(0, 6);

function formatDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Amy Zhou",
  alternateName: "amypretzel",
  url: "https://amypretzel.com",
  image: "https://amypretzel.com/amy-portrait.jpg",
  description:
    "Designer and engineer in San Francisco working on AI tools for industrial designers at Vizcom. Previously Apple, Stanford.",
  worksFor: { "@type": "Organization", name: "Vizcom", url: "https://www.vizcom.ai" },
  alumniOf: [
    { "@type": "CollegeOrUniversity", name: "Stanford University", url: "https://www.stanford.edu" },
  ],
  knowsAbout: [
    "Product design",
    "Mechanical engineering",
    "Industrial design",
    "AI hardware",
    "Wearables",
    "Jewelry design",
  ],
  address: {
    "@type": "PostalAddress",
    addressLocality: "San Francisco",
    addressRegion: "CA",
    addressCountry: "US",
  },
  sameAs: [
    "https://x.com/amypretzel",
    "https://linkedin.com/in/amy7",
    "https://github.com/amywork777",
  ],
};

export default async function Home() {
  const recent = (await getAllPosts()).slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <SiteNav />

      <main className="flex-1">
        {/* === INTRO (portrait + bio) === */}
        <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-10 sm:pt-24 pb-12 sm:pb-20">
          <div className="grid grid-cols-12 gap-7 md:gap-12 items-start animate-fade-up">
            <div className="col-span-12 md:col-span-4">
              <div className="max-w-[260px] mx-auto md:max-w-none md:mx-0">
                <Image
                  src="/amy-portrait.jpg"
                  alt="Amy Zhou"
                  width={800}
                  height={800}
                  className="w-full aspect-square object-cover rounded-full"
                  priority
                />
                <ul className="mt-5 sm:mt-7 space-y-2 text-[13px]">
                {[
                  { label: "Email", value: "amzyst@gmail.com", href: "mailto:amzyst@gmail.com" },
                  { label: "Twitter", value: "@amypretzel", href: "https://x.com/amypretzel" },
                  { label: "LinkedIn", value: "linkedin.com/in/amy7", href: "https://linkedin.com/in/amy7" },
                  { label: "GitHub", value: "amywork777", href: "https://github.com/amywork777" },
                ].map((c) => (
                  <li key={c.label}>
                    <a
                      href={c.href}
                      target={c.href.startsWith("http") ? "_blank" : undefined}
                      rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="group flex items-baseline gap-3"
                    >
                      <span className="meta text-ink-faint shrink-0 w-16 group-hover:text-accent transition-colors">{c.label}</span>
                      <span className="text-ink-soft truncate group-hover:text-accent transition-colors">
                        {c.value}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
              </div>
            </div>
            <div className="col-span-12 md:col-span-8 space-y-4 text-[16px] sm:text-[17px] leading-[1.65] text-ink-soft">
              <p>
                I&apos;m Amy. I make hardware, software, and the in-between. Currently
                at <strong className="text-ink font-semibold">Vizcom</strong>, building
                AI tools for industrial designers.
              </p>
              <p>
                Before that, I built <strong className="text-ink font-semibold">Taiyaki</strong>,
                an AI-assisted concept-to-CAD system; <strong className="text-ink font-semibold">Taya</strong>,
                a wearable AI journal designed as jewelry; a custom AI jewelry pipeline
                that turned sketches into physical pieces; and{" "}
                <strong className="text-ink font-semibold">Mobius</strong>, a company
                focused on bringing more transparency and efficiency to materials trading
                and recycling.
              </p>
              <p>
                I studied product design and mechanical engineering at{" "}
                <strong className="text-ink font-semibold">Stanford</strong>, with a
                minor in music. I also worked at{" "}
                <strong className="text-ink font-semibold">Apple</strong> as a product
                design engineer, focusing on hardware that was useful, durable, and
                better for the environment.
              </p>
              <p>
                I live in San Francisco and spend my time learning, building, and
                exploring new ideas. I care about thoughtful design, clear engineering,
                and making things that feel personal and meaningful.
              </p>
              <p>
                I always enjoy meeting new people and having good conversations, so feel
                free to reach out.
              </p>
            </div>
          </div>
        </section>

        <div className="rule" />

        {/* === 01 NOTES === */}
        <section className="max-w-6xl mx-auto px-5 sm:px-8 py-12 sm:py-20">
          <header className="flex items-baseline justify-between mb-8 sm:mb-12 gap-4 flex-wrap">
            <h2 className="display text-[32px] sm:text-[44px] leading-none">Notes</h2>
            <Link href="/writing" className="link meta">
              All notes
            </Link>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-7 sm:gap-10">
            {recent.map((p, i) => (
              <Link
                key={p.slug}
                href={`/writing/${p.slug}`}
                className="group block animate-fade-up"
                style={{ animationDelay: `${Math.min(i * 80, 240)}ms` }}
              >
                <p className="meta mb-3">{formatDate(p.date)}</p>
                {p.title && (
                  <h3 className="font-display italic text-[22px] sm:text-[26px] leading-[1.1] text-ink mb-2 group-hover:text-accent transition-colors">
                    {p.title}
                  </h3>
                )}
                <p className="text-[15px] leading-[1.6] text-ink-soft line-clamp-4">
                  {summary(p)}
                </p>
                <span className="meta mt-3 inline-block text-ink-faint group-hover:text-accent transition-colors">
                  Read
                </span>
              </Link>
            ))}
          </div>
        </section>

        <div className="rule" />

        {/* === SELECTED WORK === */}
        <section className="max-w-6xl mx-auto px-5 sm:px-8 py-12 sm:py-20">
          <header className="flex items-baseline justify-between mb-8 sm:mb-12 gap-4 flex-wrap">
            <h2 className="display text-[32px] sm:text-[44px] leading-none">Selected work</h2>
            <Link href="/portfolio" className="link meta">
              All projects
            </Link>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-7">
            {featured.map((p, i) => (
              <Link
                key={p.slug}
                href={`/portfolio/${p.slug}`}
                className="tile group rounded-sm border border-rule animate-fade-up"
                style={{ animationDelay: `${Math.min(i * 60, 360)}ms` }}
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

      <footer className="border-t border-rule mt-auto">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-6 flex items-center justify-end gap-4 meta">
          <Link
            href="/fishing"
            className="text-ink-faint hover:text-accent transition-colors inline-flex items-center"
            title="psst"
            aria-label="Fishing"
          >
            <svg
              viewBox="0 0 24 12"
              aria-hidden="true"
              className="h-4 w-auto"
            >
              <path
                d="M8 1.5C13 1.5 18 3 22 6C18 9 13 10.5 8 10.5L4 8L1 10.5L2 6L1 1.5L4 4Z"
                fill="currentColor"
              />
              <circle cx="18.5" cy="5" r="0.7" className="fill-paper" />
            </svg>
          </Link>
        </div>
      </footer>
    </div>
  );
}
