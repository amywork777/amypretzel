import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import SiteNav from "../site-nav";
import { softwareSections } from "./projects";

function ProjectLink({ href, children }: { href: string; children: ReactNode }) {
  const external = href.startsWith("http");

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="link meta">
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className="link meta">
      {children}
    </Link>
  );
}

export const metadata: Metadata = {
  title: "Software",
  description:
    "Software projects by Amy Zhou: AI design tools, CAD systems, community maps, macOS utilities, prompt interfaces, and side projects.",
  alternates: { canonical: "/software" },
  openGraph: {
    type: "website",
    url: "/software",
    title: "Software, Amy Zhou",
    description:
      "AI design tools, CAD systems, community maps, macOS utilities, prompt interfaces, and side projects by Amy Zhou.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Software, Amy Zhou",
    description:
      "AI design tools, CAD systems, community maps, macOS utilities, prompt interfaces, and side projects.",
  },
};

export default function SoftwarePage() {
  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <SiteNav active="software" />

      <main className="flex-1">
        <section className="max-w-4xl mx-auto px-5 sm:px-8 pt-10 sm:pt-20 pb-8 sm:pb-12">
          <p className="meta mb-4 animate-fade-up">Index, Software</p>
          <h1 className="display text-[17vw] sm:text-[88px] leading-[0.92] mb-5 animate-fade-up delay-100">
            Software.
          </h1>
          <p className="text-[15px] sm:text-[17px] leading-[1.6] text-ink-soft max-w-2xl animate-fade-up delay-200">
            AI tools, CAD systems, utilities, and small public experiments.
          </p>
        </section>

        <div className="rule" />

        <section className="max-w-4xl mx-auto px-5 sm:px-8 py-8 sm:py-12">
          <div className="space-y-10 sm:space-y-12">
            {softwareSections.map((section, sectionIndex) => (
              <section
                key={section.title}
                className="animate-fade-up"
                style={{ animationDelay: `${Math.min(sectionIndex * 80, 240)}ms` }}
              >
                <header className="mb-4 sm:mb-5">
                  <p className="meta">{section.title}</p>
                </header>

                <div className="border-t border-rule">
                  {section.projects.map((project) => (
                    <details key={project.title} className="software-row group border-b border-rule">
                      <summary className="grid cursor-pointer list-none grid-cols-[18px_1fr] gap-3 py-4 marker:hidden sm:grid-cols-[22px_1fr_auto] sm:gap-4">
                        <span className="software-caret mt-1 text-ink-faint group-open:text-accent">
                          ›
                        </span>
                        <span>
                          <span className="block font-display italic text-[24px] sm:text-[30px] leading-none text-ink group-hover:text-accent transition-colors">
                            {project.title}
                          </span>
                          <span className="meta mt-2 block">{project.meta}</span>
                        </span>
                        {project.tags && (
                          <span className="hidden sm:block meta self-center text-ink-faint">
                            {project.tags.slice(0, 2).join(" / ")}
                          </span>
                        )}
                      </summary>

                      <div className="pb-5 pl-8 sm:pl-10">
                        <p className="max-w-2xl text-[14px] sm:text-[15px] leading-[1.6] text-ink-soft">
                          {project.summary}
                        </p>

                        {project.links && (
                          <div className="mt-4 flex flex-wrap gap-3">
                            {project.links.map((link) => (
                              <ProjectLink key={link.href} href={link.href}>
                                {link.label}
                              </ProjectLink>
                            ))}
                          </div>
                        )}

                        {project.demos && (
                          <div className="mt-4 space-y-2">
                            {project.demos.map((demo) => (
                              <details
                                key={demo.src}
                                className="border border-rule bg-card"
                              >
                                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 marker:hidden">
                                  <span className="meta">{demo.label}</span>
                                  <span className="meta text-ink-faint">Watch</span>
                                </summary>
                                <div className="border-t border-rule bg-white overflow-hidden">
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
                              </details>
                            ))}
                          </div>
                        )}
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
