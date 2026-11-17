"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "./smart-dropper.css";

/* Smart Dropper, to try: the gesture of the real tool with its real results.
   Click the reference to pick up its look, click your image to put it down,
   and the result wipes in over yours, then a line to drag compares the two.

   Nothing is generated here. Every picture is a frame of Amy's screen
   recording of the tool in Vizcom (the launch video's source), cropped out of
   the canvas: the reference, the target before, and what the tool returned.
   There is one recorded example for each thing the dropper can pick up
   (style, colour, environment), which is also its menu in the app. */

type Pic = { src: string; w: number; h: number; alt: string };
type Look = {
  id: "style" | "colour" | "environment";
  label: string;
  noun: string;
  reference: Pic;
  before: Pic;
  after: Pic;
};

const DIR = "/demos/smart-dropper";

const LOOKS: Look[] = [
  {
    id: "style",
    label: "Style",
    noun: "style",
    reference: { src: `${DIR}/style-reference.webp`, w: 420, h: 364, alt: "Reference: a yellow concept car parked by a concrete wall" },
    before: { src: `${DIR}/style-before.webp`, w: 680, h: 392, alt: "Your image: a grey SUV on a plain set under a blue sky" },
    after: { src: `${DIR}/style-after.webp`, w: 680, h: 392, alt: "The same SUV, now in the reference's yellow finish, by the concrete wall" },
  },
  {
    id: "colour",
    label: "Colour",
    noun: "colours",
    reference: { src: `${DIR}/color-reference.webp`, w: 314, h: 409, alt: "Reference: a green glass blob" },
    before: { src: `${DIR}/color-before.webp`, w: 480, h: 436, alt: "Your image: a sneaker in pink, white and black" },
    after: { src: `${DIR}/color-after.webp`, w: 480, h: 436, alt: "The same sneaker in mint and teal, from the blob's colours" },
  },
  {
    id: "environment",
    label: "Environment",
    noun: "environment",
    reference: { src: `${DIR}/environment-reference.webp`, w: 360, h: 451, alt: "Reference: someone carrying a bike through a river at night" },
    before: { src: `${DIR}/environment-before.webp`, w: 592, h: 786, alt: "Your image: a runner photographed on white" },
    after: { src: `${DIR}/environment-after.webp`, w: 592, h: 786, alt: "The same runner, now splashing through the river at night" },
  },
];

type Phase = "empty" | "holding" | "applying" | "done";

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export default function SmartDropper() {
  const [lookId, setLookId] = useState<Look["id"]>("style");
  const [phase, setPhase] = useState<Phase>("empty");
  // How much of the picture, from the left, shows the result.
  const [split, setSplit] = useState(0);
  const [nudge, setNudge] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const dropRef = useRef<HTMLSpanElement>(null);
  const compareRef = useRef<HTMLDivElement>(null);
  const tween = useRef(0);
  const keyboard = useRef(false);
  const look = LOOKS.find(l => l.id === lookId)!;

  const stop = () => cancelAnimationFrame(tween.current);
  useEffect(() => {
    const t = tween;
    return () => cancelAnimationFrame(t.current);
  }, []);

  // Fetch the result as soon as there's a reference in hand, so it's ready to wipe in.
  useEffect(() => {
    if (phase !== "holding") return;
    const img = new window.Image();
    img.src = look.after.src;
  }, [phase, look]);

  // Once the result is in, the compare line takes over from the picture, so
  // keep the keyboard on it.
  useEffect(() => {
    if (phase === "done" && keyboard.current) compareRef.current?.focus();
  }, [phase]);

  const animate = (from: number, to: number, ms: number, done?: () => void) => {
    stop();
    let start = -1;
    const step = (now: number) => {
      if (start < 0) start = now;
      const t = Math.min(1, (now - start) / ms);
      setSplit(from + (to - from) * ease(t));
      if (t < 1) tween.current = requestAnimationFrame(step);
      else done?.();
    };
    tween.current = requestAnimationFrame(step);
  };

  const choose = (id: Look["id"]) => {
    stop();
    setLookId(id);
    setPhase("empty");
    setSplit(0);
    setNudge(false);
  };

  const pickUp = () => {
    if (phase === "applying") return;
    stop();
    setSplit(0);
    setNudge(false);
    // Clicking the reference again puts it back down.
    setPhase(phase === "holding" ? "empty" : "holding");
  };

  const apply = async (viaKeyboard: boolean) => {
    if (phase !== "holding") {
      setNudge(true);
      return;
    }
    keyboard.current = viaKeyboard;
    setPhase("applying");
    const img = new window.Image();
    img.src = look.after.src;
    await img.decode().catch(() => undefined);
    if (reduced()) {
      setSplit(50);
      setPhase("done");
      return;
    }
    // Wipe the whole result in, let it sit, then settle at the middle to compare.
    animate(0, 100, 900, () => {
      window.setTimeout(() => {
        setPhase("done");
        animate(100, 50, 600);
      }, 500);
    });
  };

  const reset = () => {
    stop();
    setPhase("empty");
    setSplit(0);
    setNudge(false);
  };

  // Dragging the compare line, anywhere across the picture.
  const dragging = useRef(false);
  const splitAt = useCallback((clientX: number) => {
    const r = compareRef.current?.getBoundingClientRect();
    if (!r) return;
    setSplit(Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100)));
  }, []);

  const onKey = (e: React.KeyboardEvent) => {
    const by = e.shiftKey ? 20 : 5;
    const next = { ArrowLeft: split - by, ArrowDown: split - by, ArrowRight: split + by, ArrowUp: split + by, Home: 0, End: 100, PageDown: split - 20, PageUp: split + 20 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    stop();
    setSplit(Math.max(0, Math.min(100, Math.round(next))));
  };

  // The drop of reference that follows the pointer while it's held.
  const moveDrop = (e: React.PointerEvent) => {
    const drop = dropRef.current, stage = stageRef.current;
    if (!drop || !stage || e.pointerType !== "mouse") return;
    const r = stage.getBoundingClientRect();
    drop.style.transform = `translate(${e.clientX - r.left + 10}px, ${e.clientY - r.top + 10}px)`;
    drop.dataset.show = "";
  };
  const hideDrop = () => { if (dropRef.current) delete dropRef.current.dataset.show; };
  useEffect(() => {
    if (phase !== "holding" && dropRef.current) delete dropRef.current.dataset.show;
  }, [phase]);

  const hint = {
    empty: nudge ? `Pick up a look first: click the reference.` : `Click the reference to pick up its ${look.noun}.`,
    holding: `Holding its ${look.noun}. Now click your image.`,
    applying: `Applying the ${look.noun}…`,
    done: "Drag the line to compare.",
  }[phase];

  const showAfter = phase === "applying" || phase === "done";
  const rounded = Math.round(split);

  return (
    <figure className="ui-try">
      <div
        ref={stageRef}
        className="ui-media ui-try-stage sd-stage"
        data-holding={phase === "holding" || undefined}
        onPointerMove={phase === "holding" ? moveDrop : undefined}
        onPointerLeave={hideDrop}
        onKeyDown={e => { if (e.key === "Escape" && phase === "holding") setPhase("empty"); }}
      >
        <div className="sd-fit">
          <div className="sd-item">
            <div className="sd-box" style={{ "--ar": look.reference.w / look.reference.h } as React.CSSProperties} data-ring={phase === "holding" || undefined}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={look.reference.src} alt={look.reference.alt} width={look.reference.w} height={look.reference.h} draggable={false} />
              <button
                type="button"
                className="sd-hit"
                aria-pressed={phase === "holding"}
                aria-label={phase === "holding" ? `Put the reference's ${look.noun} back` : `Pick up the reference's ${look.noun}`}
                onClick={pickUp}
                disabled={phase === "applying"}
              />
            </div>
            <span className="sd-label" aria-hidden="true">Reference</span>
          </div>
        </div>
        <div className="sd-fit">
          <div className="sd-item">
            <div className="sd-box" style={{ "--ar": look.before.w / look.before.h } as React.CSSProperties} data-ring={phase === "applying" || undefined}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={look.before.src} alt={look.before.alt} width={look.before.w} height={look.before.h} draggable={false} />
              {showAfter && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className="sd-after"
                  src={look.after.src}
                  alt={look.after.alt}
                  width={look.after.w}
                  height={look.after.h}
                  draggable={false}
                  style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
                />
              )}
              {phase === "done" ? (
                <div
                  ref={compareRef}
                  className="sd-compare"
                  role="slider"
                  tabIndex={0}
                  aria-label="Compare the result with your image"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={rounded}
                  aria-valuetext={`${rounded}% result`}
                  onKeyDown={onKey}
                  onPointerDown={e => { stop(); dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); splitAt(e.clientX); }}
                  onPointerMove={e => { if (dragging.current) splitAt(e.clientX); }}
                  onPointerUp={() => { dragging.current = false; }}
                  onPointerCancel={() => { dragging.current = false; }}
                >
                  <span className="sd-tag" data-side="after" style={{ opacity: split > 22 ? 1 : 0 }}>Result</span>
                  <span className="sd-tag" data-side="before" style={{ opacity: split < 78 ? 1 : 0 }}>Yours</span>
                  <span className="sd-line" style={{ left: `${split}%` }}><span className="sd-knob" /></span>
                </div>
              ) : (
                <button
                  type="button"
                  className="sd-hit"
                  aria-label={phase === "holding" ? `Apply the ${look.noun} to your image` : "Your image"}
                  aria-disabled={phase !== "holding"}
                  onClick={e => apply(e.detail === 0)}
                />
              )}
            </div>
            <span className="sd-label" aria-hidden="true">Your image</span>
          </div>
        </div>
        <span ref={dropRef} className="sd-drop" aria-hidden="true" style={{ backgroundImage: `url(${look.reference.src})` }} />
      </div>
      <div className="ui-try-controls">
        <div className="ui-try-row" role="group" aria-label="What to pick up">
          {LOOKS.map(l => (
            <button key={l.id} type="button" className="ui-try-pill" aria-pressed={l.id === lookId} onClick={() => choose(l.id)}>
              {l.label}
            </button>
          ))}
        </div>
        <div className="ui-try-row">
          <span className="sd-hint" aria-live="polite">{hint}</span>
          <button type="button" className="ui-try-reset sd-reset" onClick={reset} disabled={phase === "empty"}>Reset</button>
        </div>
      </div>
      <figcaption className="ui-try-caption">
        Try it: click the reference, then your image. The results are real, recorded from the tool; only the gesture is live here.
      </figcaption>
    </figure>
  );
}
