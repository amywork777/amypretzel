"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import { Sheet, useReveal } from "./studio-parts";
import "./studio.css";

/* The pieces of a design case study page (Studio, Region Maps): a hero still
   set on the media surface, an anatomy of one real screen part by part, and
   a grid of close-ups of the details on it. Each page passes its own pictures
   and words; the look and behaviour live here and in studio.css. */

/** The whole app at work, inset on the media surface like a product shot. */
export function Hero({ src, width, height, alt }: { src: string; width: number; height: number; alt: string }) {
  return (
    <figure className="st st-wide st-hero">
      <div className="st-hero-stage">
        <Image src={src} width={width} height={height} alt={alt} priority sizes="(min-width: 1296px) 1100px, 92vw" />
      </div>
    </figure>
  );
}

/** A part of the screen: its box and dot are percentages of the picture. */
export type AnatomyPart = { title: string; text: string; box: [number, number, number, number]; dot: [number, number] };

/** One real screen, lit part by part: point at a number (or a line of the
    list) and the rest dims, leaving that part lit with why it is that way. */
export function Anatomy({ id, heading, lede, src, ratio, alt, caption, parts }: {
  id: string; heading: string; lede: ReactNode; src: string; ratio: string; alt: string; caption: string; parts: AnatomyPart[];
}) {
  const [hover, setHover] = useState<number | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);
  const on = hover ?? pinned;
  const lit = on === null ? undefined : parts[on - 1];
  const pick = (n: number) => setPinned(p => (p === n ? null : n));
  const [x, y, w, h] = lit?.box ?? [0, 0, 100, 100];
  const hoverOn = (n: number) => (e: { pointerType: string }) => { if (e.pointerType === "mouse") setHover(n); };

  return (
    <section className="st st-wide st-anat" aria-labelledby={`${id}-h`}>
      <header className="st-chapter">
        <h2 id={`${id}-h`} className="st-head">{heading}</h2>
        <p className="st-lede">{lede}</p>
      </header>
      <Sheet title={caption} note={on ? `${on} of ${parts.length}` : "Point at a number"}>
        <div className="st-anat-stage" style={{ aspectRatio: ratio }} data-lit={lit ? "" : undefined}>
          <Image src={src} alt={alt} fill sizes="(min-width: 1296px) 1200px, 100vw" />
          <svg className="st-anat-dim" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <path fillRule="evenodd" d={`M0 0H100V100H0Z M${x} ${y}H${x + w}V${y + h}H${x}Z`} />
            <rect x={x} y={y} width={w} height={h} vectorEffect="non-scaling-stroke" />
          </svg>
          {parts.map((p, i) => (
            <button
              key={p.title} type="button" className="st-anat-dot" style={{ left: `${p.dot[0]}%`, top: `${p.dot[1]}%`, ["--n" as string]: i }}
              aria-pressed={pinned === i + 1} aria-label={`${i + 1}: ${p.title}`} data-on={on === i + 1 || undefined}
              onPointerEnter={hoverOn(i + 1)} onPointerLeave={() => setHover(null)}
              onFocus={() => setHover(i + 1)} onBlur={() => setHover(null)} onClick={() => pick(i + 1)}
            >{i + 1}</button>
          ))}
        </div>
      </Sheet>
      <ol className="st-anat-list" data-lit={lit ? "" : undefined} onPointerLeave={() => setHover(null)}>
        {parts.map((p, i) => (
          <li key={p.title} data-on={on === i + 1 || undefined}>
            <button type="button" className="st-anat-row" aria-pressed={pinned === i + 1} onPointerEnter={hoverOn(i + 1)} onClick={() => pick(i + 1)}>
              <span className="st-anat-n" aria-hidden="true">{i + 1}</span>
              <span className="st-anat-t">{p.title}</span>
              <span className="st-anat-d">{p.text}</span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** A close-up: a crop of the screen and the decision it shows. A crop that
    runs past its frame fades out ("b" at the bottom, "br" bottom and right). */
export type Detail = { src: string; w: number; h: number; title: string; text: string; alt: string; fade?: "b" | "br" };

function DetailFigure({ d, i }: { d: Detail; i: number }) {
  const [ref, seen] = useReveal<HTMLElement>();
  return (
    <figure ref={ref} className="st-rule" data-in={seen || undefined} style={{ ["--i" as string]: i % 2 }}>
      <div className="st-rule-frame">
        <Image data-fade={d.fade} src={d.src} alt={d.alt} width={d.w} height={d.h} sizes="(min-width: 1296px) 500px, (min-width: 640px) 45vw, 90vw" />
      </div>
      <figcaption>
        <span className="st-rule-n" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
        <span className="st-rule-t">{d.title}</span>
        <span className="st-rule-d">{d.text}</span>
      </figcaption>
    </figure>
  );
}

/** Close-ups in identical frames, two to a row, under a chapter title. */
export function Details({ id, heading, lede, details }: { id: string; heading: string; lede: ReactNode; details: Detail[] }) {
  return (
    <section className="st-wide st-rules" aria-labelledby={`${id}-h`}>
      <header className="st-chapter">
        <h2 id={`${id}-h`} className="st-head">{heading}</h2>
        <p className="st-lede">{lede}</p>
      </header>
      <div className="st-rules-grid">
        {details.map((d, i) => <DetailFigure key={d.src} d={d} i={i} />)}
      </div>
    </section>
  );
}
