import type { Metadata } from "next";
import Image from "next/image";
import { LeadVideo } from "../../_ui/lead-video";
import { notFound } from "next/navigation";
import { Page, PageIntro } from "../../_ui/layout";
import { LinkList } from "../../_ui/link";
import { PrevNext } from "../../_ui/detail";
import { ProjectBar } from "../../_ui/project-bar";
import { groupOf } from "../../work";
import { renderBody } from "../../lib/render-body";
import { splitLinks, type Embed } from "../../lib/embed";
import { Embeds } from "../../lib/embeds";
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
    openGraph: { type: "article", url, title: ogTitle, description: p.summary, images: p.picture ? [{ url: `${SITE_URL}${p.picture.image}`, alt: p.title }] : undefined },
    twitter: { card: p.picture ? "summary_large_image" : "summary", title: ogTitle, description: p.summary, images: p.picture ? [`${SITE_URL}${p.picture.image}`] : undefined },
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

  const picture = project.picture;
  const idx = softwareProjects.findIndex((p) => p.slug === project.slug);
  const prev = idx > 0 ? softwareProjects[idx - 1] : softwareProjects[softwareProjects.length - 1];
  const next = idx < softwareProjects.length - 1 ? softwareProjects[idx + 1] : softwareProjects[0];

  // Demos are already embed URLs or local clips; the rest of the links become
  // embeds where the destination allows framing.
  const demoEmbeds: Embed[] = (project.demos ?? []).map(demo => {
    const href = demo.href ?? demo.src;
    const domain = new URL(href, SITE_URL).hostname.replace(/^www\./, "");
    return demo.src.endsWith(".mp4")
      ? { kind: "video", src: demo.src, label: demo.label, href, domain }
      : { kind: "frame", src: demo.src, height: demo.height ?? 560, label: demo.label, href, domain };
  });
  const { embeds, rest: otherLinks } = splitLinks(
    project.links?.map(l => ({ label: l.label, url: l.href })),
    (project.demos ?? []).map(d => d.src)
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: project.title,
    description: project.summary,
    url: `${SITE_URL}/software/${project.slug}`,
    creator: { "@type": "Person", name: "Amy Zhou", url: SITE_URL },
  };

  const group = groupOf(`/software/${project.slug}`);
  const bar = group && { href: `/#${group.id}`, title: group.short };

  return (
    <Page width="narrow" bar={<ProjectBar group={bar} title={project.title} prev={{ href: `/software/${prev.slug}`, title: prev.title }} next={{ href: `/software/${next.slug}`, title: next.title }} />}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageIntro title={project.title} meta={project.section}>{project.summary}</PageIntro>

      {/* A short demo from Amy's post on X when there is one; otherwise the
          same screenshot as its row on the homepage, whole. */}
      {picture?.video ? (
        <LeadVideo {...picture.video} label={`${project.title} demo`} />
      ) : picture && (picture.lead ? (
        <div className={picture.cutout ? "ui-media ui-lead ui-cutout" : "ui-media ui-lead"}>
          <Image src={picture.lead} alt={project.title} fill sizes="(min-width: 860px) 764px, 100vw" priority />
        </div>
      ) : (
        <div className="ui-media ui-lead-photo">
          <Image src={picture.image} alt={project.title} width={1200} height={900} sizes="(min-width: 860px) 764px, 100vw" priority />
        </div>
      ))}

      <section className="ui-prose ui-detail-body">
        <div>{renderBody(project.body)}</div>
        {otherLinks.length > 0 && <LinkList label="Links" links={otherLinks.map(l => ({ href: l.url, label: l.label }))} />}
      </section>

      {project.photos && (
        <section className="ui-photo-pair">
          {project.photos.map((src, i) => src.endsWith(".mp4") ? (
            <LeadVideo key={src} src={src} poster={src.replace(/\.mp4$/, ".webp")} width={1280} height={720} label={`${project.title}, ${i + 1}`} className="ui-media ui-photo-video" />
          ) : (
            <Image key={src} src={src} alt={`${project.title}, ${i + 1}`} width={1200} height={1600} sizes="(min-width: 860px) 380px, 50vw" />
          ))}
        </section>
      )}

      <Embeds embeds={[...demoEmbeds, ...embeds]} />

      <PrevNext
        label="More software"
        prev={{ href: `/software/${prev.slug}`, title: prev.title, ...prev.picture }}
        next={{ href: `/software/${next.slug}`, title: next.title, ...next.picture }}
      />
    </Page>
  );
}
