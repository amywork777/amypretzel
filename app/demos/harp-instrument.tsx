"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "./harp-instrument.css";

/* A small version of the harp to play: the lyre drawn on its side in 1px
   line work, tuning pins on the left and the round end on the right, as in
   the photos. Drag or tap across the strings, or use the keys, and each one
   wiggles and sounds.

   What is real and what is modelled:
   - 17 strings, counted from the tuning pins in the photos. The tuning
     (C major, C4 to E6) is assumed; the page doesn't say.
   - The outline, the pins and the anchor holes are traced from the photos,
     so the string lengths are this drawing's, not measured off the harp.
   - Tension per string is T = (2 L f)^2 mu, with mu for 0.20 mm steel music
     wire (7850 kg/m3) on every string. Summed, that's the load the frame
     carries: 358 N, about 81 lb, the "tens of pounds" the project was about.
   - The sound is synthesized with Karplus-Strong (a noise burst circulating
     in a delay line one period long, filtered a little each time round),
     tuned to each note with a fractional-delay allpass. */

const VB_W = 1120;
const VB_H = 630;
const S = 2.55; // viewBox units per millimetre
const X0 = 36; // where the drawing's origin sits in the viewBox
const Y0 = 50;

type Pt = { x: number; y: number };
export type HarpString = { note: string; freq: number; pin: Pt; hole: Pt; length: number; tension: number; key: string };

export const GAUGE_MM = 0.2;
const STEEL = 7850; // kg/m3
export const MU = STEEL * Math.PI * (GAUGE_MM / 2000) ** 2; // kg per metre of string
const LBF = 4.4482216; // newtons per pound-force

const NAMES = ["C", "D", "E", "F", "G", "A", "B"];
const SEMITONES = [0, 2, 4, 5, 7, 9, 11];
// Lowest string first: the home row, then the row above it.
const KEYS = "asdfghjklqwertyui";

/** Anchor hole k, from the first one on the top wall round the end. */
function holeAt(k: number): Pt {
  const wall = 150, r = 78, span = (115 * Math.PI) / 180;
  const s = (k / 16) * (wall + r * span);
  if (s <= wall) return { x: 150 + s, y: 27 };
  const a = -Math.PI / 2 + (s - wall) / r;
  return { x: 300 + r * Math.cos(a), y: 105 + r * Math.sin(a) };
}

export const STRINGS: HarpString[] = Array.from({ length: 17 }, (_, i) => {
  const degree = i % 7, octave = 4 + Math.floor(i / 7);
  const midi = 60 + SEMITONES[degree] + 12 * (octave - 4);
  const freq = 440 * 2 ** ((midi - 69) / 12);
  const pin = { x: 40, y: 180 - i * 9.375 };
  const hole = holeAt(16 - i);
  const length = Math.hypot(hole.x - pin.x, hole.y - pin.y); // mm
  const tension = (2 * (length / 1000) * freq) ** 2 * MU; // N
  return { note: NAMES[degree] + octave, freq, pin, hole, length, tension, key: KEYS[i] };
});

export const TOTAL_N = STRINGS.reduce((sum, s) => sum + s.tension, 0);
export const TOTAL_LBF = TOTAL_N / LBF;

/* Karplus-Strong. The loop delay is the delay line (N samples), the
   two-point average (half a sample) and a first-order allpass (frac), which
   together make exactly one period, so every string is in tune. */
export function pluckSamples(freq: number, rate: number, seconds = 3, seed = 7): Float32Array {
  const out = new Float32Array(Math.round(rate * seconds));
  const period = rate / freq;
  let n0 = Math.floor(period - 0.5);
  let frac = period - 0.5 - n0;
  if (frac < 0.1) { n0 -= 1; frac += 1; }
  const c = (1 - frac) / (1 + frac);
  const line = new Float32Array(n0);

  let state = seed >>> 0;
  const rand = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 - 1;
  };
  for (let n = 0; n < n0; n++) line[n] = rand();
  // Soften the burst a little: a fingertip, not a pick.
  for (let pass = 0; pass < 2; pass++) {
    let y = line[n0 - 1];
    for (let n = 0; n < n0; n++) { y += 0.55 * (line[n] - y); line[n] = y; }
  }
  // Plucked a seventh of the way along: that harmonic and its multiples drop out.
  const p = Math.max(1, Math.round(n0 / 7));
  const copy = line.slice();
  for (let n = 0; n < n0; n++) line[n] = copy[n] - copy[(n - p + n0) % n0];
  let mean = 0, peak = 0;
  for (let n = 0; n < n0; n++) mean += line[n] / n0;
  for (let n = 0; n < n0; n++) { line[n] -= mean; peak = Math.max(peak, Math.abs(line[n])); }
  for (let n = 0; n < n0; n++) line[n] *= 0.9 / (peak || 1);

  // Lower strings ring longer, as steel does.
  const t60 = 3.2 * (261.63 / freq) ** 0.45;
  const rho = 10 ** (-3 / (t60 * freq));
  let idx = 0, prev = 0, apIn = 0, apOut = 0;
  for (let n = 0; n < out.length; n++) {
    const v = line[idx];
    out[n] = v;
    const avg = rho * 0.5 * (v + prev);
    prev = v;
    const ap = c * avg + apIn - c * apOut;
    apIn = avg;
    apOut = ap;
    line[idx] = ap;
    idx = idx + 1 === n0 ? 0 : idx + 1;
  }
  const fade = Math.round(rate * 0.08);
  for (let n = 0; n < fade; n++) out[out.length - 1 - n] *= n / fade;
  return out;
}

// --- drawing ----------------------------------------------------------------

const vb = (p: Pt): Pt => ({ x: X0 + p.x * S, y: Y0 + p.y * S });
const f1 = (v: number) => Math.round(v * 10) / 10;

/** A string's two drawn ends in viewBox units, just off the pin and the hole. */
const ENDS = STRINGS.map(s => {
  const len = s.length, dx = (s.hole.x - s.pin.x) / len, dy = (s.hole.y - s.pin.y) / len;
  const a = vb({ x: s.pin.x + dx * 3.2, y: s.pin.y + dy * 3.2 });
  const b = vb({ x: s.hole.x - dx * 1.6, y: s.hole.y - dy * 1.6 });
  return { a, b, nx: -dy, ny: dx };
});
const straight = (i: number) => {
  const { a, b } = ENDS[i];
  return `M${f1(a.x)} ${f1(a.y)}L${f1(b.x)} ${f1(b.y)}`;
};

const OUTLINE = "M8 2C30 2 50 6 64 14C76 20 84 18 96 18L300 18A87 87 0 0 1 300 192L96 192C84 192 76 190 64 196C50 204 30 208 8 208C3 208 0 205 0 200L0 10C0 5 3 2 8 2Z";
const WINDOW = "M76 34H236A91 91 0 0 0 236 176H76A14 14 0 0 1 62 162V48A14 14 0 0 1 76 34Z";
const HEART = "M0 3C0-1-5-2-5 1.5C-5 4-2 6 0 8C2 6 5 4 5 1.5C5-2 0-1 0 3Z";
const RINGS = [18, 30, 42, 54, 66];
const CRESCENT = "M290 92A13 13 0 1 0 302 110A10.5 10.5 0 1 1 290 92Z";

/** Where a tension label sits: above the top wall, or out from the round end. */
function labelAt(h: Pt): { x: number; y: number; anchor: "middle" | "start" } {
  if (h.y < 28 && h.x <= 300.5) return { ...vb({ x: h.x, y: 10 }), anchor: "middle" };
  const a = Math.atan2(h.y - 105, h.x - 300);
  const p = vb({ x: 300 + 94 * Math.cos(a), y: 105 + 94 * Math.sin(a) + 2 });
  return { ...p, anchor: Math.cos(a) > 0.35 ? "start" : "middle" };
}

// --- geometry for plucking ----------------------------------------------------

const cross = (o: Pt, a: Pt, b: Pt) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
function segmentsCross(p: Pt, q: Pt, a: Pt, b: Pt) {
  const d1 = cross(a, b, p), d2 = cross(a, b, q), d3 = cross(p, q, a), d4 = cross(p, q, b);
  return d1 * d2 <= 0 && d3 * d4 < 0 && !(d1 === 0 && d2 === 0);
}
function distanceToString(p: Pt, s: HarpString) {
  const ax = s.pin.x, ay = s.pin.y, bx = s.hole.x - ax, by = s.hole.y - ay;
  const t = Math.max(0, Math.min(1, ((p.x - ax) * bx + (p.y - ay) * by) / (bx * bx + by * by)));
  return Math.hypot(p.x - (ax + bx * t), p.y - (ay + by * t));
}

type Voice = { src: AudioBufferSourceNode; gain: GainNode };
type Audio = { ctx: AudioContext; master: GainNode; buffers: Map<number, AudioBuffer>; voices: (Voice | null)[] };

export default function Harp() {
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const audio = useRef<Audio | null>(null);
  const motion = useRef({ start: new Float64Array(17).fill(-1), amp: new Float64Array(17), raf: 0, reduce: false });
  const lastPluck = useRef(new Float64Array(17).fill(-1e9));
  const drag = useRef<{ id: number; last: Pt; lastT: number } | null>(null);
  const timers = useRef<number[]>([]);
  const [last, setLast] = useState<number | null>(null);
  const [labels, setLabels] = useState(false);

  const ensureAudio = useCallback(() => {
    if (!audio.current) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      const ctx = new AC();
      const master = ctx.createGain();
      master.gain.value = 0.22;
      master.connect(ctx.destination);
      audio.current = { ctx, master, buffers: new Map(), voices: Array(17).fill(null) };
    }
    if (audio.current.ctx.state === "suspended") void audio.current.ctx.resume();
    return audio.current;
  }, []);

  // One loop draws every string that is still moving, then stops.
  const frameRef = useRef<(now: number) => void>(() => {});
  useEffect(() => {
    const frame = (now: number) => {
      const m = motion.current;
      let busy = false;
      for (let i = 0; i < 17; i++) {
        const el = pathRefs.current[i];
        if (m.start[i] < 0 || !el) continue;
        const t = (now - m.start[i]) / 1000;
        const tau = 0.22 + 0.3 * (1 - i / 16);
        const heat = Math.exp(-t / 0.45);
        if (t > Math.max(5 * tau, 2.2)) {
          m.start[i] = -1;
          el.setAttribute("d", straight(i));
          el.style.strokeOpacity = "";
          continue;
        }
        busy = true;
        el.style.strokeOpacity = String(0.5 + 0.5 * heat);
        if (m.reduce) continue;
        // A damped standing wave, slowed down to something the eye can follow.
        const a = m.amp[i] * Math.exp(-t / tau) * Math.cos(2 * Math.PI * (11 + i * 0.5) * t) * S;
        const { a: p, b: q, nx, ny } = ENDS[i];
        const cx = (p.x + q.x) / 2 + nx * a * 2, cy = (p.y + q.y) / 2 + ny * a * 2;
        el.setAttribute("d", `M${f1(p.x)} ${f1(p.y)}Q${f1(cx)} ${f1(cy)} ${f1(q.x)} ${f1(q.y)}`);
      }
      m.raf = busy ? requestAnimationFrame(frame) : 0;
    };
    frameRef.current = frame;
  }, []);

  const pluck = useCallback((i: number, strength = 0.7) => {
    const now = performance.now();
    if (now - lastPluck.current[i] < 60) return;
    lastPluck.current[i] = now;
    setLast(i);

    const m = motion.current;
    m.start[i] = now;
    m.amp[i] = 1.2 + 2.4 * strength; // mm, drawn
    if (!m.raf) m.raf = requestAnimationFrame(frameRef.current);

    const au = ensureAudio();
    if (!au) return;
    const { ctx } = au;
    let buffer = au.buffers.get(i);
    if (!buffer) {
      const samples = pluckSamples(STRINGS[i].freq, ctx.sampleRate, 3, 7 + i);
      buffer = ctx.createBuffer(1, samples.length, ctx.sampleRate);
      buffer.getChannelData(0).set(samples);
      au.buffers.set(i, buffer);
    }
    // A string plucked again stops ringing first, as a real one does.
    const old = au.voices[i];
    if (old) {
      old.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.008);
      old.src.stop(ctx.currentTime + 0.05);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = 0.35 + 0.45 * strength;
    src.connect(gain).connect(au.master);
    src.start();
    const voice = { src, gain };
    au.voices[i] = voice;
    src.onended = () => { if (au.voices[i] === voice) au.voices[i] = null; };
  }, [ensureAudio]);

  useEffect(() => {
    const m = motion.current;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    m.reduce = mq.matches;
    const onChange = () => { m.reduce = mq.matches; };
    mq.addEventListener("change", onChange);
    const pending = timers.current;
    return () => {
      mq.removeEventListener("change", onChange);
      cancelAnimationFrame(m.raf);
      pending.forEach(t => window.clearTimeout(t));
      void audio.current?.ctx.close();
      audio.current = null;
    };
  }, []);

  /** The pointer in the drawing's millimetres, and how many pixels a millimetre is. */
  const toMm = (e: { clientX: number; clientY: number }) => {
    const r = svgRef.current!.getBoundingClientRect();
    return {
      x: (((e.clientX - r.left) / r.width) * VB_W - X0) / S,
      y: (((e.clientY - r.top) / r.height) * VB_H - Y0) / S,
      pxPerMm: (r.width / VB_W) * S,
    };
  };

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    ensureAudio();
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = toMm(e);
    drag.current = { id: e.pointerId, last: p, lastT: performance.now() };
    // A tap plucks the nearest string, if it lands on or near one.
    const reach = Math.min(4.6, Math.max(2.5, 12 / p.pxPerMm));
    let best = -1, bestD = reach;
    STRINGS.forEach((s, i) => { const d = distanceToString(p, s); if (d < bestD) { bestD = d; best = i; } });
    if (best >= 0) pluck(best, 0.6);
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const p = toMm(e), now = performance.now();
    const speed = Math.hypot(p.x - d.last.x, p.y - d.last.y) / Math.max(8, now - d.lastT); // mm per ms
    const crossed = STRINGS.map((s, i) => (segmentsCross(d.last, p, s.pin, s.hole) ? i : -1)).filter(i => i >= 0);
    // Sweep order follows the finger, so a fast glide still rises or falls.
    if (p.y < d.last.y) crossed.reverse();
    crossed.forEach(i => pluck(i, Math.min(1, 0.35 + speed * 0.9)));
    drag.current = { id: d.id, last: p, lastT: now };
  };

  const endDrag = (e: React.PointerEvent<SVGSVGElement>) => {
    if (drag.current?.id === e.pointerId) drag.current = null;
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const i = KEYS.indexOf(e.key.toLowerCase());
    if (i < 0) return;
    e.preventDefault();
    if (!e.repeat) pluck(i, 0.7);
  };

  const strum = () => {
    ensureAudio();
    timers.current.forEach(t => window.clearTimeout(t));
    timers.current = STRINGS.map((_, i) => window.setTimeout(() => pluck(i, 0.55), i * 55));
  };

  const s = last === null ? null : STRINGS[last];

  return (
    <figure className="ui-try harp-try" onKeyDown={onKeyDown}>
      <div
        className="ui-media ui-try-stage harp-stage"
        tabIndex={0}
        role="group"
        aria-label="Harp with 17 strings, C4 to E6. Keys A to L and Q to I pluck them, lowest first."
      >
        <svg
          ref={svgRef}
          className="harp-svg"
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          role="img"
          aria-label={`Line drawing of the harp lying on its side: 17 steel strings from the tuning pins to holes round the end, ${Math.round(TOTAL_N)} newtons of pull in all.`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <g transform={`translate(${X0} ${Y0}) scale(${S})`}>
            <path className="harp-line" d={OUTLINE} />
            <path className="harp-line" d={WINDOW} />
            <path className="harp-faint" d="M31 22V188M49 22V188" />
            <path className="harp-line" d={HEART} transform="translate(19 13) rotate(-90)" />
            <path className="harp-line" d={HEART} transform="translate(19 197) rotate(-90)" />
            {RINGS.map(r => <circle key={r} className="harp-faint" cx={290} cy={105} r={r} />)}
            <path className="harp-faint" d={CRESCENT} />
            {STRINGS.map((st, i) => (
              <g key={i}>
                <circle className="harp-line" cx={st.pin.x} cy={st.pin.y} r={3.2} />
                <circle className="harp-faint" cx={st.pin.x} cy={st.pin.y} r={1.2} />
                <circle className="harp-line" cx={st.hole.x} cy={st.hole.y} r={1.6} />
              </g>
            ))}
          </g>
          {STRINGS.map((st, i) => (
            <path key={st.note} ref={el => { pathRefs.current[i] = el; }} className="harp-string" d={straight(i)} />
          ))}
          {STRINGS.map(st => {
            const k = vb({ x: 25.5, y: st.pin.y + 1.6 });
            return <text key={st.key} className="harp-key" x={k.x} y={k.y} textAnchor="middle" aria-hidden="true">{st.key.toUpperCase()}</text>;
          })}
          {labels && STRINGS.map(st => {
            const l = labelAt(st.hole);
            return <text key={st.note} className="harp-tension" x={l.x} y={l.y} textAnchor={l.anchor}>{st.tension.toFixed(1)}</text>;
          })}
        </svg>
      </div>
      <div className="ui-try-controls">
        <div className="ui-try-row" role="group" aria-label="Harp">
          <button type="button" className="ui-try-pill" onClick={strum}>Strum</button>
          <button type="button" className="ui-try-pill harp-labels-pill" aria-pressed={labels} onClick={() => setLabels(v => !v)}>Tension in N</button>
        </div>
        <p className="harp-readout">
          <span>{s ? `${s.note}, ${s.freq.toFixed(0)} Hz, ${s.length.toFixed(0)} mm, ${s.tension.toFixed(1)} N` : "17 steel strings, C4 to E6"}</span>
          <span>The frame holds {Math.round(TOTAL_N)} N, about {Math.round(TOTAL_LBF)} lb</span>
        </p>
      </div>
      <figcaption className="ui-try-caption">
        Try it: drag across the strings, or play keys A to L and Q to I. Synthesized sound; tension is T&nbsp;=&nbsp;(2Lf)&sup2;&mu; for 0.20&nbsp;mm steel at the drawn lengths, traced from photos.
      </figcaption>
    </figure>
  );
}
