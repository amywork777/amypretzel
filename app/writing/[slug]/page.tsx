import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import SiteNav from "../../site-nav";
import { excerpt, formatDate, getAllPosts, getPost } from "../posts";
import { mdxComponents } from "../mdx-components";

const SITE_URL = "https://amypretzel.com";

function postDescription(post: { description?: string; body: string }): string {
  if (post.description) return post.description;
  return excerpt(post.body).replace(/\s+/g, " ").trim().slice(0, 160);
}

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  const title = post.title ?? "Note";
  const description = postDescription(post);
  const url = `/writing/${slug}`;
  const ogTitle = `${title}, Amy Zhou`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: ogTitle,
      description,
      publishedTime: post.date,
      authors: ["Amy Zhou"],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
    },
  };
}

export default async function NotePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const all = await getAllPosts();
  const idx = all.findIndex((p) => p.slug === post.slug);
  const prev = idx > 0 ? all[idx - 1] : null;
  const next = idx < all.length - 1 ? all[idx + 1] : null;

  const url = `${SITE_URL}/writing/${post.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": post.title ? "Article" : "SocialMediaPosting",
    headline: post.title ?? postDescription(post),
    description: postDescription(post),
    datePublished: post.date,
    dateModified: post.date,
    author: { "@type": "Person", name: "Amy Zhou", url: SITE_URL },
    publisher: { "@type": "Person", name: "Amy Zhou", url: SITE_URL },
    url,
    mainEntityOfPage: url,
    ...(post.originalUrl ? { sameAs: [post.originalUrl] } : {}),
  };

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteNav active="writing" />

      <main className="flex-1">
        {/* === HEADER === */}
        <section className="max-w-3xl mx-auto px-5 sm:px-8 pt-8 sm:pt-16 pb-7 sm:pb-10">
          <Link href="/writing" className="link-soft meta inline-block mb-5 sm:mb-7 animate-fade-up">
            All notes
          </Link>
          <p className="meta mb-3 sm:mb-4 animate-fade-up delay-100">{formatDate(post.date)}</p>
          {post.title && (
            <h1 className="display text-[32px] sm:text-[56px] md:text-[72px] leading-[1.05] sm:leading-[1.0] mb-5 sm:mb-6 animate-fade-up delay-200">
              {post.title}
            </h1>
          )}
          {post.originalUrl && (
            <a
              href={post.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="link-soft meta animate-fade-up delay-300"
            >
              Originally posted on X
            </a>
          )}
        </section>

        <div className="rule" />

        {/* === BODY (MDX) === */}
        <section className="max-w-3xl mx-auto px-5 sm:px-8 py-10 sm:py-16">
          <MDXRemote source={post.body} components={mdxComponents} />
        </section>

        {/* === PREV / NEXT === */}
        {(prev || next) && (
          <>
            <div className="rule" />
            <section className="max-w-3xl mx-auto px-5 sm:px-8 py-8 sm:py-10">
              <div className="grid grid-cols-2 gap-4 sm:gap-10">
                {prev ? (
                  <Link href={`/writing/${prev.slug}`} className="group block">
                    <p className="meta text-ink-faint mb-1.5 group-hover:text-accent transition-colors">Newer</p>
                    <p className="font-display italic text-[20px] sm:text-[22px] leading-[1.1] text-ink group-hover:text-accent transition-colors">
                      {prev.title ?? "Untitled"}
                    </p>
                  </Link>
                ) : (
                  <span />
                )}
                {next ? (
                  <Link href={`/writing/${next.slug}`} className="group block text-right">
                    <p className="meta text-ink-faint mb-1.5 group-hover:text-accent transition-colors">Older</p>
                    <p className="font-display italic text-[20px] sm:text-[22px] leading-[1.1] text-ink group-hover:text-accent transition-colors">
                      {next.title ?? "Untitled"}
                    </p>
                  </Link>
                ) : (
                  <span />
                )}
              </div>
            </section>
          </>
        )}
      </main>

      <footer className="border-t border-rule mt-auto">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-6 meta">
          <span>© 2026 Amy Zhou</span>
        </div>
      </footer>
    </div>
  );
}
