"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "./selfie-booth.css";

/* The selfie booth's label, running here: a photo turned into thermal
   printer dots on a 4 x 6 label, with the booth's own patterns, stickers,
   caption and date, drawn at the printer's resolution (808 x 1218 dots at
   203 dpi) and shown at a scale where each dot stays a whole pixel.

   The drawing and dithering are a TypeScript port of Amy's booth code
   (github.com/amywork777/selfie-booth: static/dots.js and static/label.js),
   cut down to the one-photo layout on 4 x 6 labels, which is what the booth
   prints by default. Everything else is the same: the 1% levels stretch and
   0.8 midtone lift, Floyd-Steinberg error diffusion, the patterns and sticker
   packs, the halftone greys, the Caveat caption and Doto date, and the final
   snap to pure black and white. The fonts are the booth's own files.

   The camera only starts when someone presses Use camera, and the picture
   never leaves the browser: it is drawn on a canvas here and nowhere else. */

// ---- dots.js ----------------------------------------------------------------------------------

/** RGBA pixels to one luminance byte per pixel. */
function toGray(rgba: Uint8ClampedArray) {
  const gray = new Float32Array(rgba.length / 4);
  for (let i = 0, p = 0; i < gray.length; i++, p += 4) gray[i] = 0.299 * rgba[p] + 0.587 * rgba[p + 1] + 0.114 * rgba[p + 2];
  return gray;
}

/** Stretch contrast so the darkest 1% goes black and the brightest 1% white, then lift the
    midtones. Thermal paper prints dark, so faces need the lift to keep their detail. */
function levels(gray: Float32Array, { clip = 0.01, gamma = 0.8 } = {}) {
  const hist = new Uint32Array(256);
  for (const v of gray) hist[Math.max(0, Math.min(255, v | 0))]++;
  const cut = gray.length * clip;
  let lo = 0, hi = 255, seen = 0;
  while (lo < 255 && (seen += hist[lo]) < cut) lo++;
  seen = 0;
  while (hi > 0 && (seen += hist[hi]) < cut) hi--;
  const span = Math.max(1, hi - lo);
  for (let i = 0; i < gray.length; i++) {
    const t = Math.max(0, Math.min(1, (gray[i] - lo) / span));
    gray[i] = 255 * Math.pow(t, gamma);
  }
  return gray;
}

/** Floyd-Steinberg error diffusion: every pixel ends up 0 (black dot) or 255 (paper). In place. */
function dither(gray: Float32Array, w: number, h: number) {
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const old = gray[i];
      const v = old < 128 ? 0 : 255;
      const err = old - v;
      gray[i] = v;
      if (x + 1 < w) gray[i + 1] += (err * 7) / 16;
      if (y + 1 < h) {
        if (x > 0) gray[i + w - 1] += (err * 3) / 16;
        gray[i + w] += (err * 5) / 16;
        if (x + 1 < w) gray[i + w + 1] += err / 16;
      }
    }
  }
  return gray;
}

/** Gray values back into RGBA as pure black or white; greys in between snap at 128. */
function paint(rgba: Uint8ClampedArray, gray: Float32Array) {
  for (let i = 0, p = 0; i < gray.length; i++, p += 4) {
    const v = gray[i] < 128 ? 0 : 255;
    rgba[p] = rgba[p + 1] = rgba[p + 2] = v;
    rgba[p + 3] = 255;
  }
  return rgba;
}

// ---- label.js ---------------------------------------------------------------------------------
// The printed label, in printer dots: 808 x 1218 for 4 x 6 (the width rounded down to whole bytes).
// Frames are bold black shapes and solid fills, because thin lines and greys print badly.

const W = 808;
const H = 1218;
const GAP = 16;

type Ctx = CanvasRenderingContext2D;
type Rect = { x: number; y: number; w: number; h: number };
type Panel = { frame: Rect; k: number; box: Rect; slots: Rect[]; bands: Rect[] };
type Pattern = {
  name: string;
  stickers: keyof typeof STICKERS;
  inset: number;
  stroke?: number;
  window?: (ctx: Ctx, s: Rect) => void;
  outline?: (ctx: Ctx, s: Rect, k: number) => void;
  under?: (ctx: Ctx, p: Panel) => void;
  art?: (ctx: Ctx, p: Panel) => void;
};

const bandHeight = (box: Rect) => Math.round(Math.max(110, box.h * 0.21));

/** One photo over a caption band (the booth's "1 photo" count). */
function arrange(box: Rect) {
  const bandH = bandHeight(box);
  const area = box.h - bandH - GAP;
  return { slots: [{ x: box.x, y: box.y, w: box.w, h: area }], bands: [{ x: box.x, y: box.y + area + GAP, w: box.w, h: bandH }] };
}

const PATTERNS: Record<string, Pattern> = {
  plain: { name: "Plain", stickers: "none", inset: 36, stroke: 12 },
  hearts: {
    name: "Hearts",
    stickers: "hearts",
    inset: 78,
    // Each photo is cut into a heart, with a bold heart outline.
    window: heartWindow,
    outline: (ctx, s, k) => {
      ctx.beginPath();
      heartWindow(ctx, s);
      ctx.lineWidth = 12 * k;
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#000";
      ctx.stroke();
    },
    art: (ctx, p) => chain(ctx, heart, p),
  },
  polka: {
    name: "Polka dot",
    stickers: "none",
    inset: 128,
    stroke: 8,
    under(ctx, p) {
      // Soft dots: big grey ones and small black ones in staggered rows, then a scalloped card.
      const { frame: f, k } = p;
      const grey = halftone(ctx, "mid");
      clipTo(ctx, f, () => {
        for (let row = 0, y = f.y + 10 * k; y < f.y + f.h + 60; row++, y += 44 * k) {
          for (let col = 0, x = f.x + (row % 2 ? 26 * k : 0); x < f.x + f.w + 60; col++, x += 52 * k) {
            const big = (row + col) % 2 === 0;
            ctx.beginPath();
            ctx.arc(x, y, (big ? 15 : 7) * k, 0, Math.PI * 2);
            ctx.fillStyle = big ? grey : "#000";
            ctx.fill();
          }
        }
      });
      scallopCard(ctx, p);
    },
    art(ctx, p) {
      // One big bow tied at the top of the card.
      ctx.save();
      ctx.translate(p.frame.x + p.frame.w / 2, p.box.y - 30 * p.k);
      bow(ctx, 62 * p.k);
      ctx.restore();
    },
  },
  gingham: {
    name: "Gingham",
    stickers: "none",
    inset: 124,
    stroke: 8,
    under(ctx, p) {
      // Soft picnic check: stripes a light dot pattern, crossings a medium one, so it prints pale grey.
      const { frame: f, k } = p;
      const band = 26 * k, step = 52 * k;
      clipTo(ctx, f, () => {
        ctx.fillStyle = halftone(ctx, "light");
        for (let y = f.y; y < f.y + f.h; y += step) ctx.fillRect(f.x, y, f.w, band);
        for (let x = f.x; x < f.x + f.w; x += step) ctx.fillRect(x, f.y, band, f.h);
        ctx.fillStyle = halftone(ctx, "mid");
        for (let y = f.y; y < f.y + f.h; y += step) for (let x = f.x; x < f.x + f.w; x += step) ctx.fillRect(x, y, band, band);
      });
      card(ctx, p);
    },
  },
  doodle: { name: "Doodle", stickers: "none", inset: 104, outline: (ctx, s, k) => sketchRect(ctx, s, k), art: (ctx, p) => doodles(ctx, p) },
  daisy: { name: "Daisy chain", stickers: "flowers", inset: 92, stroke: 10, art: (ctx, p) => { vine(ctx, p); chain(ctx, daisy, p, 104); } },
};
type PatternKey = keyof typeof PATTERNS;

function layout(pattern: PatternKey) {
  const P = PATTERNS[pattern] ?? PATTERNS.plain;
  const frame = { x: 0, y: 0, w: W, h: H };
  const k = 1;
  const box = { x: P.inset, y: P.inset, w: W - P.inset * 2, h: H - P.inset * 2 };
  const panel: Panel = { frame, k, box, ...arrange(box) };
  return { ...P, panels: [panel], stroke: P.stroke ?? 0, slots: panel.slots, bands: panel.bands };
}
type Layout = ReturnType<typeof layout>;

function clipTo(ctx: Ctx, r: Rect, draw: () => void) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(r.x, r.y, r.w, r.h);
  ctx.clip();
  draw();
  ctx.restore();
}

/** A white card just outside the content box with a scalloped edge, like a cookie cutter. */
function scallopCard(ctx: Ctx, p: Panel) {
  const b = p.box, m = 26 * p.k, r = 20 * p.k;
  const c = { x: b.x - m, y: b.y - m, w: b.w + m * 2, h: b.h + m * 2 };
  const bumps: [number, number][] = [];
  const along = (x0: number, y0: number, x1: number, y1: number) => {
    const n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / (r * 1.7)));
    for (let i = 0; i < n; i++) bumps.push([x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n]);
  };
  along(c.x, c.y, c.x + c.w, c.y);
  along(c.x + c.w, c.y, c.x + c.w, c.y + c.h);
  along(c.x + c.w, c.y + c.h, c.x, c.y + c.h);
  along(c.x, c.y + c.h, c.x, c.y);
  // Outline every bump, then fill them and the card white so only the outer scallop line shows.
  ctx.lineWidth = 6 * p.k;
  ctx.strokeStyle = "#000";
  for (const [x, y] of bumps) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke(); }
  ctx.fillStyle = "#fff";
  for (const [x, y] of bumps) { ctx.beginPath(); ctx.arc(x, y, r - 3 * p.k, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillRect(c.x, c.y, c.w, c.h);
}

/** A white rounded card just outside the content box, so a pattern frames the photos. */
function card(ctx: Ctx, p: Panel) {
  const b = p.box, m = 24 * p.k;
  ctx.fillStyle = "#fff";
  roundRect(ctx, b.x - m, b.y - m, b.w + m * 2, b.h + m * 2, 30 * p.k);
  ctx.lineWidth = 8 * p.k;
  ctx.strokeStyle = "#000";
  ctx.stroke();
}

/** A dot pattern that prints as grey: 'light' is one dot in four (25%), 'mid' a checkerboard (50%). */
function halftone(ctx: Ctx, tone: "light" | "mid") {
  const tile = document.createElement("canvas");
  tile.width = tile.height = 4;
  const t = tile.getContext("2d")!;
  t.fillStyle = "#000";
  t.fillRect(0, 0, 2, 2);
  if (tone === "mid") t.fillRect(2, 2, 2, 2);
  const pattern = ctx.createPattern(tile, "repeat")!;
  // Keep the dots at real pixel size even on the scaled-down live preview, so the grey matches the print.
  const k = ctx.getTransform().a;
  pattern.setTransform(new DOMMatrix([1 / k, 0, 0, 1 / k, 0, 0]));
  return pattern;
}

// Pen-drawn marks with a little wobble. A fixed seed keeps them in the same places every time.
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
type Rand = () => number;
type Pt = [number, number];

/** Stroke a list of points as one pen line, nudging each point a little so it looks hand-drawn. */
function pen(ctx: Ctx, pts: Pt[], rand: Rand, wobble: number, close = false) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => {
    const jx = x + (rand() - 0.5) * wobble, jy = y + (rand() - 0.5) * wobble;
    if (i) ctx.lineTo(jx, jy);
    else ctx.moveTo(jx, jy);
  });
  if (close) ctx.closePath();
  ctx.stroke();
}

const ring = (n: number, f: (a: number, i: number) => Pt) => Array.from({ length: n + 1 }, (_, i) => f((i / n) * Math.PI * 2, i));

const DOODLES: ((ctx: Ctx, r: number, rand: Rand) => void)[] = [
  // spiral
  (ctx, r, rand) => pen(ctx, Array.from({ length: 40 }, (_, i): Pt => { const a = i * 0.45, d = (i / 40) * r; return [Math.cos(a) * d, Math.sin(a) * d]; }), rand, r * 0.06),
  // outline star
  (ctx, r, rand) => pen(ctx, ring(10, (a, i) => { const d = i % 2 ? r * 0.45 : r; return [Math.cos(a - Math.PI / 2) * d, Math.sin(a - Math.PI / 2) * d]; }), rand, r * 0.1, true),
  // squiggle
  (ctx, r, rand) => pen(ctx, Array.from({ length: 24 }, (_, i): Pt => [-r + (i / 23) * r * 2, Math.sin(i * 0.8) * r * 0.35]), rand, r * 0.06),
  // outline heart
  (ctx, r, rand) => pen(ctx, ring(28, (a) => [r * 0.06 * 16 * Math.sin(a) ** 3, -r * 0.06 * (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a))]), rand, r * 0.08, true),
  // smiley
  (ctx, r, rand) => {
    pen(ctx, ring(24, (a) => [Math.cos(a) * r, Math.sin(a) * r]), rand, r * 0.08, true);
    pen(ctx, ring(10, (a) => [Math.cos(a / 4 + 0.6) * r * 0.55, Math.sin(a / 4 + 0.6) * r * 0.55]).slice(0, 9), rand, r * 0.05);
    for (const ex of [-0.35, 0.35]) { ctx.beginPath(); ctx.arc(ex * r, -0.25 * r, r * 0.1, 0, Math.PI * 2); ctx.fill(); }
  },
  // loopy flower
  (ctx, r, rand) => {
    pen(ctx, ring(60, (a) => { const d = r * (0.55 + 0.45 * Math.abs(Math.sin(a * 2.5))); return [Math.cos(a) * d, Math.sin(a) * d]; }), rand, r * 0.06, true);
    ctx.beginPath(); ctx.arc(0, 0, r * 0.16, 0, Math.PI * 2); ctx.fill();
  },
  // zigzag
  (ctx, r, rand) => pen(ctx, Array.from({ length: 7 }, (_, i): Pt => [-r + (i / 6) * r * 2, i % 2 ? r * 0.35 : -r * 0.35]), rand, r * 0.08),
  // sparkle lines
  (ctx, r, rand) => {
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI; pen(ctx, [[Math.cos(a) * r, Math.sin(a) * r], [-Math.cos(a) * r, -Math.sin(a) * r]], rand, r * 0.08); }
  },
  // dot cluster
  (ctx, r, rand) => { for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc((rand() - 0.5) * r * 1.6, (rand() - 0.5) * r * 1.6, r * (0.1 + rand() * 0.1), 0, Math.PI * 2); ctx.fill(); } },
];

/** Doodles scattered all the way round the panel, in the border between its edge and the photos. */
function doodles(ctx: Ctx, p: Panel) {
  const { frame: f, box, k } = p;
  const rand = seeded(7);
  const band = Math.min(box.x - f.x, box.y - f.y);
  const mid = band / 2;
  const step = 94 * k;
  const pts: Pt[] = [];
  for (let x = f.x + mid; x < f.x + f.w - mid; x += step) pts.push([x, f.y + mid], [x + step / 2, f.y + f.h - mid]);
  for (let y = f.y + mid + step; y < f.y + f.h - mid - step / 2; y += step) pts.push([f.x + mid, y], [f.x + f.w - mid, y]);
  ctx.strokeStyle = "#000";
  ctx.fillStyle = "#000";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = 6 * k;
  pts.forEach(([x, y], i) => {
    ctx.save();
    ctx.translate(x + (rand() - 0.5) * 14 * k, y + (rand() - 0.5) * 14 * k);
    ctx.rotate((rand() - 0.5) * 1.2);
    DOODLES[i % DOODLES.length](ctx, (27 + rand() * 11) * k, rand);
    ctx.restore();
  });
}

/** A photo outline drawn twice by hand: a wobbly line with a looser second pass. */
function sketchRect(ctx: Ctx, s: Rect, k: number) {
  const rand = seeded(Math.round(s.x * 7 + s.y));
  const edge = (x0: number, y0: number, x1: number, y1: number) => Array.from({ length: 9 }, (_, i): Pt => [x0 + ((x1 - x0) * i) / 8, y0 + ((y1 - y0) * i) / 8]);
  const corners: Pt[] = [[s.x, s.y], [s.x + s.w, s.y], [s.x + s.w, s.y + s.h], [s.x, s.y + s.h], [s.x, s.y]];
  const pts = corners.slice(0, 4).flatMap((c, i) => edge(c[0], c[1], corners[i + 1][0], corners[i + 1][1]));
  ctx.strokeStyle = "#000";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = 6 * k;
  pen(ctx, pts, rand, 5 * k, true);
  ctx.lineWidth = 3 * k;
  pen(ctx, pts.map(([x, y]): Pt => [x + 5 * k, y + 4 * k]), rand, 9 * k, true);
}

/** The heart's box: as big as fits in the slot, a touch wider than tall. */
function heartBox(s: Rect) {
  const w = Math.min(s.w, s.h / 0.95);
  const h = w * 0.95;
  return { x: s.x + (s.w - w) / 2, y: s.y + (s.h - h) / 2, w, h };
}

/** Add a heart, as big as fits centred in the slot, to the current path. */
function heartWindow(ctx: Ctx, s: Rect) {
  const { x, y, w, h } = heartBox(s);
  const top = h * 0.26;
  ctx.moveTo(x + w / 2, y + top);
  ctx.bezierCurveTo(x + w / 2, y, x, y, x, y + top);
  ctx.bezierCurveTo(x, y + (h + top) / 2, x + w / 2, y + (h + top) / 2, x + w / 2, y + h);
  ctx.bezierCurveTo(x + w / 2, y + (h + top) / 2, x + w, y + (h + top) / 2, x + w, y + top);
  ctx.bezierCurveTo(x + w, y, x + w / 2, y, x + w / 2, y + top);
  ctx.closePath();
}

/** A daisy: ten round white petals outlined in black, a solid centre with a little shine. */
function daisy(ctx: Ctx, r: number) {
  ctx.lineWidth = Math.max(2, r * 0.11);
  ctx.strokeStyle = "#000";
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    ctx.beginPath();
    ctx.ellipse(Math.cos(a) * r * 0.58, Math.sin(a) * r * 0.58, r * 0.42, r * 0.24, a, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.32, 0, Math.PI * 2);
  ctx.fillStyle = "#000";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-r * 0.1, -r * 0.1, r * 0.08, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();
}

/** A wavy vine with little leaves along the line the daisy chain sits on. */
function vine(ctx: Ctx, p: Panel) {
  const { frame: f, k } = p;
  const inset = 46 * k, amp = 10 * k, wave = 52 * k;
  const x0 = f.x + inset, y0 = f.y + inset, x1 = f.x + f.w - inset, y1 = f.y + f.h - inset;
  // Walk the rectangle clockwise; each point carries the outward normal of its edge.
  const edges = [[x0, y0, x1, y0, 0, -1], [x1, y0, x1, y1, 1, 0], [x1, y1, x0, y1, 0, 1], [x0, y1, x0, y0, -1, 0]];
  let d = 0;
  const leaves: [number, number, number, number][] = [];
  ctx.beginPath();
  for (const [ax, ay, bx, by, nx, ny] of edges) {
    const len = Math.hypot(bx - ax, by - ay);
    for (let t = 0; t <= len; t += 4 * k) {
      const off = Math.sin(((d + t) / wave) * Math.PI * 2) * amp;
      const x = ax + ((bx - ax) * t) / len + nx * off, y = ay + ((by - ay) * t) / len + ny * off;
      if (d + t === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      // A leaf halfway between daisies, alternating sides of the vine.
      if (Math.round((d + t) / (4 * k)) % Math.round(wave / (4 * k)) === Math.round(wave / (8 * k))) leaves.push([x, y, Math.atan2(by - ay, bx - ax), leaves.length % 2 ? 1 : -1]);
    }
    d += len;
  }
  ctx.closePath();
  ctx.lineWidth = 4 * k;
  ctx.strokeStyle = "#000";
  ctx.stroke();
  ctx.fillStyle = "#000";
  for (const [x, y, a, side] of leaves) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a + side * 0.7);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(9 * k, -7 * k, 20 * k, 0);
    ctx.quadraticCurveTo(9 * k, 7 * k, 0, 0);
    ctx.fill();
    ctx.restore();
  }
}

/** Shapes all the way round the panel edge, alternating size and tilt. */
function chain(ctx: Ctx, shape: (ctx: Ctx, r: number) => void, p: Panel, spacing = 66) {
  const { frame: f, k } = p;
  const inset = 46 * k, step = spacing * k;
  const pts: Pt[] = [];
  for (let x = f.x + inset; x < f.x + f.w - inset; x += step) pts.push([x, f.y + inset], [x + step / 2, f.y + f.h - inset]);
  for (let y = f.y + inset + step; y < f.y + f.h - inset; y += step) pts.push([f.x + inset, y], [f.x + f.w - inset, y]);
  pts.forEach(([x, y], i) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(i % 2 ? 0.25 : -0.25);
    shape(ctx, (i % 3 ? 24 : 30) * k);
    ctx.restore();
  });
}

// Stickers: a few shapes at spots picked from the layout, two corners of every photo and both sides
// of each caption band. Black with a white die-cut edge so they read over photos.
const STICKERS = {
  none: [] as ((ctx: Ctx, r: number) => void)[],
  hearts: [(ctx: Ctx, r: number) => heart(ctx, r)],
  bows: [bow],
  flowers: [flower],
};

function spots(L: Layout) {
  const out: { x: number; y: number; r: number; a: number }[] = [];
  L.slots.forEach((s, i) => {
    const r = Math.min(s.w, s.h);
    // Alternate which corners get stickers so a strip doesn't look stamped out.
    if (i % 2 === 0) {
      out.push({ x: s.x + r * 0.06, y: s.y + r * 0.06, r: r * 0.1, a: -0.25 });
      out.push({ x: s.x + s.w - r * 0.04, y: s.y + s.h - r * 0.05, r: r * 0.14, a: 0.2 });
    } else {
      out.push({ x: s.x + s.w - r * 0.06, y: s.y + r * 0.06, r: r * 0.1, a: 0.25 });
      out.push({ x: s.x + r * 0.05, y: s.y + s.h - r * 0.05, r: r * 0.13, a: -0.2 });
    }
    // Big photos get a few more, smaller, along the edges.
    if (r > 400) {
      out.push({ x: s.x + s.w - r * 0.03, y: s.y + s.h * 0.18, r: r * 0.06, a: 0.3 });
      out.push({ x: s.x + r * 0.02, y: s.y + s.h * 0.62, r: r * 0.07, a: -0.15 });
      out.push({ x: s.x + s.w * 0.3, y: s.y + s.h - r * 0.01, r: r * 0.05, a: 0.1 });
      out.push({ x: s.x + s.w - r * 0.1, y: s.y + r * 0.03, r: r * 0.045, a: -0.3 });
    }
  });
  for (const b of L.bands.filter((b) => b.w >= 500)) {
    const r = Math.min(30, b.w * 0.06);
    out.push({ x: b.x + r * 1.3, y: b.y + b.h * 0.42, r, a: -0.2 });
    out.push({ x: b.x + b.w - r * 1.3, y: b.y + b.h * 0.42, r, a: 0.2 });
  }
  return out;
}

function drawStickers(ctx: Ctx, L: Layout) {
  const shapes = STICKERS[L.stickers];
  if (!shapes.length) return;
  spots(L).forEach((p, i) => {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.a);
    shapes[i % shapes.length](ctx, p.r);
    ctx.restore();
  });
}

/** Fill the current path black with a white die-cut edge. */
function dieCut(ctx: Ctx, edge = 10) {
  ctx.lineJoin = "round";
  ctx.lineWidth = edge;
  ctx.strokeStyle = "#fff";
  ctx.stroke();
  ctx.fillStyle = "#000";
  ctx.fill();
}

function heart(ctx: Ctx, r: number, edge = 10) {
  ctx.beginPath();
  ctx.moveTo(0, r * 0.9);
  ctx.bezierCurveTo(-r * 1.4, -r * 0.1, -r * 0.7, -r * 1.2, 0, -r * 0.45);
  ctx.bezierCurveTo(r * 0.7, -r * 1.2, r * 1.4, -r * 0.1, 0, r * 0.9);
  ctx.closePath();
  dieCut(ctx, edge);
}

function flower(ctx: Ctx, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    ctx.moveTo(Math.cos(a) * r * 0.55 + r * 0.42, Math.sin(a) * r * 0.55);
    ctx.arc(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55, r * 0.42, 0, Math.PI * 2);
  }
  dieCut(ctx);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.26, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();
}

function bow(ctx: Ctx, r: number) {
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-r * 0.6, -r * 0.9, -r * 1.1, -r * 0.5);
  ctx.quadraticCurveTo(-r * 1.3, 0, -r * 1.1, r * 0.5);
  ctx.quadraticCurveTo(-r * 0.6, r * 0.9, 0, 0);
  ctx.quadraticCurveTo(r * 0.6, -r * 0.9, r * 1.1, -r * 0.5);
  ctx.quadraticCurveTo(r * 1.3, 0, r * 1.1, r * 0.5);
  ctx.quadraticCurveTo(r * 0.6, r * 0.9, 0, 0);
  ctx.moveTo(-r * 0.15, r * 0.1);
  ctx.lineTo(-r * 0.55, r * 1.1);
  ctx.lineTo(-r * 0.25, r * 1.0);
  ctx.lineTo(0, r * 0.2);
  ctx.lineTo(r * 0.25, r * 1.0);
  ctx.lineTo(r * 0.55, r * 1.1);
  ctx.lineTo(r * 0.15, r * 0.1);
  dieCut(ctx);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.24, 0, Math.PI * 2);
  dieCut(ctx, 6);
}

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}

type Source = HTMLImageElement | HTMLVideoElement | HTMLCanvasElement;
function sourceSize(src: Source): [number, number] {
  if (src instanceof HTMLVideoElement) return [src.videoWidth, src.videoHeight];
  if (src instanceof HTMLImageElement) return [src.naturalWidth, src.naturalHeight];
  return [src.width, src.height];
}

/** Crop `src` to fill the slot (mirrored for the camera, as the booth does), then levels and
    dither just that slot. */
function drawPhoto(ctx: Ctx, src: Source, s: Rect, scale: number, shape: Pattern["window"], paper: string, mirror: boolean) {
  const px = Math.round(s.x * scale), py = Math.round(s.y * scale);
  const pw = Math.round(s.w * scale), ph = Math.round(s.h * scale);
  const [sw, sh] = sourceSize(src);
  if (!sw || !sh) return;
  const k = Math.max(pw / sw, ph / sh);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.beginPath();
  ctx.rect(px, py, pw, ph);
  ctx.clip();
  if (mirror) {
    ctx.translate(px + pw, py);
    ctx.scale(-1, 1);
  } else {
    ctx.translate(px, py);
  }
  ctx.drawImage(src, (pw - sw * k) / 2, (ph - sh * k) / 2, sw * k, sh * k);
  ctx.restore();
  const img = ctx.getImageData(px, py, pw, ph);
  paint(img.data, dither(levels(toGray(img.data)), pw, ph));
  ctx.putImageData(img, px, py);
  if (shape) {
    // Shaped window: paper over the part of the slot outside the shape.
    ctx.beginPath();
    ctx.rect(s.x, s.y, s.w, s.h);
    shape(ctx, s);
    ctx.fillStyle = paper;
    ctx.fill("evenodd");
  }
}

function fitSize(ctx: Ctx, text: string, maxWidth: number, max: number) {
  let size = max;
  for (; size > 28; size -= 4) {
    ctx.font = `700 ${size}px Caveat, cursive`;
    if (ctx.measureText(text).width <= maxWidth) break;
  }
  return size;
}

const DATE = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

/** Draw the label at `scale` (1 = printer resolution) and reduce it to pure black and white,
    exactly as it would print. */
function render(canvas: HTMLCanvasElement, photo: Source | null, { pattern = "plain" as PatternKey, caption = "", showDate = true, scale = 1, mirror = false } = {}) {
  const L = layout(pattern);
  const ink = "#000";
  const background = "#fff";
  const cw = Math.round(W * scale);
  const ch = Math.round(H * scale);
  if (canvas.width !== cw || canvas.height !== ch) {
    canvas.width = cw;
    canvas.height = ch;
  }
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, W, H);
  for (const p of L.panels) L.under?.(ctx, p);

  for (const s of L.slots) if (photo) drawPhoto(ctx, photo, s, scale, L.window, background, mirror);
  // Outlines after the photo is down.
  for (const s of L.slots) {
    if (L.outline) {
      L.outline(ctx, s, L.panels[0].k);
    } else if (L.stroke) {
      ctx.beginPath();
      ctx.rect(s.x, s.y, s.w, s.h);
      ctx.lineWidth = L.stroke;
      ctx.strokeStyle = ink;
      ctx.stroke();
    }
  }

  for (const p of L.panels) L.art?.(ctx, p);
  drawStickers(ctx, L);

  // Caption and date are one block, as big as the band allows, centred in it.
  const text = caption.trim();
  ctx.fillStyle = ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const b of L.bands) {
    const dateSize = showDate ? Math.round(Math.min(56, b.w / 11, b.h * 0.24)) : 0;
    const gap = text && showDate ? dateSize * 0.5 : 0;
    // Wide bands keep room for the stickers beside the caption.
    const room = b.w - (b.w >= 500 ? 190 : 24);
    const capSize = text ? fitSize(ctx, text, room, Math.min(150, (b.h - dateSize - gap) * 0.95)) : 0;
    const top = b.y + (b.h - (capSize * 0.8 + gap + dateSize)) / 2;
    if (text) {
      ctx.font = `700 ${capSize}px Caveat, "Bradley Hand", cursive`;
      ctx.fillText(text, b.x + b.w / 2, top + capSize * 0.4);
    }
    if (showDate) {
      ctx.font = `900 ${dateSize}px Doto, "Helvetica Neue", sans-serif`;
      ctx.fillText(DATE.format(new Date()).toUpperCase(), b.x + b.w / 2, top + capSize * 0.8 + gap + dateSize / 2);
    }
  }

  // Snap anti-aliased edges so the screen shows exactly the dots the printer would make.
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const all = ctx.getImageData(0, 0, cw, ch);
  paint(all.data, toGray(all.data));
  ctx.putImageData(all, 0, 0);
}

// ---- The demo ---------------------------------------------------------------------------------

const ORDER: PatternKey[] = ["plain", "hearts", "polka", "gingham", "doodle", "daisy"];
const SAMPLE = "/amy-portrait.jpg";
const DIR = "/demos/selfie-booth";
const LIVE_SCALE = 0.5; // the booth's live preview runs at half resolution to stay smooth

type Mode = "sample" | "live" | "photo";

/** The label's size on screen: as big as fits, snapped where it can be to a size where one
    printer dot is a whole number of screen pixels (or two dots one pixel), so dots stay crisp. */
function labelSize(maxW: number, maxH: number, dpr: number) {
  const fit = Math.min(maxW, (maxH * W) / H);
  for (const dotsPerPixel of [0.5, 1, 2]) {
    const w = (W / dpr) / dotsPerPixel;
    if (w <= fit + 0.5 && w >= fit * 0.8) return w;
  }
  return fit;
}

export default function SelfieBooth() {
  const [pattern, setPattern] = useState<PatternKey>("daisy");
  const [caption, setCaption] = useState("hi from amy");
  const [mode, setMode] = useState<Mode>("sample");
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const sample = useRef<HTMLImageElement | null>(null);
  const snapshot = useRef<HTMLCanvasElement | null>(null);
  const video = useRef<HTMLVideoElement | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const settings = useRef({ pattern, caption });
  useEffect(() => { settings.current = { pattern, caption }; }, [pattern, caption]);

  // Draw the still label at full printer resolution.
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const photo = mode === "photo" ? snapshot.current : sample.current;
    if (!canvas || !photo) return;
    render(canvas, photo, { pattern, caption, scale: 1, mirror: mode === "photo" });
  }, [pattern, caption, mode]);

  // Load the sample photo and the booth's fonts once, then draw.
  useEffect(() => {
    let cancelled = false;
    const img = new window.Image();
    img.src = SAMPLE;
    const fonts = [
      new FontFace("Doto", `url(${DIR}/doto.woff2) format("woff2")`, { weight: "100 900" }),
      new FontFace("Caveat", `url(${DIR}/caveat.woff) format("woff")`, { weight: "700" }),
    ];
    const loaded = fonts.map(f => f.load().then(face => { document.fonts.add(face); }).catch(() => undefined));
    Promise.all([img.decode(), ...loaded]).then(() => {
      if (cancelled) return;
      sample.current = img;
      setReady(true);
    }).catch(() => { /* the static label underneath stays */ });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (ready && mode !== "live") draw();
  }, [ready, mode, draw]);

  // Size the label to the stage, keeping its dots whole.
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const fit = () => {
      const r = box.getBoundingClientRect();
      const w = labelSize(r.width, r.height, window.devicePixelRatio || 1);
      box.style.setProperty("--label-w", `${w}px`);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    return () => ro.disconnect();
  }, []);

  const stopCamera = () => {
    stream.current?.getTracks().forEach(t => t.stop());
    stream.current = null;
    if (video.current) video.current.srcObject = null;
  };
  useEffect(() => () => { stream.current?.getTracks().forEach(t => t.stop()); }, []);

  // The live mirror, drawn as the printer's own dots, at about 15 frames a second like the booth.
  useEffect(() => {
    if (mode !== "live") return;
    let raf = 0, last = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const v = video.current, canvas = canvasRef.current;
      if (!v || !canvas || !v.videoWidth || now - last < 66) return;
      last = now;
      render(canvas, v, { ...settings.current, scale: LIVE_SCALE, mirror: true });
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [mode]);

  const startCamera = async () => {
    setMessage("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage("This browser can't open a camera here.");
      return;
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1920 }, height: { ideal: 1440 } }, audio: false });
      stream.current = s;
      const v = document.createElement("video");
      v.muted = true;
      v.playsInline = true;
      v.srcObject = s;
      video.current = v;
      await v.play();
      setMode("live");
    } catch (err) {
      stopCamera();
      setMessage((err as Error).name === "NotAllowedError" ? "Camera access is off. Allow it for this site to try it." : "Couldn't start the camera.");
    }
  };

  const takePhoto = () => {
    const v = video.current;
    if (!v || !v.videoWidth) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext("2d")?.drawImage(v, 0, 0);
    snapshot.current = c;
    stopCamera();
    setMode("photo");
  };

  const backToSample = () => {
    stopCamera();
    snapshot.current = null;
    setMode("sample");
  };

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas || mode === "live") return;
    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "selfie-booth-sticker.png";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
  };

  const description = `A 4 by 6 thermal label in black dots: ${mode === "sample" ? "a photo of Amy" : "your photo"} in the ${PATTERNS[pattern].name.toLowerCase()} pattern${caption.trim() ? `, captioned “${caption.trim()}”` : ""}, with today's date.`;

  return (
    <figure className="ui-try">
      <div className="ui-media ui-try-stage sb-stage">
        <div ref={boxRef} className="sb-fit">
          <div className="sb-label">
            {/* The default label, drawn by this code ahead of time, shows until the canvas is ready. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${DIR}/first.png`} alt="" width={W} height={H} />
            <canvas ref={canvasRef} width={W} height={H} role="img" aria-label={description} data-ready={ready || undefined} />
          </div>
        </div>
      </div>
      <div className="ui-try-controls">
        <div className="ui-try-row" role="group" aria-label="Pattern">
          {ORDER.map(key => (
            <button key={key} type="button" className="ui-try-pill" aria-pressed={pattern === key} onClick={() => setPattern(key)}>
              {PATTERNS[key].name}
            </button>
          ))}
        </div>
        <div className="ui-try-row">
          <input
            className="sb-caption"
            type="text"
            value={caption}
            maxLength={24}
            aria-label="Caption"
            placeholder="Caption"
            spellCheck={false}
            autoComplete="off"
            onChange={e => setCaption(e.target.value)}
          />
          {mode === "live" ? (
            <>
              <button type="button" className="ui-try-pill" onClick={takePhoto}>Take photo</button>
              <button type="button" className="ui-try-reset" onClick={backToSample}>Cancel</button>
            </>
          ) : (
            <>
              <button type="button" className="ui-try-pill" onClick={startCamera}>{mode === "photo" ? "Retake" : "Use camera"}</button>
              {mode === "photo" && <button type="button" className="ui-try-reset" onClick={backToSample}>Sample photo</button>}
            </>
          )}
          <button type="button" className="ui-try-pill" onClick={download} disabled={!ready || mode === "live"}>Download sticker</button>
        </div>
        {message && <p className="sb-message" role="status">{message}</p>}
      </div>
      <figcaption className="ui-try-caption">
        Try it: pick a pattern and write a caption. Use camera to make your own; the photo stays in your browser and is never uploaded.
      </figcaption>
    </figure>
  );
}
