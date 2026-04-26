# amypretzel.com site refresh — design

**Date:** 2026-04-25
**Scope:** visual cleanup, native portfolio (replaces Notion iframe), new `/writing` page

## Goals

1. Make the site read more professional while keeping the OS-window personality
2. Replace the Notion iframe portfolio with a native, content-owned page
3. Add a writing page seeded with existing X/Twitter posts

## Non-goals

- RSS, tags, comments, search
- Per-project deep-dive pages (image grid + captions only for v1)
- MDX or external CMS
- Dark mode

## Visual direction — keep, soften, kill

**Keep:**
- OS window chrome (title bar with three colored dots + fake address bar)
- Drifting fish + jellyfish that link to `/fishing` (toned-down opacity stays as-is)
- `click-hearts` easter egg
- `fade-in` reveal on scroll
- Character drawings (`amy-pretzel.png`, `amy-crochet.png`)
- Pixel font (`font-pixel`) — but reserved for window chrome + section headings only

**Soften:**
- Reduce cloud count from 6 → 2
- Soften pink/lavender saturation by ~15% (palette stays warm but reads more refined)
- Section dividers: thin neutral line instead of `&hearts;`
- Body copy switches from pixel font → Geist (already loaded by Next default) for readable paragraphs
- In-window page heading becomes "Amy Zhou — Design Engineer" (address bar still says `amypretzel.com`)

**Kill:**
- `bubbles.tsx` overlay (file deleted)
- All sparkle divs in `app/page.tsx` decorative bg
- Glossy Y2K buttons (`btn-glossy` class) — replaced with flat text links
- Heart-shaped section dividers

## Information architecture

Top nav (flat text links, no glossy buttons): `about · portfolio · writing · links · connect`

Routes:
- `/` — home (refreshed)
- `/portfolio` — native portfolio (Notion iframe removed)
- `/writing` — new
- `/fishing` — unchanged

## Page: Home (`app/page.tsx`)

Same overall structure as today minus the visual noise listed in "Kill" above. Section order unchanged: hero → about → connect → links → timeline → fish porthole (mobile) → footer. Nav updated to include `writing`.

## Page: Portfolio (`app/portfolio/page.tsx`)

Replace the entire `iframe` block with a native gallery rendered inside the same window-chrome layout the page already uses for the top bar.

**Layout:**
- 2-column responsive grid (1 col on mobile, 2 cols ≥ 640px)
- Each tile = full-bleed image + caption strip below: title (pixel-font, small), then role/context (Geist, muted), then year (Geist, very muted)
- Click on a tile → opens lightbox showing the larger image (no per-project page in v1)

**Data source:** new file `app/portfolio/projects.ts` exporting a typed array.

```ts
export type Project = {
  slug: string;
  title: string;
  role: string;        // e.g. "Apple — PD engineer"
  year?: string;       // optional, free-form ("2023", "2022–23")
  image: string;       // public-relative path
  links?: { label: string; url: string }[];
};
```

**Initial entries (18 — order = current Notion order; years left blank for user to fill in):**

| # | slug | title | role | image |
|---|---|---|---|---|
| 1 | taya-pendant | Taya pendant | AI wearable journal | `/portfolio/taya-pendant.png` |
| 2 | dog-charm | Custom dog charm | AI sketch-to-jewelry pipeline | `/portfolio/dog-charm.png` |
| 3 | taiyaki-fish | Faceted fish (Taiyaki demo) | AI sketch-to-CAD pipeline | `/portfolio/taiyaki-fish.png` |
| 4 | iphone-finewoven | iPhone FineWoven case colorways | Apple — PD engineer | `/portfolio/iphone-finewoven.png` |
| 5 | ipad-smart-folio | iPad Pro Smart Folio | Apple — PD engineer | `/portfolio/ipad-smart-folio.png` |
| 6 | pretzel-molds | Silicone pretzel molds | Stanford project | `/portfolio/pretzel-molds.png` |
| 7 | metal-lyre | Mini metal lyre | Stanford — music + product design | `/portfolio/metal-lyre.png` |
| 8 | woodwind-mouthpiece | Woodwind mouthpiece | Stanford — music + product design | `/portfolio/woodwind-mouthpiece.png` |
| 9 | cnc-spider-web | CNC spider-web art piece | Stanford — CNC art project | `/portfolio/cnc-spider-web.png` |
| 10 | tbd-gasket-plate | TBD (steel + gaskets) | TBD — fill in | `/portfolio/tbd-gasket-plate.png` |
| 11 | sushi-accessory | Sushi-eating accessory | Personal product design | `/portfolio/sushi-accessory.png` |
| 12 | clarinet-barrel | Clarinet telescoping barrel | Stanford — music + product design | `/portfolio/clarinet-barrel.png` |
| 13 | patchwork-cardigan | Patchwork crochet cardigan | Personal craft | `/portfolio/patchwork-cardigan.png` |
| 14 | arbor-press | Benchtop arbor press | Workshop tool study | `/portfolio/arbor-press.png` |
| 15 | pearl-applicator | Pearl applicator | Personal product study | `/portfolio/pearl-applicator.png` |
| 16 | tbd-panda-soap | TBD (panda soap) | TBD — fill in | `/portfolio/tbd-panda-soap.png` |
| 17 | medical-mechanism | Medical-device trigger mechanism | Case study | `/portfolio/medical-mechanism.png` |
| 18 | dumpling-press | Dumpling press | Kitchen tool study | `/portfolio/dumpling-press.png` |

Images sourced from `.notion-export/Private & Shared/`, copied to `public/portfolio/` with the slug as filename.

## Page: Writing (`app/writing/page.tsx`)

New route. Same window-chrome wrapper used by `/portfolio`.

**Layout:** vertical stack of post entries inside the in-window content area, newest first. Each entry:
- Date label (pixel font, small, muted)
- Optional title (Geist, bold)
- Body text (Geist, comfortable line-height, ~16px)
- "↗ original" link (small, muted) if `originalUrl` present
- Thin neutral divider between posts

**Data source:** new file `app/writing/posts.ts`.

```ts
export type Post = {
  slug: string;        // for permalink anchors
  date: string;        // ISO format "2026-04-15"
  title?: string;      // optional headline
  body: string;        // markdown-ish; we render as plain paragraphs split on \n\n
  originalUrl?: string; // tweet permalink
};
```

**Initial entries:** seeded with the X post Amy referenced (URL: `https://x.com/amypretzel/status/2046350294808736064`). Body text TBD — Amy to paste tweet text into the file. Future posts: paste new entries to top of array.

**Rendering note:** body is split on blank lines into `<p>` tags. No markdown parser dependency.

## Shared component: window chrome

Today the title bar + address bar HTML is duplicated across `app/page.tsx` (the in-window window) and `app/portfolio/page.tsx` (the iframe wrapper). With three pages using it, lift into `app/window-frame.tsx`:

```tsx
<WindowFrame addressBar="amypretzel.com / writing">
  {children}
</WindowFrame>
```

Internals: title bar with three dots + centered pretzel + site title; address bar; scrollable content area. Single source of truth for the chrome styling.

## Style updates (`app/globals.css`)

- Soften pink palette tokens (~15% saturation reduction)
- Remove `.btn-glossy` styles or leave deprecated but stop using them
- Add a `.divider-thin` utility for the new neutral horizontal rule
- Geist-based body styling (font-family already provided by Next)

## File changes summary

**New:**
- `app/window-frame.tsx`
- `app/writing/page.tsx`
- `app/writing/posts.ts`
- `app/portfolio/projects.ts`
- `app/portfolio/lightbox.tsx` (client component, hand-rolled — no library dependency; click outside or `Esc` to close)
- `public/portfolio/*.png` (18 images)
- `docs/superpowers/specs/2026-04-25-site-refresh-design.md` (this file)

**Modified:**
- `app/page.tsx` — strip sparkles, reduce clouds, swap glossy buttons for flat text nav, update heading
- `app/portfolio/page.tsx` — drop iframe, render native gallery
- `app/globals.css` — palette softening, divider utility
- `app/layout.tsx` — likely no change

**Deleted:**
- `app/bubbles.tsx`

## Open questions for Amy after first build

- Years on each portfolio entry (currently blank in TS file)
- Real captions for #10 and #16
- Tweet text + date for the seed writing post
- Any additional projects from outside the Notion export to add

## Out of scope (deferred)

- Per-project pages (`/portfolio/[slug]`)
- RSS feed at `/writing/rss.xml`
- Image lightbox keyboard navigation
- Open Graph meta per page
- Migration of `amypretzel.com` from `next.config` defaults to anything custom
