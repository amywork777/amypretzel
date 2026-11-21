"use client";

import type { ReactNode } from "react";
import { BoilDefs } from "./taste/boil/Boil";

/* One small hand-drawn mark per homepage group, in place of the pile of
   pictures (Amy picked marks over tiles, a spectrum or a tidier strip,
   2026-11-16). Drawn in the taste kit's hand: wobbly 2px lines with a pen's
   overshoot, boiling a few times a second through the kit's SVG filter
   (mounted once in the root layout, by SketchDefs). The base is HandMark from
   ~/code/taste/kit/marks/hand.tsx; the four drawings are new.
   - Physical products: an iPad folio and an iPhone case as a part drawing,
     with a centreline and a height dimension (Amy: "more hardware engineer-y")
   - AI tools for designers: a pencil drawing a line, with a spark
   - CAD software: a wireframe cube with a dimension line
   - Tools and toys: a little ghost, after Cute Ghostty */

function Mark({ children, label }: { children: ReactNode; label: string }) {
  return (
    <svg className="ui-group-mark" viewBox="0 0 64 48" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" data-label={label} style={{ filter: "url(#taste-boil)" }}>
      {children}
    </svg>
  );
}

const marks: Record<string, () => ReactNode> = {
  products: () => (
    <Mark label="An iPad folio and an iPhone case, drawn like a part drawing">
      {/* the iPad folio behind, its cover's hinge line */}
      <path d="M8.6 5.5h21.6c1.7 0 2.9 1.2 2.9 2.9v27.4c0 1.7-1.2 2.9-2.9 2.9H8.6c-1.6 0-2.9-1.2-2.9-2.9V8.4c0-1.7 1.3-2.9 2.9-2.9z" />
      <path d="M11.4 5.8v32.6" />
      {/* the iPhone case in front (filled with the page so the folio hides behind it) */}
      <path d="M30.6 12.2h12.8c2.2 0 3.8 1.7 3.8 3.9v24.3c0 2.2-1.6 3.9-3.8 3.9H30.6c-2.2 0-3.9-1.7-3.9-3.9V16.1c0-2.2 1.7-3.9 3.9-3.9z" style={{ fill: "var(--color-paper)" }} />
      {/* its camera cut-out, two lenses, the side button */}
      <path d="M31.2 15.2h5.4c.9 0 1.5.6 1.5 1.5v5.3c0 .9-.6 1.5-1.5 1.5h-5.4c-.8 0-1.5-.6-1.5-1.5v-5.3c0-.9.7-1.5 1.5-1.5z" />
      <path d="M32.6 17.6v.1M35.3 20.3v.1" strokeWidth={2.6} />
      <path d="M48.4 19.5v4.8" />
      {/* drafting: a centreline, and the case's height dimensioned */}
      <path d="M23.6 28.2h26.4" strokeWidth={1.2} strokeDasharray="4 1.6 1 1.6" />
      <path d="M49.6 12.2h5.6M49.6 44.3h5.6" strokeWidth={1.4} />
      <path d="M53.2 13.6v29.3" strokeWidth={1.4} />
      <path d="M51.6 16.2l1.6-2.6 1.6 2.6M51.6 40.3l1.6 2.6 1.6-2.6" strokeWidth={1.4} />
    </Mark>
  ),
  "ai-tools": () => (
    <Mark label="A pencil drawing, with a spark">
      {/* the pencil */}
      <path d="M40.5 7.5l7.7 7.6-21.6 21.7-7.8-7.7 21.7-21.6z" />
      <path d="M18.8 29.1l-4.1 11.9 11.9-4.2" />
      <path d="M36.6 11.4l7.7 7.7" />
      {/* the line it just drew */}
      <path d="M5 44.5c4.2-2.7 7.4-.6 10.6-2.2" />
      {/* the spark */}
      <path d="M53.5 27.5c.4 3.4 1.5 4.6 5 5-3.5.4-4.6 1.6-5 5-.4-3.4-1.5-4.6-5-5 3.5-.4 4.6-1.6 5-5z" />
    </Mark>
  ),
  cad: () => (
    <Mark label="A wireframe cube with a dimension line">
      <path d="M28 6.5l17 9.3-17 9.6-17.2-9.5L28 6.5z" />
      <path d="M10.8 16v18.3L28 44V25.4" />
      <path d="M45 15.8v18.5L28 44" />
      {/* dimension line with its ticks */}
      <path d="M53 16.5v17.6" />
      <path d="M50.4 16.4h5.3M50.4 34.2h5.3" />
    </Mark>
  ),
  tools: () => (
    <Mark label="A little ghost">
      <path d="M19 41.5V23.2c0-9.4 5.9-15.8 13.2-15.8 7.4 0 13.4 6.4 13.4 15.8v18.3l-4.4-3.6-4.5 3.7-4.4-3.7-4.4 3.7-4.5-3.7-4.4 3.6z" />
      <path d="M27.4 21.6v2.4M37.2 21.6v2.4" />
      <path d="M29.8 28.4c1.5 1.3 3.4 1.3 4.9 0" />
      {/* it waves */}
      <path d="M46 26.5c3.4-.4 5.9-2.2 7.6-5.1" />
    </Mark>
  ),
};

export function GroupMark({ id }: { id: string }) {
  const draw = marks[id];
  return draw ? <span className="ui-group-markwrap">{draw()}</span> : null;
}

/** The boil filter every sketch mark uses (these and the pretzel); mounted once, in the root layout. */
export function SketchDefs() {
  return <BoilDefs scale={1.6} />;
}
