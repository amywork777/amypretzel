/**
 * Turns a project link into something the page can show rather than just
 * link to. Only sites that actually allow framing are embedded; press
 * coverage (Medium, Fabbaloo, Google Patents, Notion) sets X-Frame-Options
 * or a frame-ancestors policy, so those stay as plain links.
 */
export type Embed =
  | { kind: "tweet"; id: string; label: string; href: string }
  | { kind: "frame"; src: string; height: number; label: string; href: string; domain: string }
  | { kind: "image"; src: string; label: string; href: string; domain: string };

// Amy's own sites, which set no framing headers, so they can run live in the page.
const LIVE_SITES = [
  "sfrats-map.vercel.app",
  "cute-ghostty.vercel.app",
  "landing-two-phi-66.vercel.app",
  "tayanecklace.com",
];

function domainOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function toEmbed(url: string, label: string): Embed | null {
  // Internal pages and anchors are navigation, not media.
  if (!url.startsWith("http") && !url.endsWith(".pdf")) return null;
  const domain = domainOf(url);

  const tweet = url.match(/(?:x|twitter)\.com\/[^/]+\/status\/(\d+)/);
  if (tweet) return { kind: "tweet", id: tweet[1], label, href: url };

  // LinkedIn posts carry either an activity or a ugcPost URN; both embed.
  const linkedIn = url.match(/linkedin\.com\/.*urn:li:(activity|ugcPost):(\d+)/);
  if (linkedIn) {
    return {
      kind: "frame",
      src: `https://www.linkedin.com/embed/feed/update/urn:li:${linkedIn[1]}:${linkedIn[2]}`,
      height: 560,
      label,
      href: url,
      domain,
    };
  }

  // Hugging Face only frames a dataset that has a working viewer; this one
  // reports "viewer is not available", which embeds as an empty box.

  // GitHub renders a repo card as an image, which is lighter than an iframe
  // and shows the description, language and star count.
  const repo = url.match(/^https:\/\/github\.com\/([^/?#]+)\/([^/?#]+)\/?$/);
  if (repo) {
    return {
      kind: "image",
      src: `https://opengraph.githubassets.com/1/${repo[1]}/${repo[2]}`,
      label,
      href: url,
      domain,
    };
  }

  const drive = url.match(/drive\.google\.com\/file\/d\/([^/?#]+)/);
  if (drive) {
    // A Drive audio player needs far less room than a document preview.
    const isAudio = /listen|audio|recording|song|track/i.test(label);
    return {
      kind: "frame",
      src: `https://drive.google.com/file/d/${drive[1]}/preview`,
      height: isAudio ? 200 : 640,
      label,
      href: url,
      domain,
    };
  }

  if (url.endsWith(".pdf")) {
    return { kind: "frame", src: url, height: 640, label, href: url, domain: domain || "pdf" };
  }

  if (LIVE_SITES.includes(domain)) {
    return { kind: "frame", src: url, height: 560, label, href: url, domain };
  }

  return null;
}

export type SplitLinks = { embeds: Embed[]; rest: { label: string; url: string }[] };

/** Splits a project's links into things to show and things to link to. */
export function splitLinks(
  links: { label: string; url: string }[] | undefined,
  alreadyShown: string[] = []
): SplitLinks {
  const embeds: Embed[] = [];
  const rest: { label: string; url: string }[] = [];
  const seen = new Set(alreadyShown);
  for (const link of links ?? []) {
    const embed = toEmbed(link.url, link.label);
    const id = embed ? (embed.kind === "tweet" ? embed.id : embed.src) : "";
    if (embed && !seen.has(id)) {
      seen.add(id);
      embeds.push(embed);
    } else {
      rest.push(link);
    }
  }
  return { embeds, rest };
}
