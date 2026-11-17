import type { ListItem } from "./_ui/list";
import { projects, studyProjects, thumbOf } from "./portfolio/projects";
import { softwareProjects } from "./software/projects";

/* The things on the homepage, grouped by kind. Physical products lead, since
   manufacturing is what Amy is most into; the earlier studies fold away
   under one line inside that group. Years come from a real source (launch
   post, repo, patent). Project pages use groupOf() to say which group they
   belong to and link back to it. */

const cover = (slug: string) => projects.find(p => p.slug === slug)!;
const object = (slug: string, text: string, year?: string): ListItem => ({ href: `/portfolio/${slug}`, ...thumbOf(slug), title: cover(slug).title, text, year });
const app = (slug: string, text: string, year: string): ListItem => {
  const p = softwareProjects.find(p => p.slug === slug)!;
  return { href: `/software/${slug}`, image: p.picture!.image, cutout: p.picture!.cutout, title: p.title, text, year };
};

export type WorkGroup = {
  id: string;
  title: string;
  /** The group's name in the project bar, where space is short. */
  short: string;
  note: string;
  items: ListItem[];
  earlier?: ListItem[];
};

export const workGroups: WorkGroup[] = [
  {
    id: "products",
    title: "Physical products",
    short: "Products",
    note: "Things I designed and took from sketch to factory.",
    items: [
      object("folding-yoga-mat", "From a creator's render to a manufactured mat.", "2026"),
      object("taya-pendant", "A wearable AI journal designed as jewelry.", "2025"),
      object("iphone-finewoven", "Led materials and integration. Patent co-inventor.", "2023"),
      object("ipad-smart-folio", "Apple accessories."),
    ],
    earlier: studyProjects.map(p => ({ href: `/portfolio/${p.slug}`, ...thumbOf(p.slug), title: p.title, text: p.role })),
  },
  {
    id: "ai-tools",
    title: "AI tools for designers",
    short: "AI tools",
    note: "Features I built at Vizcom for industrial designers.",
    items: [
      app("region-maps", "Edit each part's color and material in a render.", "2026"),
      app("extract", "Pull colors, materials and parts out of an image.", "2026"),
      app("smart-dropper", "Copy one image's style onto another.", "2026"),
      app("voice-input", "Speak prompts, in any language.", "2026"),
    ],
  },
  {
    id: "cad",
    title: "3D and CAD",
    short: "3D and CAD",
    note: "Software and data for turning ideas into real CAD.",
    items: [
      app("studio", "Open-source AI CAD for mechanical engineers.", "2026"),
      object("ai-jewelry", "AI that turns a sketch or photo into cast jewelry.", "2025"),
      app("cad-steps", "A dataset of CAD models built step by step.", "2026"),
    ],
  },
  {
    id: "tools",
    title: "Tools and toys",
    short: "Tools and toys",
    note: "Side projects, mostly made for fun.",
    items: [
      app("lipflow", "Silent dictation by lip reading. 700+ stars.", "2026"),
      app("sf-rats", "A live map of free Bay Area events.", "2024"),
      app("cute-ghostty", "A pastel terminal setup.", "2026"),
      app("screenie", "A screen recorder that edits while you record.", "2026"),
      app("selfie-booth", "An iPad photo booth that prints stickers.", "2026"),
    ],
  },
];

/** The group a project page belongs to, by its path. */
export function groupOf(href: string): WorkGroup | undefined {
  return workGroups.find(g => [...g.items, ...(g.earlier ?? [])].some(item => item.href === href));
}

/** Every project in homepage order, the earlier studies after the products
    they fold under. Previous and Next on project pages walk this order, so
    browsing them is the same as reading down the homepage. */
export const workOrder: ListItem[] = workGroups.flatMap(g => [...g.items, ...(g.earlier ?? [])]);

/** A project's homepage row: its one line and year head its page too. */
export function itemOf(href: string): ListItem | undefined {
  return workOrder.find(item => item.href === href);
}

/** The projects before and after this one in homepage order, wrapping round. */
export function neighbours(href: string): { prev: ListItem; next: ListItem } | undefined {
  const i = workOrder.findIndex(item => item.href === href);
  if (i < 0) return undefined;
  const n = workOrder.length;
  return { prev: workOrder[(i - 1 + n) % n], next: workOrder[(i + 1) % n] };
}
