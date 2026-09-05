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
        <section className="max-w-5xl mx-auto px-5 sm:px-8 pt-8 sm:pt-16 pb-7 sm:pb-10">
          <Link href="/#software" className="link-soft meta inline-block mb-5 sm:mb-7 animate-fade-up">
            All software
          </Link>
          <div className="flex items-baseline justify-between gap-4 sm:gap-6 flex-wrap mb-3">
            <h1 className="display text-[38px] sm:text-[64px] md:text-[88px] leading-[0.98] animate-fade-up delay-100">
              {project.title}
            </h1>
            <span className="meta animate-fade-up delay-100">{project.section}</span>
          </div>
          <p className="meta text-ink animate-fade-up delay-200">{project.meta}</p>
          {project.tags && (
            <p className="meta text-ink-faint mt-2 animate-fade-up delay-200">
              {project.tags.join(" / ")}
            </p>
          )}
        </section>

        <div className="rule" />

        <section className="max-w-3xl mx-auto px-5 sm:px-8 py-10 sm:py-16">
          <div>{renderBody(project.body)}</div>

          {project.links && project.links.length > 0 && (
            <div className="mt-10 pt-6 border-t border-rule">
              <p className="meta mb-3">Links</p>
              <ul className="space-y-2">
                {project.links.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      target={l.href.startsWith("http") ? "_blank" : undefined}
                      rel={l.href.startsWith("http") ? "noopener noreferrer" : undefined}
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

        {project.demos && project.demos.length > 0 && (
          <>
            <div className="rule" />
            <section className="max-w-3xl mx-auto px-5 sm:px-8 py-10 sm:py-16">
              <p className="meta mb-5">Demos</p>
              <div className="space-y-4">
                {project.demos.map((demo) => (
                  <div key={demo.src} className="border border-rule bg-card">
                    <p className="meta px-3 py-2 border-b border-rule">{demo.label}</p>
                    <div className="bg-white overflow-hidden">
                      <iframe
                        src={demo.src}
                        height="399"
                        width="504"
                        frameBorder="0"
                        allowFullScreen
                        title={`${project.title}, ${demo.label}`}
                        loading="lazy"
                        className="block w-full min-h-[399px]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        <div className="rule" />
        <section className="max-w-5xl mx-auto px-5 sm:px-8 py-8 sm:py-10">
          <div className="grid grid-cols-2 gap-4 sm:gap-10">
            <Link href={`/software/${prev.slug}`} className="group block">
              <p className="meta text-ink-faint mb-1.5 group-hover:text-accent transition-colors">Prev</p>
              <p className="font-display italic text-[18px] sm:text-[26px] leading-[1.1] text-ink group-hover:text-accent transition-colors">
                {prev.title}
              </p>
            </Link>
            <Link href={`/software/${next.slug}`} className="group block text-right">
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
