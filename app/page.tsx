import Image from "next/image";
import Link from "next/link";
import SiteNav from "./site-nav";
import BookOverlay from "./book/overlay";
import ReadTheBookLink from "./book/read-the-book-link";
import { FishIcon } from "./fish-icon";
import { projects } from "./portfolio/projects";
import { softwareSections } from "./software/projects";

const vizcomProjects =
  softwareSections.find((s) => s.title === "Vizcom")?.projects ?? [];
const featuredObjects = projects.slice(0, 6);

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
  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <BookOverlay />
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

        {/* === SOFTWARE === */}
        <section id="software" className="max-w-6xl mx-auto px-5 sm:px-8 py-12 sm:py-20 scroll-mt-16">
          <header className="mb-8 sm:mb-12">
            <h2 className="display text-[32px] sm:text-[44px] leading-none">Software</h2>
          </header>

          <p className="meta mb-3">At Vizcom</p>
          <div className="border-t border-rule mb-10">
            {vizcomProjects.map((p) => (
              <Link
                key={p.slug}
                href={`/software/${p.slug}`}
                className="group grid grid-cols-1 sm:grid-cols-[minmax(200px,260px)_1fr_auto] items-baseline gap-1 sm:gap-6 border-b border-rule py-4"
              >
                <span className="font-display italic text-[22px] sm:text-[26px] leading-[1.05] text-ink group-hover:text-accent transition-colors">
                  {p.title}
                </span>
                <span className="text-[14px] sm:text-[15px] leading-[1.5] text-ink-soft">
                  {p.summary}
                </span>
                <span className="hidden sm:block meta text-ink-faint self-center group-hover:text-accent transition-colors">
                  {p.meta}
                </span>
              </Link>
            ))}
          </div>

          <p className="max-w-2xl text-[16px] sm:text-[17px] leading-[1.75] text-ink-soft">
            Off hours I build my own tools.{" "}
            <Link href="/software/taiyaki-3d" className="link">Taiyaki 3D</Link> turned
            sketches into editable CAD,{" "}
            <Link href="/software/taiyaki-jewelry" className="link">Taiyaki Jewelry</Link>{" "}
            turned them into cast metal,{" "}
            <Link href="/software/tech-pack" className="link">Tech Pack</Link> writes
            factory specs from a render,{" "}
            <Link href="/software/kerf" className="link">Kerf</Link> is a solid-modeling
            kernel in Rust, and{" "}
            <Link href="/software/cad-steps" className="link">CAD-Steps</Link> is a
            dataset of how geometry actually gets built. Smaller things:{" "}
            <Link href="/software/sf-rats" className="link">SF Rats</Link> maps free
            events around the Bay,{" "}
            <Link href="/software/cute-ghostty" className="link">Cute Ghostty</Link>{" "}
            makes terminals pastel, and{" "}
            <Link href="/software/screenie" className="link">Screenie</Link> records
            your screen and edits itself.
          </p>
        </section>

        <div className="rule" />

        {/* === OBJECTS === */}
        <section id="objects" className="max-w-6xl mx-auto px-5 sm:px-8 py-12 sm:py-20 scroll-mt-16">
          <header className="flex items-baseline justify-between mb-8 sm:mb-12 gap-4 flex-wrap">
            <h2 className="display text-[32px] sm:text-[44px] leading-none">Objects</h2>
            <Link href="/portfolio" className="link meta">
              All objects
            </Link>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-7">
            {featuredObjects.map((p, i) => (
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
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-6 flex items-center justify-between gap-4 meta">
          <div className="flex items-center gap-5">
            <ReadTheBookLink className="text-ink-faint hover:text-accent transition-colors meta" />
          </div>
          <Link
            href="/fishing"
            className="text-ink-faint hover:text-accent transition-colors inline-flex items-center"
            title="psst"
            aria-label="Fishing"
          >
            <FishIcon className="h-6 w-auto" />
          </Link>
        </div>
      </footer>
    </div>
  );
}
