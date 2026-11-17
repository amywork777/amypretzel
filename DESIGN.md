---
name: amypretzel
description: Amy Zhou's site. A cleared table with her work on it, and a pretzel or two left lying about.
colors:
  paper: "#ffffff"
  surface: "#f4f4f4"
  media: "#f4f4f4"
  ink: "#1c1c1c"
  ink-soft: "rgba(28, 28, 28, .6)"
  ink-muted: "#aaaaaa"
  rule: "rgba(28, 28, 28, .16)"
  selection: "rgba(28, 28, 28, .14)"
  paper-dark: "#000000"
  surface-dark: "#161616"
  ink-dark: "#ffffff"
  ink-soft-dark: "rgba(255, 255, 255, .6)"
  rule-dark: "rgba(255, 255, 255, .18)"
  selection-dark: "rgba(255, 255, 255, .22)"
typography:
  display:
    fontFamily: "Areal, Areal Fallback, Arial, Helvetica, sans-serif"
    fontSize: "clamp(24px, 2.4vw, 36px)"
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: "-.035em"
  title:
    fontFamily: "Areal, Areal Fallback, Arial, Helvetica, sans-serif"
    fontSize: "16px"
    fontWeight: 500
    lineHeight: 1.45
    letterSpacing: "-.015em"
  body:
    fontFamily: "Areal, Areal Fallback, Arial, Helvetica, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "-.015em"
  label:
    fontFamily: "Areal, Areal Fallback, Arial, Helvetica, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "-.015em"
rounded:
  sm: "6px"
  pill: "999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "24px"
  "6": "36px"
  "7": "48px"
  "8": "72px"
  "9": "110px"
  gutter: "20px"
  gutter-wide: "48px"
components:
  link-pill:
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: ".14em .6em .18em"
  link-pill-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.pill}"
  button-pill:
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "11px 16px"
    height: "38px"
  button-pill-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.pill}"
  button-outline:
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "7px 12px"
    height: "38px"
  button-outline-hover:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
  media-frame:
    backgroundColor: "{colors.media}"
    rounded: "{rounded.sm}"
---

# Design System: amypretzel

The source of truth is `app/globals.css` (tokens and `ui-*` classes) and `app/_ui/` (the React side). If this file and the code disagree, the code shipped, so fix this file.

## Overview

**Creative North Star: "The Cleared Table"**

Everything has been moved off the table except the work and a pretzel or two. The site is one sans, one ink, one line weight and two corner shapes, set compact and aligned. Nothing on the page competes with the objects, because the objects are the only things with colour in them.

All the warmth is spent on a few small things: a baked pretzel for a logo that squishes like dough, and a pink one left lying by the contact links. The rest is almost severe by comparison. That contrast is the design: exact everywhere, with a few things that are soft enough to squeeze. (A WebGL table of six pretzels, one per chapter of Amy's life, used to open on a first desktop visit. Amy removed it on 2026-11-16 as unnecessary: it stood between visitors and the work and repeated the bio. Don't bring it back.)

"Cool" on this site means compact, simple, minimal and polished. Earlier drafts were rejected for a staggered image grid, an oversized serif and generous editorial spacing, which read as vibe coded. The Y2K window chrome and glossy pixel look that came before those survives only as the `/fishing` game.

**Key Characteristics:**

- One family at very few sizes; hierarchy comes from position, weight and ink strength.
- No accent colour in the interface. Colour belongs to photographs and pretzels.
- Every rule, border and focus ring is 1px.
- Links are pills, including the ones inside sentences.
- One heavy 3D moment, and quiet everywhere else.

## Colors

A true neutral scale from white to near-black, with a full inversion for dark mode and no hue anywhere in the chrome.

### Neutral

- **Paper** (`paper`, `paper-dark`): the page ground. Pure white in light mode, pure black in dark.
- **Surface** (`surface`, `surface-dark`): hover fills, and the panels behind fact figures.
- **Media** (`media`): the grey box behind product shots. It stays light in dark mode, because the shots are multiplied onto it to melt their white backgrounds.
- **Ink** (`ink`, `ink-dark`): text, icons, and the fill of a hovered pill.
- **Soft Ink** (`ink-soft`, `ink-soft-dark`): body prose, captions, nav links, secondary text.
- **Muted Ink** (`ink-muted`): idle icons, list markers, loading text. Too light for anything a visitor has to read.
- **Rule** (`rule`, `rule-dark`): every hairline and pill border.

### Pretzel colours

Colour exists on the site in the pretzel marks, rendered from the 3D recipes in `app/logo-render/pretzel-geometry.ts`: the logo's lilac glaze, the secret pretzel's strawberry, and an eight-colour sprinkle mix. These are materials, not tokens. They never become interface colours.

### Named Rules

**The Ink Not Hue Rule.** Emphasis comes from ink versus soft ink, never from a colour. If a state seems to need an accent, use the inverted fill instead.

**The Melted Background Rule.** Product shots on white sit on the media surface with multiply blending, inset by padding (7% on tiles, 6% on lead shots). A shot should look placed in the box, not pasted on it.

## Typography

**Display Font:** ABC Areal (with a metric-matched Arial fallback, then Arial, Helvetica, sans-serif)
**Body Font:** ABC Areal, the same stack
**Label/Mono Font:** none. Silkscreen exists only inside `/fishing`.

**Character:** Areal is Dinamo's Arial revival, drawn for Are.na: the plainest possible voice, with enough care in it to be a choice rather than a default. Set tight, at small sizes, it reads like a well-made label.

The font file is licensed and deliberately not in this repository. See the README. Because the fallback is sized to Areal's metrics, a build without it looks plainer but does not shift.

### Hierarchy

- **Display** (`display`): page titles, the homepage statement, the footer sign-off. Weight 400, always. Size does the work, and it stays modest.
- **Title** (`title`): fact titles, prose subheads. The one place weight 500 appears.
- **Body** (`body`, 18px from 768px up and 16px below): prose in soft ink, kept to a measure of 30 to 40em.
- **Label** (`label`): nav, captions, metadata, section headings, every control.

### Named Rules

**The Two Weights Rule.** 400 and 500 only. Nothing is bold.

**The Sentence Case Rule.** Interface labels and titles are sentence case. The story and sign-off are lower case, in Amy's own voice. Nothing is all caps.

## Layout

One centred column, at most 1120px wide for indexes and 860px for reading, with a 20px gutter that becomes 48px from 768px. Vertical rhythm comes from the nine-step spacing scale, and spacing stays tight on purpose.

- **One page.** The whole site is the homepage. There is no Objects or Software index: `/portfolio` redirects to `/#products` and `/software` to `/#ai-tools`, and only the project pages live under them. Amy wants it as simple as possible, so don't add index pages, tabs or a work/personal switch back.
- **Detail pages** lead with one picture, then a 40em text column and a stack of media. A cut-out object is trimmed and centred in a 16:9 frame so it fills it; a photo is shown whole at its own shape; a software page leads with a short demo video from Amy's post on X when there is one (muted, looping and playing on its own, a phone recording centred on near-black; one where she talks gets controls to unmute; with reduced motion it waits), otherwise with the same screenshot as its homepage row. Photos of the real thing sit in pairs after the text (`photos`); an `.mp4` there plays as a short silent loop with the `.webp` of the same name as its poster. Media from her posts is saved in `public/software/<slug>/`, videos re-encoded with ffmpeg to stay small. Previous and Next carry a small picture of where they go.
- **Facts** put the title in a 180px margin with prose beside it.
- **The homepage is plain stacked lists**, after Felix Rieseberg's site (felixrieseberg.com), which Amy picked after rejecting framed cards ("portfolio-y") and a captionless shelf ("format is a bit weird") on 2026-11-16. It opens with Amy's own statement ("I like building objects, and software to build objects", the two words as pills that jump to the groups), her portrait beside two short lines, and the contact pills. The first line says where she has worked, the names in 500 weight, and describes her startup by its ideas rather than its names: "Now at Vizcom. Before that I had a startup where we explored a few ideas: materials recycling, AI concept-to-CAD, and an AI journal you wear as jewelry. Earlier, Apple and Stanford." (Amy picked the ideas-without-names version on 2026-11-16, replacing "Founded Taiyaki, Taya and Mobius".) The second is her own "Mostly interested in" line. Keep her wording; don't rewrite it. There is no separate Work list: the bio already says where she has worked, so the things follow straight after, grouped by kind, each a closed Group with one soft sentence about it: **Physical products**, **AI tools for designers**, **3D and CAD**, **Tools and toys**. Amy chose grouping by kind over grouping by company (2026-11-16) because it keeps the Vizcom tools together and the 3D work together, with manufacturing first.
- **The groups start closed.** Amy found a page of every project at once too much (2026-11-16) and chose closed groups over a few featured picks or two-per-group: each group is one line with its name, one sentence under it, a strip of its first five pictures and Show. No count: Amy asked to hide it. It opens in place to the full list. All the information stays on the page (find-in-page opens a group), and a link to a group's id (`/#products`, the statement pills, the project bar) opens it.
- **Every row in an open group has a picture** (Amy is a designer and wants pictures over text rows), then the title, one soft line and the year. A new thing goes in the group for what it is, not where it was made. App pictures are screenshots of the app in use (never a GitHub card), in `public/work/<slug>.webp`, and are listed once in `pictures` in `app/software/projects.ts`. Object pictures come from `scripts/make-thumbs.mjs` (below).
- **Taiyaki is one entry**, Taiyaki Jewelry (`/portfolio/ai-jewelry`), under 3D and CAD. Amy merged it on 2026-11-16: Taiyaki 3D was the tool behind the jewelry, so separate Taiyaki 3D and software pages double-counted it. Their old URLs redirect to the jewelry page in `next.config.ts`.
- **Older work folds away again** inside Physical products: the 13 Stanford and home studies sit closed under one "Earlier, at Stanford and home" line. Keep new secondary work in that fold.
- Longer details (proof, process, where it was made) live on each project's own page; the homepage keeps one line per thing. The page ends with the sign-off footer.

## Elevation & Depth

The website is flat. Depth comes from hairlines and the surface tone, and there is no box shadow anywhere on a page. Real depth is reserved for real objects.

### Shadow Vocabulary

- **Baked mark** (`filter: drop-shadow(0 2px 3px rgba(0, 0, 0, .18))`): grounds the logo pretzel. The secret pretzel has a smaller version.

Frosted glass (a backdrop blur) appears only where something floats over the page: the pill button and the project bar.

### Named Rules

**The Objects Get The Depth Rule.** If it is interface, it is flat. If it casts a shadow, it had better be something you could pick up.

## Shapes

Two corner families. Containers use the 6px radius: media frames, portraits, figure panels, outline buttons, and previous/next links. Anything you click to go somewhere is a full pill.

The one drawn silhouette is the pretzel. It is rendered from 3D geometry (`app/logo-render/`) by `scripts/render-logo.mjs`, never redrawn by hand or as an icon.

## Components

### Links

Plain, and a little insistent. **Every link is a pill**, sized in `em` so it can sit inside a sentence, with a 1px rule border that fills with ink on hover. Standalone links use the full-size pill button. External links open in a new tab. The exceptions are structural: the header nav, list rows, and previous/next.

### Buttons

- **Pill:** the primary shape, 38px minimum height with a half-transparent paper fill and backdrop blur, so it holds up over the 3D scene. Inverts to ink on hover.
- **Outline:** a 6px box for panel actions. Hover and pressed fill with surface.
- **Icon button:** a bare 16px icon in muted ink that goes to ink on hover. The theme toggle is the only one that matters.
- **Focus:** a 1px outline in the current colour, offset 4px, on every interactive element.

### List

`List` in `app/_ui/list.tsx`: rows on hairlines in a 680px column. Each row is a 96px 4:3 picture (72px on phones), the title (500 weight) with one soft line under it, and the year in soft tabular figures on the right; the whole row is the link and the title softens on hover. Every picture fills its frame with `cover`. Cut-outs (`cutout`) are objects trimmed onto white and multiplied, so the white becomes the light media tone and holds up in dark mode. The `small` size (56px, regular weight) is for the fold.

**Peek.** On screens 1280px and wider with a pointer, hovering or focusing a row shows its picture at up to 280px in the empty margin to the right of the list, sliding in from 6px over .35s on the site curve. It is the list's one bit of motion; nowhere else.

**Object pictures** are made by `scripts/make-thumbs.mjs` from each object's cover and first gallery image: a cut-out is trimmed to the object and re-centred on white (4:3 for the list in `public/thumbs/<slug>.webp`, 16:9 for the page lead in `public/thumbs/<slug>-lead.webp`), so a pendant fills its frame instead of being a speck in a wide render; a photo is cropped to 4:3 for the list and shown whole on the page. It writes `app/portfolio/thumbs.json`. Run it after adding or changing an object's cover or first gallery image.

### Group

`Group` in `app/_ui/list.tsx`: a native `details` closed to one line on a hairline. The name (500) with one soft sentence under it on the left; on the right the group's first five pictures as a loose overlapping pile, each a degree or two askew like prints left on the table (three on small screens, two on phones), then Show or Hide as the site's pill. Each picture is cut out of the one beneath by a 2px ring of page colour, which is a gap, not a line. Hovering the line straightens the pile and fills the pill with ink. The strip steps aside when the group opens, since the list shows the pictures properly. Every group line is the same height. `OpenOnHash` (`app/_ui/open-on-hash.tsx`) opens the group a fragment points at.

`Earlier` is a native `details` fold: one soft line with a count and Show/Hide on the right.

### Section Heading

A label-size title sitting under a hairline, above a group of items, on the facts page. On the homepage the Group line plays this part. There are no eyebrows, numbers or dividers.

### Navigation

The header sits on the same column as the page under it (the list column on the homepage, the reading column on project pages), so the pretzel lines up with the text and the links end where the text ends. The 44px pretzel mark sits left and goes home; on the right sit Work (`/#work`, the groups), About (`/#about`, the bio and contact links) and the theme toggle, in soft ink. Amy picked Work and About on 2026-11-16, over Objects/Software and one link per group; Pretzels went with the table. Hovering the mark squishes it like soft dough.

**Project bar.** On a project page, once the title has scrolled away, a slim 52px bar slides down from the top: a 28px pretzel home, the group the project sits in as a soft link back to it (opened), a hairline slash, the project's name in ink, and Previous and Next on the right. It is paper, nearly opaque, with a hairline under it, and it steps aside at the top (where the header is) and at the foot (where the bigger Previous and Next are). Group names come from `app/work.ts`, which also feeds the homepage groups, so a project's group is defined in one place.

### Small Pretzels

- **Stray pretzel:** a pink, sprinkled 30px pretzel lies askew by the contact links, leads to the secret facts page, and wiggles when found. Keep it unlabelled. Do not add it to the nav.

## Do's and Don'ts

### Do:

- **Do** build from the `ui-*` classes and `app/_ui/` components, and extend the tokens before adding a one-off value.
- **Do** use word labels for navigation. "Previous" and "Next", not arrows.
- **Do** keep every frame in a grid the same size.
- **Do** keep all line work at 1px, including new borders and SVG strokes.
- **Do** make anything animated respect `prefers-reduced-motion`. The global rule covers CSS.
- **Do** check phones as a first-class layout, not a shrunken desktop.

### Don't:

- **Don't** add an accent colour to the interface.
- **Don't** use a staggered or masonry image grid.
- **Don't** set oversized display type or a serif.
- **Don't** add shadows, gradients, or cards to the website.
- **Don't** add a 3D scene, intro or splash in front of the work. Amy removed the pretzel table for that reason.
- **Don't** use `/fishing` styles on other pages, or load its pixel font outside that route.
- **Don't** open the homepage groups by default or add featured picks above them; Amy wants the page short.
- **Don't** commit the font file.
