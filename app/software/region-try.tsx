"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* A small, real version of Region Maps to play with: the grey boot from the
   launch video, split into three parts, each recoloured live in the browser.
   Click a part (or pick it below), then a colour. Until someone touches it,
   it shows a few colourways on its own, the way the launch video does.

   The parts come from the video itself: the frame where the boot turns red,
   blue and yellow gives each part's mask by hue (try-regions.png: red =
   upper, green = trim, blue = knit), laid over the grey frame before it
   (try-base.webp), both cropped above the video's caption. Recolouring keeps the render's own shading: each part's
   grey is mapped through a 256-step lookup from its shadows to the colour to
   its highlights, so folds and knit holes stay where they were. */

const W = 1120;
const H = 630;

type RGB = [number, number, number];
type Part = { id: "upper" | "knit" | "trim"; label: string; channel: 0 | 1 | 2 };

const PARTS: Part[] = [
  { id: "upper", label: "Upper", channel: 0 },
  { id: "knit", label: "Knit", channel: 2 },
  { id: "trim", label: "Trim", channel: 1 },
];

const SWATCHES: { name: string; rgb: RGB | null }[] = [
  { name: "Original grey", rgb: null },
  { name: "Signal red", rgb: [214, 52, 40] },
  { name: "Cobalt", rgb: [46, 72, 196] },
  { name: "Sun yellow", rgb: [242, 196, 40] },
  { name: "Forest", rgb: [44, 88, 58] },
  { name: "Sand", rgb: [200, 176, 136] },
  { name: "Orange", rgb: [230, 110, 40] },
  { name: "Lilac", rgb: [180, 160, 224] },
  { name: "Ink", rgb: [36, 36, 38] },
];

type Look = Record<Part["id"], RGB | null>;

// What it shows by itself before anyone touches it. The first is the
// colourway from the launch video.
const COLOURWAYS: Look[] = [
  { upper: [214, 52, 40], knit: [46, 72, 196], trim: [242, 196, 40] },
  { upper: [44, 88, 58], knit: [200, 176, 136], trim: [230, 110, 40] },
  { upper: [36, 36, 38], knit: [36, 36, 38], trim: [180, 160, 224] },
  { upper: [200, 176, 136], knit: [44, 88, 58], trim: [214, 52, 40] },
  { upper: null, knit: null, trim: null },
];

const GREY: Look = { upper: null, knit: null, trim: null };

/** A colour with how much of it is applied, so grey can fade in and out. */
type Ink = { rgb: RGB; amount: number };
const inkOf = (c: RGB | null, previous?: Ink): Ink => (c ? { rgb: c, amount: 1 } : { rgb: previous?.rgb ?? [128, 128, 128], amount: 0 });

export function RegionTry() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const data = useRef<{ base: Uint8ClampedArray; lum: Uint8Array; part: Uint8Array; weight: Uint8Array; ref: number[]; out: ImageData; ctx: CanvasRenderingContext2D } | null>(null);
  const shown = useRef<Record<Part["id"], Ink>>({ upper: inkOf(null), knit: inkOf(null), trim: inkOf(null) });
  const tween = useRef<number>(0);
  // A part lights up for a moment when it's chosen, so a click on the
  // picture answers on the picture.
  const flash = useRef<{ part: number; amount: number }>({ part: -1, amount: 0 });
  const [ready, setReady] = useState(false);
  const [look, setLook] = useState<Look>(COLOURWAYS[0]);
  const [selected, setSelected] = useState<Part["id"]>("upper");
  const [touched, setTouched] = useState(false);
  const [hover, setHover] = useState(false);

  // Paint the current inks: one lookup table per part, then one pass.
  const paint = useCallback(() => {
    const d = data.current;
    if (!d) return;
    const luts = PARTS.map((p, i) => {
      const { rgb, amount } = shown.current[p.id];
      const ref = d.ref[i];
      const lut = new Uint8ClampedArray(256 * 3);
      for (let l = 0; l < 256; l++) {
        for (let c = 0; c < 3; c++) {
          const col = rgb[c];
          const tinted = l <= ref ? col * (l / ref) : col + (255 - col) * 0.85 * ((l - ref) / (255 - ref));
          const v = l + (tinted - l) * amount;
          lut[l * 3 + c] = flash.current.part === i ? v + (255 - v) * flash.current.amount : v;
        }
      }
      return lut;
    });
    const { base, lum, part, weight, out } = d;
    const px = out.data;
    for (let p = 0, i = 0; p < lum.length; p++, i += 4) {
      const k = part[p];
      if (k === 255) continue; // never changes from the grey it started as
      const w = weight[p] / 255, lut = luts[k], j = lum[p] * 3;
      // The grey render is close to neutral, so the lookup replaces it outright
      // where the mask is solid and blends at the soft edges.
      px[i] = base[i] + (lut[j] - base[i]) * w;
      px[i + 1] = base[i + 1] + (lut[j + 1] - base[i + 1]) * w;
      px[i + 2] = base[i + 2] + (lut[j + 2] - base[i + 2]) * w;
    }
    d.ctx.putImageData(out, 0, 0);
  }, []);

  // Load the grey frame and the part masks into flat arrays once.
  useEffect(() => {
    let cancelled = false;
    const load = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
    Promise.all([load("/software/region-maps/try-base.webp"), load("/software/region-maps/try-regions.png")]).then(([baseImg, maskImg]) => {
      const canvas = canvasRef.current;
      if (cancelled || !canvas) return;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(maskImg, 0, 0, W, H);
      const mask = ctx.getImageData(0, 0, W, H).data;
      ctx.drawImage(baseImg, 0, 0, W, H);
      const out = ctx.getImageData(0, 0, W, H);
      const base = new Uint8ClampedArray(out.data);
      const n = W * H;
      const lum = new Uint8Array(n), part = new Uint8Array(n).fill(255), weight = new Uint8Array(n);
      const hist = PARTS.map(() => new Uint32Array(256));
      for (let p = 0, i = 0; p < n; p++, i += 4) {
        lum[p] = Math.round(0.299 * base[i] + 0.587 * base[i + 1] + 0.114 * base[i + 2]);
        let best = 255, bestW = 0;
        PARTS.forEach((pt, k) => { const v = mask[i + pt.channel]; if (v > bestW) { bestW = v; best = k; } });
        if (bestW > 8) {
          part[p] = best;
          weight[p] = bestW;
          if (bestW > 200) hist[best][lum[p]]++;
        }
      }
      // Each part's typical grey becomes the point that maps to the pure colour.
      const ref = hist.map(h => {
        const total = h.reduce((a, b) => a + b, 0);
        let seen = 0;
        for (let l = 0; l < 256; l++) { seen += h[l]; if (seen >= total * 0.6) return Math.max(40, Math.min(220, l)); }
        return 160;
      });
      data.current = { base, lum, part, weight, ref, out, ctx };
      paint();
      setReady(true);
    }).catch(() => { /* the grey picture underneath stays */ });
    return () => { cancelled = true; };
  }, [paint]);

  // Ease from what's shown to the new look.
  useEffect(() => {
    if (!ready) return;
    const from = { ...shown.current };
    const to = Object.fromEntries(PARTS.map(p => [p.id, inkOf(look[p.id], from[p.id])])) as Record<Part["id"], Ink>;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now(), duration = reduce ? 0 : 420;
    cancelAnimationFrame(tween.current);
    const step = (now: number) => {
      const t = duration ? Math.min(1, (now - start) / duration) : 1;
      const e = 1 - Math.pow(1 - t, 3);
      for (const p of PARTS) {
        const a = from[p.id], b = to[p.id];
        // Fading to or from grey keeps the hue still and only changes how much.
        const rgbFrom = a.amount === 0 ? b.rgb : a.rgb, rgbTo = b.amount === 0 ? a.rgb : b.rgb;
        shown.current[p.id] = {
          rgb: [0, 1, 2].map(c => rgbFrom[c] + (rgbTo[c] - rgbFrom[c]) * e) as RGB,
          amount: a.amount + (b.amount - a.amount) * e,
        };
      }
      paint();
      if (t < 1) tween.current = requestAnimationFrame(step);
    };
    tween.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(tween.current);
  }, [look, ready, paint]);

  // Play the colourways on its own while it's on screen, until it's touched.
  useEffect(() => {
    if (!ready || touched) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    let timer = 0, i = 0;
    const run = () => { timer = window.setInterval(() => { i = (i + 1) % COLOURWAYS.length; setLook(COLOURWAYS[i]); }, 2200); };
    const io = new IntersectionObserver(([e]) => { window.clearInterval(timer); if (e.isIntersecting) run(); }, { threshold: 0.4 });
    io.observe(canvas);
    return () => { io.disconnect(); window.clearInterval(timer); };
  }, [ready, touched]);

  const partAt = (e: { clientX: number; clientY: number }): Part["id"] | null => {
    const d = data.current, canvas = canvasRef.current;
    if (!d || !canvas) return null;
    const r = canvas.getBoundingClientRect();
    const cx = Math.round(((e.clientX - r.left) / r.width) * W), cy = Math.round(((e.clientY - r.top) / r.height) * H);
    // Forgive a near miss: look a few pixels around the pointer.
    for (const rad of [0, 4, 9]) {
      for (const [dx, dy] of [[0, 0], [rad, 0], [-rad, 0], [0, rad], [0, -rad]]) {
        const x = cx + dx, y = cy + dy;
        if (x < 0 || y < 0 || x >= W || y >= H) continue;
        const p = y * W + x;
        if (d.part[p] !== 255 && d.weight[p] > 120) return PARTS[d.part[p]].id;
      }
    }
    return null;
  };

  const choose = (id: Part["id"]) => {
    setTouched(true);
    setSelected(id);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const part = PARTS.findIndex(p => p.id === id), start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / 520);
      flash.current = { part, amount: 0.42 * (1 - t) * (1 - t) };
      paint();
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const take = (next: Look) => { setTouched(true); setLook(next); };
  const pick = (rgb: RGB | null) => take({ ...look, [selected]: rgb });
  const sameColour = (a: RGB | null, b: RGB | null) => (a === null || b === null ? a === b : a.every((v, i) => v === b[i]));
  const nameOf = (rgb: RGB | null) => SWATCHES.find(s => sameColour(s.rgb, rgb))?.name.toLowerCase() ?? "custom";
  const description = `A boot render. ${PARTS.map(p => `${p.label}: ${nameOf(look[p.id])}`).join(", ")}.`;

  return (
    <figure className="ui-try">
      <div className="ui-media ui-try-stage">
        {/* The grey render shows first and stays if scripting is off. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/software/region-maps/try-base.webp" alt="" width={W} height={H} />
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          role="img"
          aria-label={description}
          data-ready={ready || undefined}
          data-hover={hover || undefined}
          onPointerMove={e => setHover(partAt(e) !== null)}
          onPointerLeave={() => setHover(false)}
          onClick={e => { const id = partAt(e); if (id) choose(id); }}
        />
      </div>
      <div className="ui-try-controls">
        <div className="ui-try-row" role="group" aria-label="Part">
          {PARTS.map(p => (
            <button key={p.id} type="button" className="ui-try-part" aria-pressed={selected === p.id} onClick={() => choose(p.id)}>
              {p.label}
            </button>
          ))}
          <button type="button" className="ui-try-reset" onClick={() => take(GREY)}>Reset</button>
        </div>
        <div className="ui-try-row" role="group" aria-label={`Colour for the ${selected}`}>
          {SWATCHES.map(s => (
            <button
              key={s.name}
              type="button"
              className="ui-try-swatch"
              aria-label={s.name}
              title={s.name}
              aria-pressed={sameColour(look[selected], s.rgb)}
              style={{ "--swatch": s.rgb ? `rgb(${s.rgb.join(" ")})` : "#9a9a9a" } as React.CSSProperties}
              onClick={() => pick(s.rgb)}
            />
          ))}
        </div>
      </div>
      <figcaption className="ui-try-caption">Try it: click a part of the boot, then pick a colour. The shading is the render&rsquo;s own.</figcaption>
    </figure>
  );
}
