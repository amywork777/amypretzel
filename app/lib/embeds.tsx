import Image from "next/image";
import { SafeTweet } from "./safe-tweet";
import type { Embed } from "./embed";

/**
 * Renders a project's links as the thing itself: a live site, a post, a repo
 * card, a document. Each one keeps a caption that links out, so the section
 * still works if a third party stops allowing embeds.
 */
export function Embeds({ embeds }: { embeds: Embed[] }) {
  if (embeds.length === 0) return null;
  return (
    <section className="embeds" aria-label="Project links">
      {embeds.map((embed) => (
        <figure className="embed" key={embed.kind === "tweet" ? embed.id : embed.src}>
          <figcaption className="embed-head">
            <a href={embed.href} target="_blank" rel="noopener noreferrer">{embed.label}</a>
            <span>{embed.kind === "tweet" ? "x.com" : embed.domain}</span>
          </figcaption>
          <div className="embed-frame">
            {embed.kind === "tweet" ? (
              <div data-theme="light" className="tweet-host"><SafeTweet id={embed.id} /></div>
            ) : embed.kind === "image" ? (
              <Image src={embed.src} alt={embed.label} width={1200} height={600} unoptimized />
            ) : (
              <iframe
                src={embed.src}
                title={embed.label}
                loading="lazy"
                style={{ height: embed.height }}
                allow="fullscreen; clipboard-write; encrypted-media; picture-in-picture"
              />
            )}
          </div>
        </figure>
      ))}
    </section>
  );
}
