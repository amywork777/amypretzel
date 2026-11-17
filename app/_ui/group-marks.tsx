"use client";

import type { ReactNode } from "react";
import { BoilDefs } from "./taste/boil/Boil";

/* One small hand-drawn mark per homepage group, in place of the pile of
   pictures (Amy picked marks over tiles, a spectrum or a tidier strip,
   2026-11-16). Drawn in the taste kit's hand: wobbly 2px lines with a pen's
   overshoot, boiling a few times a second through the kit's SVG filter
   (mounted once, by GroupMarksDefs). The base is HandMark from
   ~/code/taste/kit/marks/hand.tsx; the four drawings are new.
   - Physical products: the long mat with its triangle creases, its end panel folding up
   - AI tools for designers: a pencil drawing a line, with a spark
   - 3D and CAD: a wireframe cube with a dimension line
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
    <Mark label="A folding mat">
      {/* the long mat lying flat, its triangle creases zigzagging along it */}
      <path d="M3.5 34.2c13.6 1.3 27.2 2.6 40.8 3.9 3.2-3.4 6.4-6.8 9.6-10.1-13.4-1.3-26.9-2.6-40.4-3.9-3.3 3.4-6.7 6.7-10 10.1z" />
      <path d="M13.6 24.2l9.6 11.8 10-10.4 10.6 12.3" />
      {/* its end panel folding up off it */}
      <path d="M44.3 38.1c-.6-5.5-1.2-11-1.9-16.5 3.4-3.4 6.7-6.7 10.1-10.1.5 5.5 1 11 1.4 16.5" />
      <path d="M42.5 21.7c3.8 2.1 7.6 4.2 11.4 6.3" />
      {/* folding back over onto the mat */}
      <path d="M49.5 6.3c-3.9-1.8-8-1.2-11.2 1.7" />
      <path d="M37.6 4.6l.6 3.6 3.6-.2" />
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

/** The boil filter the marks use; mount once on the page. */
export function GroupMarksDefs() {
  return <BoilDefs scale={1.6} />;
}
