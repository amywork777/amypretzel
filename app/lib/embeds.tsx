import Image from "next/image";
import { SafeTweet } from "./safe-tweet";
import { TextLink } from "../_ui/link";
import type { Embed } from "./embed";
import { LeadVideo } from "../_ui/lead-video";

/** Video players: shown like the lead video, not as a framed document. */
const PLAYER = /youtube\.com\/embed|instagram\.com|tiktok\.com/;

/**
 * Renders a project's links as the thing itself: a live site, a post, a repo
 * card, a document. Each one keeps a caption that links out, so the section
 * still works if a third party stops allowing embeds.
 */
export function Embeds({ embeds }: { embeds: Embed[] }) {
  if (embeds.length === 0) return null;
  return (
    <section className="ui-embeds" aria-label="Project links">
      {embeds.map((embed) => {
        const key = embed.kind === "tweet" ? embed.id : embed.src;
        const caption = (
          <figcaption className="ui-embed-head">
            <TextLink href={embed.href}>{embed.label}</TextLink>
            <span className="ui-meta">{embed.kind === "tweet" ? "x.com" : embed.domain}</span>
          </figcaption>
        );
        // A video, a YouTube film or a reel looks like the page's lead video:
        // no border, rounded, the caption under it rather than over it.
        if (embed.kind === "video") {
          return (
            <figure className="ui-embed ui-embed--player" key={key}>
              <LeadVideo src={embed.src} poster={embed.poster} width={embed.width} height={embed.height} sound={embed.sound} label={embed.label} className={embed.height > embed.width ? "ui-media ui-lead-video ui-lead-video--tall" : "ui-media ui-lead-video"} />
              {caption}
            </figure>
          );
        }
        if (embed.kind === "frame" && PLAYER.test(embed.src)) {
          return (
            <figure className={embed.narrow ? "ui-embed ui-embed--player ui-embed--narrow" : "ui-embed ui-embed--player"} key={key}>
              <div className="ui-media ui-embed-player">
                <iframe src={embed.src} title={embed.label} loading="lazy" style={embed.narrow ? { height: embed.height } : undefined} allow="fullscreen; clipboard-write; encrypted-media; picture-in-picture" allowFullScreen />
              </div>
              {caption}
            </figure>
          );
        }
        return (
          <figure className="ui-embed" key={key}>
            {caption}
            <div className="ui-media ui-embed-frame">
              {embed.kind === "tweet" ? (
                <div data-theme="light" className="tweet-host"><SafeTweet id={embed.id} /></div>
              ) : embed.kind === "image" ? (
                <Image src={embed.src} alt={embed.label} width={1200} height={600} unoptimized />
              ) : (<>
                <span className="ui-embed-loading" aria-hidden="true">Loading {embed.domain}</span>
                <iframe
                  src={embed.src}
                  title={embed.label}
                  loading="lazy"
                  style={{ height: embed.height }}
                  allow="fullscreen; clipboard-write; encrypted-media; picture-in-picture"
                />
              </>)}
            </div>
          </figure>
        );
      })}
    </section>
  );
}
