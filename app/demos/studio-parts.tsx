"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/* Shared pieces of the Studio page: a frame drawn like an engineering drawing
   sheet (zone numbers and letters on the border, a title block under it), a
   wipe that compares two pictures of the same thing, and a hook that lets a
   frame rise in once as it scrolls into view. All ink, all 1px, no colour:
   the drawing look comes from line work and labels, the way the homepage's
   part-drawing mark does. */

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Marks an element once it has scrolled into view (data-in), so CSS can
    rise it in. With reduced motion it is in from the start. */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }, { threshold: 0.18 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, seen] as const;
}

/** A frame with a drawing border: zone numbers along the top, letters down
    the side, and a title block (figure number, title, a note) under it. */
export function Sheet({ fig, title, note, children, className }: { fig: string; title: string; note?: ReactNode; children: ReactNode; className?: string }) {
  const [ref, seen] = useReveal<HTMLElement>();
  return (
    <figure ref={ref} className={`st-sheet${className ? ` ${className}` : ""}`} data-in={seen || undefined}>
      <div className="st-zones st-zones--x" aria-hidden="true">{[1, 2, 3, 4, 5, 6].map(n => <span key={n}>{n}</span>)}</div>
      <div className="st-sheet-body">
        <div className="st-zones st-zones--y" aria-hidden="true">{["A", "B", "C", "D"].map(n => <span key={n}>{n}</span>)}</div>
        <div className="st-sheet-stage">{children}</div>
      </div>
      <figcaption className="st-block">
        <span className="st-block-cell st-block-fig"><span className="st-block-key">Fig.</span>{fig}</span>
        <span className="st-block-cell st-block-title"><span className="st-block-key">Title</span>{title}</span>
        {note && <span className="st-block-cell st-block-note"><span className="st-block-key">Note</span>{note}</span>}
      </figcaption>
    </figure>
  );
}

/** Two pictures of the same thing, one over the other, with a handle to wipe
    between them. A range input under the handle does the work, so arrow keys
    and screen readers get it for free. When it first comes into view the
    handle sweeps across once to show it moves, unless the visitor has already
    touched it or asked for less motion. */
export function Wipe({ before, after, beforeLabel, afterLabel, ratio, label, sweep = true }: {
  before: ReactNode; after: ReactNode; beforeLabel: string; afterLabel: string; ratio: string; label: string; sweep?: boolean;
}) {
  const [pos, setPos] = useState(50);
  const touched = useRef(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = box.current;
    if (!el || !sweep || reducedMotion()) return;
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || touched.current) return;
      io.disconnect();
      // 50 -> 18 -> 82 -> 50, eased, about two seconds.
      const keys = [50, 18, 82, 50];
      const t0 = performance.now(), leg = 650;
      const tick = (t: number) => {
        if (touched.current) return;
        const k = Math.min((t - t0) / leg, keys.length - 1);
        const i = Math.min(Math.floor(k), keys.length - 2), f = k - i;
        const ease = f < .5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
        setPos(keys[i] + (keys[i + 1] - keys[i]) * ease);
        if (k < keys.length - 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.6 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [sweep]);
  return (
    <div ref={box} className="st-wipe" style={{ aspectRatio: ratio, ["--pos" as string]: `${pos}%` }}>
      <div className="st-wipe-layer">{after}</div>
      <div className="st-wipe-layer st-wipe-top">{before}</div>
      <span className="st-wipe-tag st-wipe-tag--l" data-dim={pos < 22 || undefined}>{beforeLabel}</span>
      <span className="st-wipe-tag st-wipe-tag--r" data-dim={pos > 78 || undefined}>{afterLabel}</span>
      <span className="st-wipe-line" aria-hidden="true"><span className="st-wipe-knob">Drag</span></span>
      <input
        className="st-wipe-input" type="range" min={0} max={100} step={0.5} value={pos} aria-label={label}
        aria-valuetext={`${Math.round(pos)}% ${beforeLabel.toLowerCase()}`}
        onPointerDown={() => { touched.current = true; }} onKeyDown={() => { touched.current = true; }}
        onChange={e => { touched.current = true; setPos(Number(e.target.value)); }}
      />
    </div>
  );
}
