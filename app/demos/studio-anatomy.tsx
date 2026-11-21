"use client";

import Image from "next/image";
import { useState } from "react";
import { Sheet } from "./studio-parts";
import "./studio.css";

/* Studio, under its build film: the whole window as a designer would show
   it, part by part. Point at a number (or a line of the list) and the rest of
   the screen dims, leaving that part lit with why it is the way it is.

   anatomy.webp is one real moment from an isolated Studio on 2026-11-21: its
   motor mount plate example right after the chat asked for longer belt slots.
   Regions are percentages of that picture. */

type Part = { n: number; title: string; text: string; box: [number, number, number, number]; dot: [number, number] };

const PARTS: Part[] = [
  {
    n: 1, title: "The chat sits beside the part",
    text: "The agent works in a column next to the model, never over it, so you watch the part change while you talk. Each answer ends with what changed and what is now out of date.",
    box: [0, 5.2, 18.75, 94.8], dot: [9.4, 21],
  },
  {
    n: 2, title: "Files open as tabs",
    text: "Parts, the assembly and the requirements open side by side as tabs, with the project's overview always first, the way a CAD session holds several documents.",
    box: [19.2, 0, 39, 5.2], dot: [44, 2.6],
  },
  {
    n: 3, title: "A ribbon engineers already know",
    text: "Features, Sketch, Evaluate and Drawing, with commands named the way SolidWorks names them. When it's quicker to change something by hand, the tool is where you'd look.",
    box: [18.8, 5.2, 81.2, 11.6], dot: [64, 11],
  },
  {
    n: 4, title: "Every step is a feature",
    text: "What the AI built isn't a mesh, it's a history: an extrude, four cuts, a chamfer. Each one opens and changes like any other feature.",
    box: [18.8, 16.8, 16, 36.4], dot: [31, 27],
  },
  {
    n: 5, title: "Tolerances live on the model",
    text: "Datums, toleranced sizes and notes sit on the part itself, so the requirements travel with the geometry into the STEP file.",
    box: [18.8, 53.2, 16, 46.8], dot: [31, 72],
  },
  {
    n: 6, title: "Nothing floats over the part",
    text: "The model is always the latest build. A view cube in the corner and one short toolbar are all that sit on top of it.",
    box: [34.8, 16.8, 65.2, 83.2], dot: [86, 34],
  },
];

export default function StudioAnatomy() {
  const [hover, setHover] = useState<number | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);
  const on = hover ?? pinned;
  const lit = PARTS.find(p => p.n === on);
  const pick = (n: number) => setPinned(p => (p === n ? null : n));
  const [x, y, w, h] = lit?.box ?? [0, 0, 100, 100];

  return (
    <section className="st st-wide st-anat" aria-labelledby="st-anat-h">
      <header className="st-chapter">
        <h2 id="st-anat-h" className="st-head">The screen, part by part</h2>
        <p className="st-lede">A chat and a full CAD workspace in one window. Point at a number to see why each part sits where it does.</p>
      </header>
      <Sheet title="Studio, right after the chat asked for longer belt slots" note={lit ? `${lit.n} of ${PARTS.length}` : "Point at a number"}>
        <div className="st-anat-stage" data-lit={lit ? "" : undefined}>
          <Image src="/software/studio/anatomy.webp" alt="Studio's whole window: the chat on the left, file tabs and the CAD ribbon along the top, the feature tree and tolerances down the side, and the motor mount plate in the middle." fill sizes="(min-width: 1296px) 1200px, 100vw" priority />
          <svg className="st-anat-dim" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <path fillRule="evenodd" d={`M0 0H100V100H0Z M${x} ${y}H${x + w}V${y + h}H${x}Z`} />
            <rect x={x} y={y} width={w} height={h} vectorEffect="non-scaling-stroke" />
          </svg>
          {PARTS.map(p => (
            <button
              key={p.n} type="button" className="st-anat-dot" style={{ left: `${p.dot[0]}%`, top: `${p.dot[1]}%`, ["--n" as string]: p.n - 1 }}
              aria-pressed={pinned === p.n} aria-label={`${p.n}: ${p.title}`} data-on={on === p.n || undefined}
              onPointerEnter={e => { if (e.pointerType === "mouse") setHover(p.n); }} onPointerLeave={() => setHover(null)}
              onFocus={() => setHover(p.n)} onBlur={() => setHover(null)} onClick={() => pick(p.n)}
            >{p.n}</button>
          ))}
        </div>
      </Sheet>
      <ol className="st-anat-list" data-lit={lit ? "" : undefined} onPointerLeave={() => setHover(null)}>
        {PARTS.map(p => (
          <li key={p.n} data-on={on === p.n || undefined}>
            <button type="button" className="st-anat-row" aria-pressed={pinned === p.n}
              onPointerEnter={e => { if (e.pointerType === "mouse") setHover(p.n); }} onClick={() => pick(p.n)}>
              <span className="st-anat-n" aria-hidden="true">{p.n}</span>
              <span className="st-anat-t">{p.title}</span>
              <span className="st-anat-d">{p.text}</span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
