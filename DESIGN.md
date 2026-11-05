---
name: amypretzel
description: Amy Zhou's site. A cleared table with her work on it, and six pretzels you can pick up.
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
  chapter:
    fontFamily: "Areal, Areal Fallback, Arial, Helvetica, sans-serif"
    fontSize: "clamp(40px, 4.6vw, 68px)"
    fontWeight: 400
    lineHeight: 1.02
    letterSpacing: "-.045em"
rounded:
  sm: "6px"
  card: "20px"
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
  chapter-card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "28px 40px 24px"
---

# Design System: amypretzel

The source of truth is `app/globals.css` (tokens and `ui-*` classes) and `app/_ui/` (the React side). If this file and the code disagree, the code shipped, so fix this file.

## Overview

**Creative North Star: "The Cleared Table"**

Everything has been moved off the table except the work and the pretzels. The site is one sans, one ink, one line weight and two corner shapes, set compact and aligned. Nothing on the page competes with the objects, because the objects are the only things with colour in them.

All the warmth is spent in one place. On a first desktop visit the page opens onto a black table with six pretzels in a row, each one a chapter of Amy's life, each its own shape and coating. Pick one up and a white card slides in beside it. Close the table and the site beneath it is almost severe by comparison, with a small baked pretzel for a logo. That contrast is the design: exact everywhere, with a few things that are soft enough to squeeze.

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

The book overlay and the chapter card each re-declare these same token names locally rather than using their own classes. The overlay is always dark (with stronger rules and softer ink than the page's dark mode, so it reads over the 3D scene), the card always light, so shared components render correctly on either without variants.

### Pretzel colours

Colour exists on the site in the 3D recipes in `app/book/pretzel-geometry.ts`: chocolate, ube, matcha and pale icing coatings, pink and cream drizzles, and an eight-colour sprinkle mix. These are materials, not tokens. They never become interface colours.

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
- **Title** (`title`): item names under tiles and in rows, prose subheads. The one place weight 500 appears.
- **Body** (`body`, 18px from 768px up and 16px below): prose in soft ink, kept to a measure of 30 to 40em.
- **Label** (`label`): nav, captions, metadata, section headings, every control.
- **Chapter** (`chapter`): the title on the chapter card, and nowhere else. The only large type on the site, because it sits beside a pretzel held up to the camera.

### Named Rules

**The Two Weights Rule.** 400 and 500 only. Nothing is bold.

**The Sentence Case Rule.** Interface labels and titles are sentence case. The story and sign-off are lower case, in Amy's own voice. Nothing is all caps.

## Layout

One centred column, at most 1120px wide for indexes and 860px for reading, with a 20px gutter that becomes 48px from 768px. Vertical rhythm comes from the nine-step spacing scale, and spacing stays tight on purpose.

- **Objects** are an image grid: two columns on phones, three from 1024px, with every frame the same 4:3 box. The grid is never staggered.
- **Software** is compact text rows grouped under a label in a 130px left margin, with no images. Rows stack at 640px and below.
- **Detail pages** lead with one 16:9 framed shot, the same box as its tile, then a 40em text column and a stack of media.
- **Facts** put the title in a 180px margin with prose beside it.
- **The homepage** leads with the statement, then the portrait, bio and contact links.

Phones start on the normal website. The pretzel table opens by itself only on a first desktop visit (701px and up); after that it opens from the Pretzels link or `/#book`.

## Elevation & Depth

The website is flat. Depth comes from hairlines and the surface tone, and there is no box shadow anywhere on a page. Real depth is reserved for real objects.

### Shadow Vocabulary

- **Baked mark** (`filter: drop-shadow(0 2px 3px rgba(0, 0, 0, .18))`): grounds the logo pretzel. The secret pretzel has a smaller version.
- **Chapter card** (`box-shadow: 0 20px 80px rgba(0, 0, 0, .45)`): the only box shadow, on the card over the black table.

Pretzel shadows in the 3D scene are contact shadows, rendered rather than faked in CSS. Frosted glass (a 6px backdrop blur) appears only where a control floats over something else: the pill button and the pretzel hover label.

### Named Rules

**The Objects Get The Depth Rule.** If it is interface, it is flat. If it casts a shadow, it had better be something you could pick up.

## Shapes

Two corner families. Containers use the 6px radius: media frames, portraits, figure panels, outline buttons, and previous/next links. Anything you click to go somewhere is a full pill. The chapter card takes a 20px radius, flattened along the bottom edge on phones where it becomes a sheet.

The one drawn silhouette is the pretzel. It is rendered from the same geometry as the 3D scene by `scripts/render-logo.mjs`, never redrawn by hand or as an icon.

## Components

### Links

Plain, and a little insistent. **Every link is a pill**, sized in `em` so it can sit inside a sentence, with a 1px rule border that fills with ink on hover. Standalone links use the full-size pill button. External links open in a new tab. The exceptions are structural: the header nav, tiles, rows, and previous/next.

### Buttons

- **Pill:** the primary shape, 38px minimum height with a half-transparent paper fill and backdrop blur, so it holds up over the 3D scene. Inverts to ink on hover.
- **Outline:** a 6px box for panel actions. Hover and pressed fill with surface.
- **Icon button:** a bare 16px icon in muted ink that goes to ink on hover. The theme toggle is the only one that matters.
- **Focus:** a 1px outline in the current colour, offset 4px, on every interactive element.

### Tiles and Rows

Both share one caption: a title with a single line of soft description.

- **Tile:** a framed image, then the caption. On hover the image grows 2.5% and the title softens.
- **Row:** text only, on a bottom hairline. On hover the title softens.

### Section Heading

A label-size title sitting under a hairline, above a group of items. It is the site's only section marker. There are no eyebrows, numbers or dividers.

### Navigation

The 44px pretzel mark sits left; label-size links sit right in soft ink, with the theme toggle. The current page is ink with a thin underline offset 5px. Hovering the mark squishes it like soft dough.

### Pretzel Table

The signature, built in WebGL under `app/book/`. The code still says "book" because that is what this scene used to be. Six pretzels rest on black in a row, and each has its own recipe, so they differ in shape as well as topping.

- **Rest:** hovering lifts a pretzel and shows its name in a dark pill below it. The camera drifts slightly with the pointer on devices that have one.
- **Held:** a selected pretzel rises and centres in the space left by the card, swaying gently.
- **Chapter card:** slides in from the right over .6s on `cubic-bezier(.2, .8, .2, 1)`, 560px wide or 46vw at most. On phones (700px and below) it becomes a bottom sheet at 52vh.
- **Exit:** a pill reading "Go to the website" sits top right, and steps aside while the card is open.
- **Loading:** a captured still of the real scene paints first and fades after the first rendered frame. The scene only draws while something is moving.
- **Accessibility:** a focus-trapped dialog, closed with Escape, with a keyboard-only way in.

### Small Pretzels

- **Stray pretzel:** a pink, sprinkled 30px pretzel lies askew by the contact links, leads to the secret facts page, and wiggles when found. Keep it unlabelled. Do not add it to the nav.

## Do's and Don'ts

### Do:

- **Do** build from the `ui-*` classes and `app/_ui/` components, and extend the tokens before adding a one-off value.
- **Do** use word labels for navigation. "Previous" and "Next", not arrows.
- **Do** keep every frame in a grid the same size.
- **Do** keep all line work at 1px, including new borders and SVG strokes.
- **Do** make anything animated respect `prefers-reduced-motion`. The global rule covers CSS; the 3D scene checks it directly.
- **Do** re-capture the poster images after changing the scene, so the loading still matches what appears.
- **Do** check phones as a first-class layout, not a shrunken desktop.

### Don't:

- **Don't** add an accent colour to the interface.
- **Don't** use a staggered or masonry image grid.
- **Don't** set oversized display type or a serif. The chapter title is the only large type.
- **Don't** add shadows, gradients, or cards to the website.
- **Don't** add a second signature moment. The pretzels hold the whole motion budget.
- **Don't** use `/fishing` styles on other pages, or load its pixel font outside that route.
- **Don't** put product photos or images on the software list.
- **Don't** commit the font file.
