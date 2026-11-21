"use client";

import Image from "next/image";
import { useReveal } from "./studio-parts";

/* After the Studio page's text: the rules Studio's interface is held to
   (its design laws, in the repo's AGENTS.md), each beside the detail on
   screen that shows it. Every crop is from the same isolated Studio run as
   the anatomy (2026-11-21), cut at full resolution so the type stays sharp.
   Frames are all one size, the crop melted onto the media surface. */

type Rule = { src: string; w: number; h: number; title: string; text: string; alt: string; fade?: "b" | "br" };

const RULES: Rule[] = [
  {
    src: "ui-ribbon", w: 928, h: 698, fade: "br", title: "Where an engineer already looks",
    text: "The ribbon and the FeatureManager follow SolidWorks: the same words in the same places. The AI is new; the screen shouldn't be.",
    alt: "Studio's Features ribbon (Sketch, Extruded Boss/Base, Extruded Cut) above a FeatureManager tree",
  },
  {
    src: "ui-chips", w: 600, h: 448, title: "The next job, one tap away",
    text: "Under the chat sit the jobs a part like this needs next. A tap writes the whole prompt out first, so you read it, and can change it, before it runs.",
    alt: "Four buttons over the chat box: Check for CNC machining, Strength under load, Engineering drawing, G-code for CNC",
  },
  {
    src: "ui-states", w: 810, h: 283, title: "Colour only means status",
    text: "Green passed, amber is a warning, red failed, and nothing else gets those colours. When a part changes after a check, its pass turns amber rather than staying green.",
    alt: "Checks pass on Motor plate, in green; below it, Motor plate changed since its last check, in amber",
  },
  {
    src: "ui-versions", w: 928, h: 696, fade: "b", title: "Engineering words, never git's",
    text: "Underneath, every change is a git commit. On screen it's a Version, compared by what moved on the part, not by lines of code.",
    alt: "Studio's Versions list, Version 1 and Version 2, and What changed with the removed slot material marked on the plate",
  },
  {
    src: "ui-decisions", w: 880, h: 656, fade: "b", title: "Assumptions get written down",
    text: "The agent builds first, then asks specific questions. Every decision is logged in plain words and marked when it was asked, so the rest are easy to find and question.",
    alt: "A list of the project's decisions in plain words, the first marked Oct 26, asked",
  },
  {
    src: "ui-unchecked", w: 880, h: 656, fade: "b", title: "It says what it didn't check",
    text: "No made-up numbers: each figure comes from a real run, and anything still resting on a guess becomes an open action before the part is cut.",
    alt: "Open actions, 7: measure the bought motor's pilot before the plate is cut, check every PMI value with the shop, prove the CAM program on the machine",
  },
];

function Detail({ r, i }: { r: Rule; i: number }) {
  const [ref, seen] = useReveal<HTMLElement>();
  return (
    <figure ref={ref} className="st-rule" data-in={seen || undefined} style={{ ["--i" as string]: i % 2 }}>
      <div className="st-rule-frame">
        <Image data-fade={r.fade} src={`/software/studio/${r.src}.webp`} alt={r.alt} width={r.w} height={r.h} sizes="(min-width: 1296px) 500px, (min-width: 640px) 45vw, 90vw" />
      </div>
      <figcaption>
        <span className="st-rule-n" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
        <span className="st-rule-t">{r.title}</span>
        <span className="st-rule-d">{r.text}</span>
      </figcaption>
    </figure>
  );
}

export default function StudioPrinciples() {
  return (
    <section className="st-wide st-rules" aria-labelledby="st-rules-h">
      <header className="st-chapter">
        <h2 id="st-rules-h" className="st-head">The rules it&apos;s designed by</h2>
        <p className="st-lede">I wrote Studio&apos;s design rules down as laws, and every change is held to them. Six of them, up close, where they show on screen.</p>
      </header>
      <div className="st-rules-grid">
        {RULES.map((r, i) => <Detail key={r.src} r={r} i={i} />)}
      </div>
    </section>
  );
}
