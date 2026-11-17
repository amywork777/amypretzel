"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "./clarinet-tuning-barrel.css";

/* The tuning barrel to play with: a side drawing of it on the clarinet, in
   1px line work, as the photos show it. Two male ends (white on the
   mouthpiece side, black on the upper joint) thread into one hex sleeve,
   right-hand above and left-hand below, so turning the sleeve lengthens
   the barrel at both ends at once and the bore (dashed) never opens a gap.
   Drag the barrel or the slider; play the note against A = 440 and listen
   for the beats.

   The model, plainly:
   - The note is written B4 on a B-flat clarinet, sounding A4: low E's
     fingering with the register key, so the whole tube is in play, on its
     third resonance as a closed pipe: f = 3c / 4L.
   - L is the rest of the instrument plus the barrel. The rest is set so a
     66 mm barrel plays exactly 440 Hz with the air in the bore at 22 C;
     that comes to about 521 mm, close to a real clarinet's sounding length.
     No end corrections, no tone holes: f simply goes as 1 / L, about 3 cents
     a millimetre.
   - c = 331.3 sqrt(1 + T / 273.15) m/s. Warming up raises the air in the
     bore from 22 to 26 C, which raises c, so the clarinet goes sharp and
     the barrel has to come out to bring it down.
   - The 64 to 72 mm range and the 1 mm thread pitch (it only turns the
     drawn hex) are assumed; the project text doesn't give them.
   - The sound is synthesized: odd harmonics, a gentle low-pass, a soft
     attack. A sine at 440 Hz is the reference. */

export const L_MIN = 64;
export const L_MAX = 72;
export const L_START = 66;
export const T_ROOM = 22;
export const T_WARM = 26;
const PITCH = 1; // mm per turn of each thread; a turn of the sleeve moves both

export const soundSpeed = (celsius: number) => 331.3 * Math.sqrt(1 + celsius / 273.15);
/** The rest of the instrument's air column, in mm, set so 66 mm plays 440 Hz at 22 C. */
export const REST_MM = ((3 * soundSpeed(T_ROOM)) / (4 * 440)) * 1000 - L_START;
export const pitchOf = (barrel: number, celsius: number) => (3 * soundSpeed(celsius)) / (4 * ((REST_MM + barrel) / 1000));
export const centsOf = (f: number) => 1200 * Math.log2(f / 440);

// --- drawing, in viewBox units -----------------------------------------------

const VB_W = 1120;
const VB_H = 630;
const K = 7; // viewBox units per mm
const CX = 560;
const CY = 262;
const SLEEVE = 34; // hex sleeve length, mm
const COLLAR = 14; // visible length of each male part's collar, mm
const STUB = 34; // how much mouthpiece and upper joint to draw, mm
const HEX_R = 30 / Math.sqrt(3); // 30 mm across the flats
const GAUGE = { x: 560, y: 612, r: 118 };

const X = (mm: number) => CX + mm * K;
const Y = (mm: number) => CY + mm * K;
const r1 = (v: number) => Math.round(v * 10) / 10;

/** A wavy break line, drawn top to bottom, where the drawing stops. */
const breakLine = (x: number, half: number) => {
  const t = Y(-half), b = Y(half), h = (b - t) / 4;
  return `M${r1(x)} ${r1(t)}C${r1(x - 9)} ${r1(t + h)} ${r1(x + 9)} ${r1(t + h)} ${r1(x)} ${r1(t + 2 * h)}C${r1(x - 9)} ${r1(t + 3 * h)} ${r1(x + 9)} ${r1(t + 3 * h)} ${r1(x)} ${r1(b)}`;
};
const box = (x0: number, x1: number, half: number) => `M${r1(X(x0))} ${r1(Y(-half))}H${r1(X(x1))}V${r1(Y(half))}H${r1(X(x0))}Z`;

function Barrel({ length }: { length: number }) {
  const e = (length - (SLEEVE + 2 * COLLAR)) / 2; // exposed thread on each side
  const s = SLEEVE / 2;
  const wl = -s - e - COLLAR, bl = s + e + COLLAR; // outer ends of the barrel
  const turn = ((length - L_START) / (2 * PITCH)) * 2 * Math.PI;

  // The hex, side on: its silhouette and whichever edges face us.
  const ys = [0, 1, 2, 3, 4, 5].map(k => turn + (k * Math.PI) / 3);
  const top = Math.min(...ys.map(a => HEX_R * Math.sin(a)));
  const bottom = Math.max(...ys.map(a => HEX_R * Math.sin(a)));
  const edges = ys.filter(a => Math.cos(a) > 0.02).map(a => HEX_R * Math.sin(a)).filter(y => y > top + 0.3 && y < bottom - 0.3);

  // Thread crests ride on the male parts, so more of them show as it opens.
  const threads: string[] = [];
  for (let x = -s - e + 0.5; x < -s; x += PITCH) threads.push(`M${r1(X(x))} ${r1(Y(-12))}L${r1(X(x + 0.45))} ${r1(Y(12))}`);
  for (let x = s + e - 0.5; x > s; x -= PITCH) threads.push(`M${r1(X(x))} ${r1(Y(-12))}L${r1(X(x - 0.45))} ${r1(Y(12))}`);

  return (
    <g>
      {/* centre line and the bore, dashed, unbroken from end to end */}
      <path className="clar-centre" d={`M${r1(X(wl - STUB - 6))} ${CY}H${r1(X(bl + STUB + 6))}`} />
      <path className="clar-hidden" d={`M${r1(X(wl - STUB))} ${r1(Y(-7.5))}H${r1(X(bl + STUB))}M${r1(X(wl - STUB))} ${r1(Y(7.5))}H${r1(X(bl + STUB))}`} />
      {/* mouthpiece and upper joint, cut off with break lines */}
      <path className="clar-line" d={`M${r1(X(wl))} ${r1(Y(-12))}H${r1(X(wl - STUB))}M${r1(X(wl))} ${r1(Y(12))}H${r1(X(wl - STUB))}`} />
      <path className="clar-line" d={breakLine(X(wl - STUB), 12)} />
      <path className="clar-line" d={`M${r1(X(bl))} ${r1(Y(-14))}H${r1(X(bl + STUB))}M${r1(X(bl))} ${r1(Y(14))}H${r1(X(bl + STUB))}`} />
      <path className="clar-line" d={breakLine(X(bl + STUB), 14)} />
      {/* the two male parts: collar, then the exposed thread */}
      <path className="clar-line" d={box(wl, -s - e, 13.5)} />
      <path className="clar-line" d={box(s + e, bl, 13.5)} />
      <path className="clar-line" d={`M${r1(X(-s - e))} ${r1(Y(-12))}H${r1(X(-s))}M${r1(X(-s - e))} ${r1(Y(12))}H${r1(X(-s))}M${r1(X(s))} ${r1(Y(-12))}H${r1(X(s + e))}M${r1(X(s))} ${r1(Y(12))}H${r1(X(s + e))}`} />
      <path className="clar-faint" d={threads.join("")} />
      {/* the hex sleeve */}
      <path className="clar-line" d={`M${r1(X(-s))} ${r1(Y(top))}H${r1(X(s))}V${r1(Y(bottom))}H${r1(X(-s))}Z`} />
      <path className="clar-line" d={edges.map(y => `M${r1(X(-s))} ${r1(Y(y))}H${r1(X(s))}`).join("")} />
    </g>
  );
}

function Dimension({ length }: { length: number }) {
  const l = X(-length / 2), r = X(length / 2), y = Y(-HEX_R - 10);
  return (
    <g>
      <path className="clar-faint" d={`M${r1(l)} ${r1(Y(-15))}V${r1(y - 14)}M${r1(r)} ${r1(Y(-15))}V${r1(y - 14)}`} />
      <path className="clar-line" d={`M${r1(l)} ${r1(y)}H${r1(r)}M${r1(l + 14)} ${r1(y - 5)}L${r1(l)} ${r1(y)}L${r1(l + 14)} ${r1(y + 5)}M${r1(r - 14)} ${r1(y - 5)}L${r1(r)} ${r1(y)}L${r1(r - 14)} ${r1(y + 5)}`} />
    </g>
  );
}

function Gauge({ cents }: { cents: number }) {
  const { x, y, r } = GAUGE;
  const at = (deg: number, rad: number) => {
    const a = (deg * Math.PI) / 180;
    return `${r1(x + rad * Math.sin(a))} ${r1(y - rad * Math.cos(a))}`;
  };
  const ticks = [-50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50].map(c => `M${at(c, r)}L${at(c, r - (c === 0 ? 18 : 9))}`).join("");
  const shown = Math.max(-50, Math.min(50, cents)); // one cent is one degree
  return (
    <g>
      <path className="clar-line" d={`M${at(-50, r)}A${r} ${r} 0 0 1 ${at(50, r)}${ticks}`} />
      <line className="clar-needle" x1={x} y1={y} x2={x} y2={y - r + 24} style={{ transform: `rotate(${r1(shown)}deg)`, transformOrigin: `${x}px ${y}px` }} />
      <circle className="clar-line" cx={x} cy={y} r={3.5} />
    </g>
  );
}

// --- sound ---------------------------------------------------------------------

type Voice = { osc: OscillatorNode; env: GainNode };
type Audio = { ctx: AudioContext; master: GainNode; wave: PeriodicWave; tone: Voice | null; ref: Voice | null };

function startVoice(au: Audio, kind: "tone" | "ref", freq: number) {
  const { ctx } = au;
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  env.gain.value = 0;
  if (kind === "tone") {
    // Odd harmonics, as a cylinder closed at one end gives, rounded off.
    osc.setPeriodicWave(au.wave);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 2600;
    lp.Q.value = 0.6;
    osc.connect(lp).connect(env);
  } else {
    osc.type = "sine";
    osc.connect(env);
  }
  osc.frequency.value = freq;
  env.connect(au.master);
  osc.start();
  env.gain.setTargetAtTime(kind === "tone" ? 0.55 : 0.3, ctx.currentTime, 0.06);
  return { osc, env };
}

function stopVoice(au: Audio, v: Voice | null) {
  if (!v) return;
  const t = au.ctx.currentTime;
  v.env.gain.cancelScheduledValues(t);
  v.env.gain.setTargetAtTime(0, t, 0.05);
  v.osc.stop(t + 0.4);
}

export default function ClarinetBarrel() {
  const figRef = useRef<HTMLElement>(null);
  const audio = useRef<Audio | null>(null);
  const [length, setLength] = useState(L_START);
  const [warm, setWarm] = useState(false);
  const [temp, setTemp] = useState(T_ROOM);
  const tempRef = useRef(T_ROOM);
  const [playing, setPlaying] = useState(false);
  const [refOn, setRefOn] = useState(false);
  const drag = useRef<{ id: number; x: number; start: number; width: number } | null>(null);

  const freq = pitchOf(length, temp);
  const cents = centsOf(freq);
  const inTune = Math.abs(cents) < 1;

  const ensureAudio = useCallback(() => {
    if (!audio.current) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      const ctx = new AC();
      const master = ctx.createGain();
      master.gain.value = 0.2;
      master.connect(ctx.destination);
      const n = 24, real = new Float32Array(n), imag = new Float32Array(n);
      for (let h = 1; h < n; h++) imag[h] = h % 2 ? 1 / h ** 1.1 : 0.05 / h;
      const wave = ctx.createPeriodicWave(real, imag);
      audio.current = { ctx, master, wave, tone: null, ref: null };
    }
    if (audio.current.ctx.state === "suspended") void audio.current.ctx.resume();
    return audio.current;
  }, []);

  // Start, stop and retune the two voices as the state changes.
  useEffect(() => {
    const au = audio.current;
    if (!au) return;
    if (playing && !au.tone) au.tone = startVoice(au, "tone", freq);
    if (!playing && au.tone) { stopVoice(au, au.tone); au.tone = null; }
    if (refOn && !au.ref) au.ref = startVoice(au, "ref", 440);
    if (!refOn && au.ref) { stopVoice(au, au.ref); au.ref = null; }
    au.tone?.osc.frequency.setTargetAtTime(freq, au.ctx.currentTime, 0.03);
  }, [playing, refOn, freq]);

  // Warming up takes a moment, so the needle drifts rather than jumps.
  useEffect(() => {
    const target = warm ? T_WARM : T_ROOM;
    const from = tempRef.current;
    if (from === target) return;
    const set = (t: number) => { tempRef.current = t; setTemp(t); };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { set(target); return; }
    const start = performance.now(), duration = 1800;
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration), e = 1 - Math.pow(1 - t, 3);
      set(from + (target - from) * e);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [warm]);

  // Never left sounding: it stops off screen, in a hidden tab, and on the way out.
  useEffect(() => {
    const stop = () => { setPlaying(false); setRefOn(false); };
    const onVis = () => { if (document.hidden) stop(); };
    document.addEventListener("visibilitychange", onVis);
    const io = new IntersectionObserver(([e]) => { if (!e.isIntersecting) stop(); });
    if (figRef.current) io.observe(figRef.current);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      io.disconnect();
      void audio.current?.ctx.close();
      audio.current = null;
    };
  }, []);

  const clamp = (v: number) => Math.round(Math.max(L_MIN, Math.min(L_MAX, v)) * 10) / 10;

  const onPointerDown = (e: React.PointerEvent<SVGRectElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const svg = e.currentTarget.ownerSVGElement!;
    drag.current = { id: e.pointerId, x: e.clientX, start: length, width: svg.getBoundingClientRect().width };
  };
  const onPointerMove = (e: React.PointerEvent<SVGRectElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    // Half the stage's width covers the whole range, at any size.
    setLength(clamp(d.start + ((e.clientX - d.x) / (d.width / 2)) * (L_MAX - L_MIN)));
  };
  const endDrag = (e: React.PointerEvent<SVGRectElement>) => {
    if (drag.current?.id === e.pointerId) drag.current = null;
  };

  const hitHalf = (L_MAX / 2 + STUB) * K;
  const centsText = `${cents >= 0.05 ? "+" : cents <= -0.05 ? "−" : ""}${Math.abs(cents).toFixed(1)} cents`;
  const state = inTune ? "in tune" : cents > 0 ? "sharp" : "flat";
  const beats = Math.abs(freq - 440);

  return (
    <figure ref={figRef} className="ui-try clar-try">
      <div className="ui-media ui-try-stage clar-stage">
        <svg
          className="clar-svg"
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          role="img"
          aria-label={`Side drawing of the barrel at ${length.toFixed(1)} mm. The clarinet plays ${freq.toFixed(1)} Hz, ${centsText} ${state}.`}
        >
          <Dimension length={length} />
          <Barrel length={length} />
          <Gauge cents={cents} />
          <rect
            className="clar-hit"
            x={CX - hitHalf}
            y={Y(-22)}
            width={hitHalf * 2}
            height={44 * K}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          />
        </svg>
        <p className="clar-label clar-dim" style={{ top: `${((Y(-HEX_R - 10) - 26) / VB_H) * 100}%` }}>{length.toFixed(1)} mm</p>
        <p className="clar-label clar-left">
          <span>{freq.toFixed(1)} Hz</span>
          <span className="clar-soft">Bore air {temp.toFixed(1)} &deg;C</span>
        </p>
        <p className="clar-label clar-right">
          <span>{centsText} {state}</span>
          <span className="clar-soft">{refOn && playing && !inTune ? `${beats.toFixed(1)} beats a second` : "\u00a0"}</span>
        </p>
      </div>
      <div className="ui-try-controls">
        <div className="ui-try-row" role="group" aria-label="Sound and temperature">
          <button type="button" className="ui-try-pill" aria-pressed={playing} onClick={() => { ensureAudio(); setPlaying(v => !v); }}>Play B4</button>
          <button type="button" className="ui-try-pill" aria-pressed={refOn} onClick={() => { ensureAudio(); setRefOn(v => !v); }}>A 440</button>
          <button type="button" className="ui-try-pill" aria-pressed={warm} onClick={() => setWarm(v => !v)}>Warm up</button>
        </div>
        <label className="clar-length">
          <span>Length</span>
          <input
            type="range"
            className="clar-slider"
            min={L_MIN}
            max={L_MAX}
            step={0.1}
            value={length}
            aria-valuetext={`${length.toFixed(1)} millimetres`}
            onChange={e => setLength(clamp(Number(e.target.value)))}
          />
        </label>
      </div>
      <figcaption className="ui-try-caption">
        Try it: play B4 against A&nbsp;440, warm up, then pull the barrel out until the beats stop. Synthesized sound; pitch from a closed pipe, f&nbsp;=&nbsp;3c&nbsp;/&nbsp;4L.
      </figcaption>
    </figure>
  );
}
