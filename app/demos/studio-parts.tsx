"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/* Shared pieces of the Studio page: a quiet rounded frame with one caption
   line, a wipe that compares two pictures of the same thing, and a hook that
   lets a frame rise in once as it scrolls into view. Ink and hairlines only:
   the pictures of Studio are the only things with colour in them. */

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

/** A quiet frame for a picture of Studio: the stage on the media surface,
    rounded, with one caption line under it (the title in ink, a note in soft
    ink on the right). It rises in once as it scrolls into view. */
export function Sheet({ title, note, children, className }: { title: string; note?: ReactNode; children: ReactNode; className?: string }) {
  const [ref, seen] = useReveal<HTMLElement>();
  return (
    <figure ref={ref} className={`st-sheet${className ? ` ${className}` : ""}`} data-in={seen || undefined}>
      <div className="st-sheet-stage">{children}</div>
      <figcaption className="st-cap">
        <span className="st-cap-t">{title}</span>
        {note && <span className="st-cap-n">{note}</span>}
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
        const k = Math.max(0, Math.min((t - t0) / leg, keys.length - 1));
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
