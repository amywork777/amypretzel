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

All the warmth is spent on a few small things: a hand-drawn pretzel for a logo that boils like a sketch and squishes like dough, and a tiny one left lying at the foot of the page. The rest is almost severe by comparison. That contrast is the design: exact everywhere, with a few things that are soft enough to squeeze. (A WebGL table of six pretzels, one per chapter of Amy's life, used to open on a first desktop visit. Amy removed it on 2026-11-16 as unnecessary: it stood between visitors and the work and repeated the bio. Don't bring it back.)

"Cool" on this site means compact, simple, minimal and polished. Earlier drafts were rejected for a staggered image grid, an oversized serif and generous editorial spacing, which read as vibe coded. The Y2K window chrome and glossy pixel look that came before those survives only as the `/fishing` game.

**Key Characteristics:**

- One family at very few sizes; hierarchy comes from position, weight and ink strength.
- No accent colour in the interface. Colour belongs to photographs.
- Only sketch icons. Every mark and icon (the pretzels, the group marks, the favicon, the theme switch's sun and moon) is drawn in ink with the taste kit's boiling line, never a coloured picture. Amy, 2026-11-16: "no more colored things only sketch icons."
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

### Pretzel colours (retired)

The pretzel marks used to be rendered from the 3D recipes in `app/logo-render/pretzel-geometry.ts` (lilac glaze, strawberry, sprinkles). Since 2026-11-16 they are ink sketches and the site has no coloured marks. The renderer stays for reference only; nothing on the site uses its output.

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

- **Display** (`display`): page titles, the homepage statement. Weight 400, always. Size does the work, and it stays modest.
- **Title** (`title`): fact titles, prose subheads. The one place weight 500 appears.
- **Body** (`body`, 18px from 768px up and 16px below): prose in soft ink, kept to a measure of 30 to 40em.
- **Label** (`label`): nav, captions, metadata, section headings, every control.

### Named Rules

**The Two Weights Rule.** 400 and 500 only. Nothing is bold.

**The Sentence Case Rule.** Interface labels and titles are sentence case. The story is lower case, in Amy's own voice. Nothing is all caps.

## Layout

One centred column, at most 1120px wide for indexes and 860px for reading, with a 20px gutter that becomes 48px from 768px. Vertical rhythm comes from the nine-step spacing scale, and spacing stays tight on purpose.

- **One page.** The whole site is the homepage. There is no Objects or Software index: `/portfolio` redirects to `/#products` and `/software` to `/#ai-tools`, and only the project pages live under them. Amy wants it as simple as possible, so don't add index pages, tabs or a work/personal switch back.
- **Every project page has one pattern** (Amy asked for the site to be more cohesive, 2026-11-16): the title, the year on the right and, under it, the same one line as its homepage row, all read from `app/work.ts` so what you clicked is what heads the page. Then the picture, the text, the media, and Previous and Next. Previous and Next walk the homepage order across every group (`workOrder`), the earlier studies after Physical products, so browsing them is reading down the homepage; on phones they stack full width. Don't open a body with a bold restatement of that line.
- **Detail pages** lead with the most dynamic, illustrative and accurate example there is (Amy, 2026-11-16): a real film over a screenshot, the live site over a picture of it (`picture.site`, SF Rats' map in a framed iframe), a launch film over a photo (`project.video`, Taya). Accuracy beats motion: a mascot loop or staged clip that doesn't show the work doesn't count; a project with nothing true and moving to lead with comes off the site (Screenie, removed 2026-11-16). After the lead, a 40em text column and a stack of media. A cut-out object is trimmed and centred in a 16:9 frame so it fills it; a photo is shown whole at its own shape; a software page leads with a short demo video from Amy's post on X when there is one (muted, looping and playing on its own, a phone recording centred on near-black; one where she talks gets controls to unmute; with reduced motion it waits), otherwise with the same screenshot as its homepage row. **Mini demos.** Amy wanted visitors to try the work, not read about it (2026-11-16). A project with a demo has one client component in `app/demos/<slug>.tsx`, registered in `app/demos/index.ts` and loaded as its own chunk; anything heavy (three.js, a face tracker) loads when the demo nears the screen. A software page leads with its demo and its demo video moves below the text, except where the video is better (`videoFirst`: Region Maps, Lipflow, Smart Dropper, Cute Ghostty), when the demo sits right under it; an object page keeps the photo of the real thing first, demo under it. Every demo uses the `.ui-try` frame: the stage on the media surface, pill controls (filled while chosen), and one soft caption starting "Try it:" that says plainly what is real and what is simplified. They server-render a still (no empty box, no layout shift), respect reduced motion, and never fake an AI result: a demo either does the real thing in the browser (Region Maps recolour, Lipflow's exact mouth crop, the selfie booth's own dithering, Cute Ghostty's real themes, the yoga mat's real crease pattern and fold order, the Taiyaki castability cleanup, the harp and clarinet physics, the spider board from its photos) or replays recorded results with the gesture live (Smart Dropper). CAD-Steps shows its sample's ten real states as a numbered grid of stills instead of a 3D viewer (Amy found the viewer not useful; pictures read as "how it gets built" at a glance). The Taiyaki demo opens on a sculpted goldfish (Amy's pick) with a dog beside it, simple sculpts after real Taiyaki charms, said so in its caption; the duck was cut because its sculpt read as a snowman. Extract and Voice input have none: Amy removed them, because Extract is really about parts (it plays the launch film's parts sequence as a silent loop instead), and Voice reads better from its video. **Studio** is the site's design case study (Amy, 2026-11-21: she wants the page to "show taste", showing the UI and UX the way a designer's page would, not the app's outputs). Its build film leads; under it the screen's anatomy (`app/demos/studio-anatomy.tsx`): one real full-window capture with six numbered parts, where pointing at a number dims the rest of the window behind a veil with a 1px-framed hole and inks that part's line in the list beneath (title in 500, the design reason in soft ink). The text is a case story with "The design problem" and Amy's design decisions, and says she designed and built Studio end to end (its CAD runs on Jake's text-to-cad). After the text (`demosAfter` in `app/demos/index.ts`): "The rules it's designed by" (`studio-principles.tsx`), six of Studio's own design laws, each beside a tight full-resolution crop of the UI detail that shows it, in identical 4:3 frames melted onto the media surface; then "The job, step by step" (`studio-tour.tsx`), nine steps grouped Shape it / Check it / Make it, each with what the engineer wants, what they do and what Studio does, the first a wipe from an old hand drawing to the CAD Studio made from it; then the 25-part linear stage as a GLB to turn, explode and pick parts on. The anatomy, the details and four of the steps come from one real chat in an isolated Studio on its motor mount plate example (2026-11-21). Like every project page it stays in the reading column (Amy, 2026-11-21: Studio looked too wide next to the others, and every project should be formatted the same); an earlier 1200px breakout was removed. Each chapter opens with a real title (22 to 28px, weight 400) and one soft line. Frames (`Sheet` in `app/demos/studio-parts.tsx`) are quiet: the stage on the media surface, 10px corners with a hairline, and one caption line under it (title in ink, note in muted ink); they rise in once on scroll. The step-by-step chapter is rows of step pills grouped by phase above one fixed 16:10 stage. Detail crops that run past their frame fade out rather than stop mid-line. Ink and hairlines only. (Amy, 2026-11-21, asked for it to look way better; the earlier drawing-sheet borders, zone numbers and title blocks were dropped as noise.) Screenshots leave out tabs and chat that carry part numbers, and nothing names a customer. **Case study pages** share one set of pieces (`app/demos/case-study.tsx`: `Hero`, `Anatomy`, `Details`, styled in `studio.css`). Studio and, since 2026-11-21, Region Maps use them. Studio leads with a hero still on the media surface and plays its film after the text at full width; Region Maps keeps its launch film at the top (Amy: it's really nice), the try-it demo under it. Both then show an anatomy of one real screen and close-ups of its details. Region Maps' pictures are frames of Vizcom's own launch film and tutorial recordings (`public/software/region-maps/`), since Vizcom is closed. A new case study passes its own pictures and words; don't fork the components. **Repo links** show as one quiet list of rows (`.ui-repos`, from `public/github/repos.json`, saved at build by `scripts/fetch-github-cards.mjs`), not GitHub's card images, which Amy found louder than the page; stars show only from 20. **Link previews**: each project page has its own `public/og/<slug>.jpg` in the site preview's layout, made by `scripts/make-og.py` from the running homepage; rerun it after adding a project or changing a cover or line. Region Maps' boot comes from the launch video: masks by hue from the frame where it turns red, blue and yellow, the grey frame before it as the base, cropped above the caption that ghosts into the frames. Each Vizcom page links "Try it in Vizcom" and its docs page where one exists. Pages don't show code: open-source projects link their repo, and the Vizcom features are closed. Photos of the real thing sit in pairs after the text (`photos`); an `.mp4` there plays as a short silent loop with the `.webp` of the same name as its poster. Media from her posts is saved in `public/software/<slug>/`, videos re-encoded with ffmpeg to stay small. LinkedIn embeds are not used: some browsers block them and they showed as blank, so each LinkedIn video is saved locally (from the post's `data-sources`) and its row links to the post. Photos after the text stack when there are three or fewer and sit in two columns at their own shapes when there are four or more (`app/_ui/gallery.tsx`, sizes read from the file headers at build by `app/lib/image-size.ts`); any photo opens full size, with arrows and Escape, so a process board's small text stays readable. Embeds: an Instagram reel or TikTok uses its own player held to phone width (Tara's reel on the yoga mat, as the inspiration); a recording that lived on Drive is saved in the repo and plays in its own player with sound at its own shape, a tall phone clip held to the screen's height (Drive's player cut the harp video off). Every video on a page is shown the lead video's way (Amy, 2026-11-16): no border, rounded, playing muted on a loop while on screen and pausing off it, opening on a still from its own footage, controls only when it has a sound track (read from the file at build), its caption under it; YouTube films and reels sit in the same borderless frame. A lead video can take a `rate` (Smart Dropper's launch film plays at 1.5×). Previous and Next carry a small picture of where they go. Every picture is served from the repo: the 106 images that used to load from Amy's old Cargo site were saved as WebP under `public/portfolio/<slug>/` on 2026-11-16, so nothing hotlinks a site she might close.
- **Documents.** The FineWoven patent shows one whole US letter page at the column's width (`.ui-pdf`), never a strip.
- **Facts** put the title in a 180px margin with prose beside it.
- **The homepage is plain stacked lists**, after Felix Rieseberg's site (felixrieseberg.com), which Amy picked after rejecting framed cards ("portfolio-y") and a captionless shelf ("format is a bit weird") on 2026-11-16. It opens with Amy's own statement ("I like building objects, and software to build objects", plain text: it used to carry two pills that filtered the list by kind, which Amy found weird on 2026-11-21, since they looked like links but filtered, and the group pills below already sort the work), her portrait beside two short lines, and the contact pills. The first line says where she has worked, the names in 500 weight, and describes her startup by its ideas rather than its names: "Now at Vizcom. Before that I had a startup where we explored a few ideas: materials recycling, AI concept-to-CAD, and an AI journal you wear as jewelry. Earlier, Apple and Stanford." (Amy picked the ideas-without-names version on 2026-11-16, replacing "Founded Taiyaki, Taya and Mobius".) The second is her own "Mostly interested in" line. Keep her wording; don't rewrite it. There is no separate Work list: the bio already says where she has worked, so the things follow straight after, grouped by kind, each a closed Group with one soft sentence about it: **CAD software**, **AI tools for designers**, **Physical products**, **Tools and toys**. Amy chose grouping by kind over grouping by company (2026-11-16) because it keeps the Vizcom tools together and the 3D work together. Since 2026-11-21 software leads, because software for physical products is what she most wants to show: CAD software first (Studio at its head), then the AI tools she shipped at Vizcom, then Physical products as the hardware credibility behind them. "3D and CAD" was renamed "CAD software" so it reads as software, not 3D modelling; it stays its own group rather than merging into AI tools, since its users are mechanical engineers, not industrial designers.
- **Numbered points.** A body line starting `1. ` becomes one of a row of numbered points (`.ui-points`): a muted number, the first sentence as its title in ink, the rest soft under it. Studio's three goals use it. On a case study page the body's `##` headings are set like the picture chapters' titles (22 to 28px, weight 400), so text and picture chapters share one rhythm; Studio's "How it went" keeps only the decisions the picture chapters don't already show.
- **The groups start closed.** Amy found a page of every project at once too much (2026-11-16) and chose closed groups over a few featured picks or two-per-group: each group is one line with its name as a pill, one sentence under it and a strip of its first five pictures. Amy merged the name and the old Show/Hide pill into one pill on 2026-11-16 ("less is more"). No count: Amy asked to hide it. It opens in place to the full list. All the information stays on the page (find-in-page opens a group), and a link to a group's id (`/#products`, the statement pills, the project bar) opens it.
- **Proof.** A row can end its soft line with one checkable fact in ink (`proof` in `app/work.ts`): the yoga mat's AI-run CAD and sourcing, Taya's raise and a16z speedrun (Amy's post leaving Taya, 2026-01-05), the FineWoven patent, Lipflow's stars. Ink against soft ink, never weight or colour. The same fact ends the project page's lede. Only facts with a public source; a row without one stays without rather than get a soft claim.
- **Case stories.** The yoga mat, Region Maps, Studio and Taya bodies follow one shape: what it is in a sentence or two, why it was hard ("The engineering problem"), the decisions as bullets ("How it went"), and what's next or what happened. Use it for any new project with a real story; don't invent outcomes to fill it.
- **Every row in an open group has a picture** (Amy is a designer and wants pictures over text rows), then the title, one soft line and the year. A new thing goes in the group for what it is, not where it was made. App pictures are screenshots of the app in use (never a GitHub card), in `public/work/<slug>.webp`, and are listed once in `pictures` in `app/software/projects.ts`. Object pictures come from `scripts/make-thumbs.mjs` (below).
- **Taiyaki is one entry**, Taiyaki Jewelry (`/portfolio/ai-jewelry`), under CAD software. Amy merged it on 2026-11-16: Taiyaki 3D was the tool behind the jewelry, so separate Taiyaki 3D and software pages double-counted it. Their old URLs redirect to the jewelry page in `next.config.ts`.
- **Older work folds away again** inside Physical products: the 13 Stanford and home studies sit closed under one "Earlier, at Stanford and home" line. Keep new secondary work in that fold.
- Longer details (proof, process, where it was made) live on each project's own page; the homepage keeps one line per thing. Pages end with plain space, no sign-off: Amy removed "I love meeting people who make things. Email me" on 2026-11-16; the contact links live with the bio on the homepage, and the pretzel goes home. The 404 is the site's own page: "Nothing here." with pills to the work and the bio. The facts page sits on the reading column like a project page.

## Elevation & Depth

The website is flat. Depth comes from hairlines and the surface tone, and there is no box shadow anywhere on a page. Real depth is reserved for real objects.

### Shadow Vocabulary


Frosted glass (a backdrop blur) appears only where something floats over the page: the pill button and the project bar.

### Named Rules

**The Objects Get The Depth Rule.** If it is interface, it is flat. If it casts a shadow, it had better be something you could pick up.

## Shapes

Two corner families. Containers use the 6px radius: media frames, portraits, figure panels, outline buttons, and previous/next links. Anything you click to go somewhere is a full pill.

The pretzel is a sketch (`app/_ui/pretzel-mark.tsx`): one rope looped into two lobes, crossing in an X with the under-strand broken, in `currentColor` with a non-scaling line, boiling through `#taste-boil`. `SketchDefs` mounts that filter once in the root layout for every sketch mark. The favicon is the same drawing (`public/icon.svg`, inking itself light or dark; the PNGs and ICO are rasterised from it).

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

`Group` in `app/_ui/list.tsx`: a native `details` closed to one line on a hairline. The name is the site's pill (500 weight, base size) and the line's only control: it fills with ink on hover and stays filled while the group is open. One soft sentence sits under it, indented to the pill's text; on the right, the group's own hand-drawn mark (`app/_ui/group-marks.tsx`), which Amy picked on 2026-11-16 over 2x2 picture tiles, an objects-to-software spectrum and a tidier picture strip, replacing the pile of thumbnails: an iPad folio and an iPhone case drawn like a part drawing, camera cut-out, side button, a dash-dot centreline and a height dimension (Physical products; Amy asked for it "more hardware engineer-y", replacing a folding mat), a pencil drawing a line with a spark (AI tools), a wireframe cube with a dimension line (CAD software), a waving ghost after Cute Ghostty (Tools and toys). They are drawn in the taste kit's hand (2px round strokes, 64 by 48) and boil through the kit's SVG filter (`app/_ui/taste/`, copied from `~/code/taste/kit`, mounted once on the homepage), in soft ink; hovering the line inks the mark in, tips it a few degrees on a small spring and fills the name's pill, and an open group keeps it inked. Reduced motion holds a single frame. The picture pile (`ui-group-strip`) remains only as the fallback for a group without a mark. Every group line is the same height. `OpenOnHash` (`app/_ui/open-on-hash.tsx`) opens the group a fragment points at.

`Earlier` is a native `details` fold under a small pill ("Earlier, at Stanford and home"), filled while open like the group names. No count and no Show/Hide.

### Section Heading

A label-size title sitting under a hairline, above a group of items, on the facts page. On the homepage the Group line plays this part. There are no eyebrows, numbers or dividers.

### Navigation

The header sits on the same column as the page under it (the list column on the homepage, the reading column on project pages), so the pretzel lines up with the text and the links end where the text ends. The 44px sketch pretzel, in ink, sits left and goes home; on the right sits only the theme toggle. Amy removed the Work and About links later on 2026-11-16: the homepage is one page, the bio at the top and the work under it, and the groups under the bio sort the work. Hovering the mark squishes it like soft dough. On a project page a small pill sits beside the pretzel, "Back to" the project's group (its short name from `app/work.ts`), linking to `/#<group>` so the homepage opens that group and scrolls to it. Feedback on 2026-11-18 asked for a visible way back out of a project; the pretzel alone didn't read as one.

**Project bar.** On a project page, once the title has scrolled away, a slim 52px bar slides down from the top: a 28px pretzel home, the group the project sits in as a soft link back to it (opened), a hairline slash, the project's name in ink, and Previous and Next on the right. It is paper, nearly opaque, with a hairline under it, and it steps aside at the top (where the header is) and at the foot (where the bigger Previous and Next are). Group names come from `app/work.ts`, which also feeds the homepage groups, so a project's group is defined in one place.

### Small Pretzels

- **Stray pretzel:** an 18px sketch pretzel, faint and askew, lies at the foot of every page (not the facts page). Only one pretzel is in view at a time: Amy moved this one from the contact links to the footer on 2026-11-16. It leads to the secret facts page, and wiggles when found. Since 2026-11-18 it carries a soft label, "psst, a secret", because feedback said it wasn't clear it was an easter egg; the facts page opens "You found the secret page." Keep the label that short and don't name what's behind it. Do not add it to the nav.

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
- **Don't** open the homepage groups by default or add featured picks above them; Amy wants the page short. (Asked again on 2026-11-22 about a large Studio picture above the groups: no, she doesn't want Studio standing out on top. A row of role and platform facts under a project's title was also tried and removed that day as unnecessary.)
- **Don't** commit the font file.
