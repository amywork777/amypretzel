import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteNav from "../../site-nav";
import { renderBody } from "../../lib/render-body";
import { softwareProjects } from "../projects";

const SITE_URL = "https://amypretzel.com";

export function generateStaticParams() {
  return softwareProjects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = softwareProjects.find((p) => p.slug === slug);
  if (!p) return {};
  const url = `/software/${slug}`;
  const ogTitle = `${p.title}, Amy Zhou`;
  return {
    title: p.title,
    description: p.summary,
    alternates: { canonical: url },
    openGraph: { type: "article", url, title: ogTitle, description: p.summary },
    twitter: { card: "summary", title: ogTitle, description: p.summary },
  };
}

export default async function SoftwareProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = softwareProjects.find((p) => p.slug === slug);
  if (!project) notFound();

  const idx = softwareProjects.findIndex((p) => p.slug === project.slug);
  const prev = idx > 0 ? softwareProjects[idx - 1] : softwareProjects[softwareProjects.length - 1];
  const next = idx < softwareProjects.length - 1 ? softwareProjects[idx + 1] : softwareProjects[0];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: project.title,
    description: project.summary,
    url: `${SITE_URL}/software/${project.slug}`,
    creator: { "@type": "Person", name: "Amy Zhou", url: SITE_URL },
  };

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteNav active="software" />

      <main id="main-content" className="flex-1 project-detail">
        <section className="detail-head">
          <h1 className="display">{project.title}</h1>
          <span className="meta">{project.section}</span>
        </section>
        <p className="detail-summary">{project.summary}</p>

        <section className="detail-body">
          <div>{renderBody(project.body)}</div>
          {project.links && project.links.length > 0 && (
            <nav className="detail-links" aria-label="Links">
              {project.links.map((l) => (
                <a key={l.href} href={l.href} target={l.href.startsWith("http") ? "_blank" : undefined} rel={l.href.startsWith("http") ? "noopener noreferrer" : undefined}>{l.label}</a>
              ))}
            </nav>
          )}
        </section>

        {project.demos && project.demos.length > 0 && (
          <section className="detail-media">
            {project.demos.map((demo) => (
              <iframe key={demo.src} src={demo.src} height="399" frameBorder="0" allowFullScreen title={`${project.title}, ${demo.label}`} loading="lazy" className="min-h-[399px]" />
            ))}
          </section>
        )}

        <nav className="detail-nav" aria-label="More software">
          <Link href={`/software/${prev.slug}`}><small>Previous</small>{prev.title}</Link>
          <Link href={`/software/${next.slug}`} className="text-right"><small>Next</small>{next.title}</Link>
        </nav>
      </main>
    </div>
  );
}
