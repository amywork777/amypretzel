import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SafeTweet } from "../../lib/safe-tweet";
import { renderBody } from "../../lib/render-body";
import SiteNav from "../../site-nav";
import { projects } from "../projects";
import "react-tweet/theme.css";

const SITE_URL = "https://amypretzel.com";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = projects.find((p) => p.slug === slug);
  if (!p) return {};
  const url = `/portfolio/${slug}`;
  const ogTitle = `${p.title}, Amy Zhou`;
  const cover = p.cover?.startsWith("http") ? p.cover : `${SITE_URL}${p.cover}`;
  return {
    title: p.title,
    description: p.role,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: ogTitle,
      description: p.role,
      images: p.cover ? [{ url: cover, alt: p.title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: p.role,
      images: p.cover ? [cover] : undefined,
    },
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) notFound();

  const idx = projects.findIndex((p) => p.slug === project.slug);
  const prev = idx > 0 ? projects[idx - 1] : projects[projects.length - 1];
  const next = idx < projects.length - 1 ? projects[idx + 1] : projects[0];

  // first image is the lead, rest stack below body
  const [lead, ...rest] = project.gallery;

  const coverAbs = project.cover?.startsWith("http")
    ? project.cover
    : `${SITE_URL}${project.cover}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    headline: project.title,
    description: project.role,
    url: `${SITE_URL}/portfolio/${project.slug}`,
    image: project.cover ? coverAbs : undefined,
    creator: {
      "@type": "Person",
      name: "Amy Zhou",
      url: SITE_URL,
    },
    ...(project.year ? { dateCreated: project.year } : {}),
  };

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteNav active="portfolio" />

      <main className="flex-1">
        {/* === HEADER === */}
        <section className="max-w-5xl mx-auto px-5 sm:px-8 pt-8 sm:pt-16 pb-7 sm:pb-10">
          <Link href="/portfolio" className="link-soft meta inline-block mb-5 sm:mb-7 animate-fade-up">
            All projects
          </Link>
          <div className="flex items-baseline justify-between gap-4 sm:gap-6 flex-wrap mb-3">
            <h1 className="display text-[38px] sm:text-[64px] md:text-[88px] leading-[0.98] animate-fade-up delay-100">
              {project.title}
            </h1>
            {project.year && (
              <span className="meta animate-fade-up delay-100">{project.year}</span>
            )}
          </div>
          <p className="meta text-ink animate-fade-up delay-200">{project.role}</p>
        </section>

        {/* === LEAD IMAGE === */}
        {lead && (
          <section className="max-w-5xl mx-auto px-5 sm:px-8 mb-10 sm:mb-16 animate-fade-up delay-300">
            <div className="bg-white border border-rule rounded-sm overflow-hidden">
              <Image
                src={lead}
                alt={project.title}
                width={1600}
                height={1200}
                className="w-full h-auto object-contain max-h-[78vh]"
                priority
              />
            </div>
          </section>
        )}

        {/* === TWEET EMBED (with launch video) === */}
        {project.tweetId && (
          <section className="max-w-2xl mx-auto px-5 sm:px-8 mb-12 sm:mb-16">
            <p className="meta mb-4">Launch demo</p>
            <div data-theme="light" className="tweet-host">
              <SafeTweet id={project.tweetId} />
            </div>
          </section>
        )}

        <div className="rule" />

        {/* === BODY + LINKS === */}
        {(project.body || project.links?.length) && (
          <section className="max-w-3xl mx-auto px-5 sm:px-8 py-10 sm:py-20">
            {project.body && <div>{renderBody(project.body)}</div>}

            {project.links && project.links.length > 0 && (
              <div className="mt-10 pt-6 border-t border-rule">
                <p className="meta mb-3">References</p>
                <ul className="space-y-2">
                  {project.links.map((l) => (
                    <li key={l.url}>
                      <a
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link text-[15px] text-ink-soft"
                      >
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* === PDF VIEWER === */}
        {project.pdfPreview && (
          <section className="max-w-4xl mx-auto px-5 sm:px-8 pb-10 sm:pb-16 animate-fade-up">
            <div className="bg-white border border-rule rounded-sm overflow-hidden">
              <iframe
                src={project.pdfPreview}
                title={`${project.title} document preview`}
                className="block w-full h-[70vh] sm:h-[85vh]"
                loading="lazy"
              />
            </div>
            <p className="meta mt-3 text-ink-faint">
              If the viewer doesn&apos;t load on your device, open the PDF directly from the references above.
            </p>
          </section>
        )}

        {/* === REMAINING GALLERY === */}
        {rest.length > 0 && (
          <>
            <div className="rule" />
            <section className="max-w-5xl mx-auto px-5 sm:px-8 py-10 sm:py-20">
              <p className="meta mb-6 sm:mb-8">Gallery, {rest.length} {rest.length === 1 ? "image" : "images"}</p>
              <div className="space-y-4 sm:space-y-7">
                {rest.map((src, i) => (
                  <div
                    key={src}
                    className="bg-white border border-rule rounded-sm overflow-hidden animate-fade-up"
                    style={{ animationDelay: `${Math.min(i * 50, 300)}ms` }}
                  >
                    <Image
                      src={src}
                      alt={`${project.title}, ${i + 2}`}
                      width={1600}
                      height={1200}
                      className="w-full h-auto object-contain max-h-[80vh]"
                    />
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* === PREV / NEXT === */}
        <div className="rule" />
        <section className="max-w-5xl mx-auto px-5 sm:px-8 py-8 sm:py-10">
          <div className="grid grid-cols-2 gap-4 sm:gap-10">
            <Link href={`/portfolio/${prev.slug}`} className="group block">
              <p className="meta text-ink-faint mb-1.5 group-hover:text-accent transition-colors">Prev</p>
              <p className="font-display italic text-[18px] sm:text-[26px] leading-[1.1] text-ink group-hover:text-accent transition-colors">
                {prev.title}
              </p>
            </Link>
            <Link href={`/portfolio/${next.slug}`} className="group block text-right">
              <p className="meta text-ink-faint mb-1.5 group-hover:text-accent transition-colors">Next</p>
              <p className="font-display italic text-[18px] sm:text-[26px] leading-[1.1] text-ink group-hover:text-accent transition-colors">
                {next.title}
              </p>
            </Link>
          </div>
        </section>
      </main>

    </div>
  );
}
