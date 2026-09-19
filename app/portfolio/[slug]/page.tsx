import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SafeTweet } from "../../lib/safe-tweet";
import { splitLinks } from "../../lib/embed";
import { Embeds } from "../../lib/embeds";
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

  // The tweet and the PDF already have their own blocks above; everything
  // else that can be shown rather than linked becomes an embed.
  const { embeds, rest: otherLinks } = splitLinks(
    project.links,
    [project.tweetId, project.pdfPreview].filter(Boolean) as string[]
  );

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteNav active="portfolio" />

      <main id="main-content" className="flex-1 project-detail">
        <section className="detail-head">
          <h1 className="display">{project.title}</h1>
          {project.year && <span className="meta">{project.year}</span>}
        </section>
        {project.role && <p className="detail-summary">{project.role}</p>}

        {/* === LEAD IMAGE === */}
        {lead && (
          <section className="detail-media">
            <Image src={lead} alt={project.title} width={1600} height={1200} priority />
          </section>
        )}

        {/* === TWEET EMBED (with launch video) === */}
        {project.tweetId && (
          <section className="detail-media">
            <div data-theme="light" className="tweet-host">
              <SafeTweet id={project.tweetId} />
            </div>
          </section>
        )}

        {(project.body || otherLinks.length > 0) && (
          <section className="detail-body">
            {project.body && <div>{renderBody(project.body)}</div>}
            {otherLinks.length > 0 && (
              <nav className="detail-links" aria-label="References">
                {otherLinks.map((l) => (
                  <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer">{l.label}</a>
                ))}
              </nav>
            )}
          </section>
        )}

        <Embeds embeds={embeds} />

        {/* === PDF VIEWER === */}
        {project.pdfPreview && (
          <section className="detail-media">
            <iframe src={project.pdfPreview} title={`${project.title} document preview`} className="h-[70vh] sm:h-[85vh]" loading="lazy" />
            <p className="meta">If the viewer doesn&apos;t load on your device, open the PDF from the references above.</p>
          </section>
        )}

        {/* === REMAINING GALLERY === */}
        {rest.length > 0 && (
          <section className="detail-media">
            {rest.map((src, i) => (
              <Image key={src} src={src} alt={`${project.title}, ${i + 2}`} width={1600} height={1200} />
            ))}
          </section>
        )}

        <nav className="detail-nav" aria-label="More objects">
          <Link href={`/portfolio/${prev.slug}`}><small>Previous</small>{prev.title}</Link>
          <Link href={`/portfolio/${next.slug}`} className="text-right"><small>Next</small>{next.title}</Link>
        </nav>
      </main>

    </div>
  );
}
