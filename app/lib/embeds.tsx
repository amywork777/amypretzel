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
export function Embeds({ embeds: all }: { embeds: Embed[] }) {
  if (all.length === 0) return null;
  // Repos read as one list of code after the media, not a card apiece.
  const repos = all.filter((e): e is Extract<Embed, { kind: "repo" }> => e.kind === "repo");
  const embeds = all.filter((e): e is Exclude<Embed, { kind: "repo" }> => e.kind !== "repo");
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
      {repos.length > 0 && (
        <ul className="ui-repos" aria-label="Code">
          {repos.map(r => (
            <li key={r.href}>
              <a className="ui-repo" href={r.href} target="_blank" rel="noreferrer">
                <span className="ui-repo-name"><span className="ui-repo-owner">{r.owner}/</span>{r.name}</span>
                {r.description && <span className="ui-repo-desc">{r.description}</span>}
                <span className="ui-repo-meta">{[r.stars >= 20 ? `${starCount(r.stars)} stars` : "", r.language, "GitHub"].filter(Boolean).join(" · ")}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** 39, 723, 27k: whole stars under ten thousand, then thousands. */
function starCount(n: number) {
  return n >= 10000 ? `${Math.round(n / 1000)}k` : n.toLocaleString("en-US");
}
