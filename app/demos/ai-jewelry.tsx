"use client";

import { useEffect, useRef, useState } from "react";
import pieceData from "../../public/demos/ai-jewelry/charms.json";
import "./ai-jewelry.css";

/* A small, real version of the cleanup stage behind Taiyaki Jewelry. It opens
   on three fully 3D pieces: simple sculpts after Taiyaki charms in Amy's photos
   (Teddy the poodle, the goldfish, the duck with an umbrella). There are no
   Taiyaki mesh files to show, so they were modelled from rounded shapes in
   scripts/make-jewelry-charms.mjs, then put through the same casting rules in
   3D there: parts under 0.8 mm thickened, loose bits dropped, a bail added
   above the centre of mass. Their size, weight and what the cleanup changed
   come from that script (charms.json); weight is the final mesh's volume
   times the metal's density.

   Or draw an outline (or pick one), and it comes back as a charm that could
   be cast. The image-to-3D model is not here; what runs is the part after it,
   the geometry rules that make a shape survive lost-wax casting.

   The outline is scaled so its longer side is 18 mm, rasterised at 0.1 mm,
   and cleaned the way a jewelry CAD designer would: gaps and inside corners
   narrower than 0.8 mm are filled (plaster can't hold them), parts thinner
   than 0.8 mm are thickened along their middle (they'd burn out), holes under
   1.2 mm are closed, and loose pieces are dropped. The cleaned shape is traced
   back into a smooth outline, extruded 1.6 mm thick with rounded edges, and
   given a 1.2 mm wire jump ring at the top. Size and weight are worked out
   from that geometry and the metal's density. The 3D (three.js) loads only
   when the demo is near the screen; before that, a still of the piece stands
   in, captured from this same code by the script. */

// ---------------------------------------------------------------------------
// The rules, in millimetres.

const W = 1120; // drawing pad, in the stage's own 16:9 units
const H = 630;
const SIZE = 18; // the charm body's longer side
const CELL = 0.1; // raster resolution
const N = 240; // the raster is N x N cells: 24 mm square, centred on the charm
const HALF = (N * CELL) / 2;
const MIN_FEATURE = 0.8; // thinnest wall or gap that casts
const MIN_HOLE = 1.2; // smallest hole worth keeping, across
const DEPTH = 0.8; // flat middle of the edge
const BEVEL_T = 0.4; // each rounded edge, front and back
const BEVEL_S = 0.35; // how far the rounding reaches in from the edge
const THICK = DEPTH + 2 * BEVEL_T; // 1.6 mm
const RING_R = 2.1; // jump ring, centre line
const RING_WIRE = 0.6; // jump ring wire radius (1.2 mm wire, 3 mm inside)

const R = MIN_FEATURE / 2 / CELL; // 4 cells
const R2 = R * R;
const SIG = 14; // cells; smaller changes are rounding, not fixes worth naming

type Pt = [number, number];
type MetalId = "silver" | "vermeil" | "gold";
type Metal = { id: MetalId; label: string; name: string; density: number; f0: [number, number, number]; roughness: number };

// Colours are each metal's reflectance (linear), so they read as metal under
// the same light rather than as paint.
const METALS: Metal[] = [
  { id: "silver", label: "Sterling silver", name: "sterling silver", density: 10.36, f0: [0.96, 0.95, 0.92], roughness: 0.26 },
  { id: "vermeil", label: "Gold vermeil", name: "gold vermeil", density: 10.36, f0: [1, 0.74, 0.32], roughness: 0.28 },
  { id: "gold", label: "14k gold", name: "14k gold", density: 13.1, f0: [0.98, 0.8, 0.5], roughness: 0.28 },
];

type PieceId = keyof typeof pieceData;
type Piece = (typeof pieceData)[PieceId];
const PIECES = Object.keys(pieceData) as PieceId[];
// Said in the accessible label, to match the caption.
const AFTER: Record<PieceId, string> = { dog: "Teddy the poodle", fish: "the goldfish", duck: "the duck with an umbrella" };

type SampleId = "heart" | "dog" | "star";
const SAMPLES: { id: SampleId; label: string }[] = [
  { id: "heart", label: "Heart" },
  { id: "dog", label: "Dog" },
  { id: "star", label: "Star" },
];

type Charm = {
  outer: Pt[]; // mm, y up
  holes: Pt[][];
  bail: Pt; // ring centre
  width: number; // overall, mm
  height: number;
  volume: number; // mm³
  note: string; // what the cleanup changed
  marks: Pt[]; // where it changed it, mm
};
type Fit = { cx: number; cy: number; k: number }; // pad units to mm
type Made = { charm: Charm; fit: Fit; from: Pt[][] };

// ---------------------------------------------------------------------------
// Raster helpers on the N x N grid. Cell centres sit at whole grid coordinates.

const toGrid = ([x, y]: Pt): Pt => [(x + HALF) / CELL - 0.5, (HALF - y) / CELL - 0.5];
const toMm = (gx: number, gy: number): Pt => [(gx + 0.5) * CELL - HALF, HALF - (gy + 0.5) * CELL];

/** Fill closed loops (nonzero winding, so a loop drawn over itself stays solid). */
function fill(loops: Pt[][]): Uint8Array {
  const m = new Uint8Array(N * N);
  const edges: number[][] = [];
  for (const loop of loops) {
    for (let i = 0; i < loop.length; i++) {
      const a = toGrid(loop[i]), b = toGrid(loop[(i + 1) % loop.length]);
      if (a[1] !== b[1]) edges.push([a[0], a[1], b[0], b[1]]);
    }
  }
  const xs: Pt[] = [];
  for (let j = 0; j < N; j++) {
    xs.length = 0;
    for (const [x0, y0, x1, y1] of edges) {
      if ((y0 <= j && j < y1) || (y1 <= j && j < y0)) xs.push([x0 + ((j - y0) / (y1 - y0)) * (x1 - x0), y0 < y1 ? 1 : -1]);
    }
    xs.sort((p, q) => p[0] - q[0]);
    let w = 0;
    for (let k = 0; k < xs.length - 1; k++) {
      w += xs[k][1];
      if (w === 0) continue;
      const i1 = Math.min(N - 1, Math.floor(xs[k + 1][0]));
      for (let i = Math.max(0, Math.ceil(xs[k][0])); i <= i1; i++) m[j * N + i] = 1;
    }
  }
  return m;
}

/** Squared distance from every cell to the nearest cell whose value is
    `target` (Felzenszwalb and Huttenlocher's exact Euclidean transform). */
function dist2(m: Uint8Array, target: 0 | 1): Float64Array {
  const BIG = 1e20;
  const d = new Float64Array(N * N);
  for (let i = 0; i < N * N; i++) d[i] = m[i] === target ? 0 : BIG;
  const f = new Float64Array(N), out = new Float64Array(N), v = new Int32Array(N), z = new Float64Array(N + 1);
  const line = (start: number, stride: number) => {
    for (let q = 0; q < N; q++) f[q] = d[start + q * stride];
    let k = 0;
    v[0] = 0; z[0] = -BIG; z[1] = BIG;
    for (let q = 1; q < N; q++) {
      let s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
      while (s <= z[k]) { k--; s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]); }
      k++; v[k] = q; z[k] = s; z[k + 1] = BIG;
    }
    k = 0;
    for (let q = 0; q < N; q++) { while (z[k + 1] < q) k++; out[q] = (q - v[k]) * (q - v[k]) + f[v[k]]; }
    for (let q = 0; q < N; q++) d[start + q * stride] = out[q];
  };
  for (let x = 0; x < N; x++) line(x, N);
  for (let y = 0; y < N; y++) line(y * N, 1);
  return d;
}

const erode = (m: Uint8Array) => { const d = dist2(m, 0); return m.map((v, i) => (v && d[i] > R2 ? 1 : 0)); };
const dilate = (m: Uint8Array) => { const d = dist2(m, 1); return m.map((_, i) => (d[i] <= R2 ? 1 : 0)); };
const open = (m: Uint8Array) => dilate(erode(m));

/** 4-connected pieces of the cells where m is 1. */
function pieces(m: Uint8Array): { cells: number[]; edge: boolean }[] {
  const seen = new Uint8Array(N * N), out: { cells: number[]; edge: boolean }[] = [];
  for (let s = 0; s < N * N; s++) {
    if (!m[s] || seen[s]) continue;
    const cells = [s];
    let edge = false;
    seen[s] = 1;
    for (let h = 0; h < cells.length; h++) {
      const c = cells[h], x = c % N, y = (c - x) / N;
      if (x === 0 || y === 0 || x === N - 1 || y === N - 1) edge = true;
      for (const n of [x > 0 ? c - 1 : -1, x < N - 1 ? c + 1 : -1, y > 0 ? c - N : -1, y < N - 1 ? c + N : -1]) {
        if (n >= 0 && m[n] && !seen[n]) { seen[n] = 1; cells.push(n); }
      }
    }
    out.push({ cells, edge });
  }
  return out;
}

const centre = (cells: number[]): Pt => {
  let sx = 0, sy = 0;
  for (const c of cells) { sx += c % N; sy += Math.floor(c / N); }
  return toMm(sx / cells.length, sy / cells.length);
};

/** Two box blurs, so the traced outline comes out smooth. */
function soften(m: Uint8Array): Float32Array {
  let a = Float32Array.from(m);
  const b = new Float32Array(N * N), r = 2, span = 2 * r + 1;
  for (let pass = 0; pass < 2; pass++) {
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      let s = 0;
      for (let k = -r; k <= r; k++) s += a[y * N + Math.min(N - 1, Math.max(0, x + k))];
      b[y * N + x] = s / span;
    }
    const c = new Float32Array(N * N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      let s = 0;
      for (let k = -r; k <= r; k++) s += b[Math.min(N - 1, Math.max(0, y + k)) * N + x];
      c[y * N + x] = s / span;
    }
    a = c;
  }
  return a;
}

/** Marching squares: closed loops where the field crosses 0.5, in mm. */
function trace(f: Float32Array): Pt[][] {
  const iso = 0.5;
  const next = new Map<number, number>();
  // Edge keys: 2*(y*N+x) for the edge to the right of (x, y), +1 for the edge below.
  const hk = (x: number, y: number) => 2 * (y * N + x), vk = (x: number, y: number) => 2 * (y * N + x) + 1;
  for (let y = 0; y < N - 1; y++) for (let x = 0; x < N - 1; x++) {
    const a = f[y * N + x], b = f[y * N + x + 1], c = f[(y + 1) * N + x + 1], d = f[(y + 1) * N + x];
    const ia = a > iso, ib = b > iso, ic = c > iso, id = d > iso;
    if (ia === ib && ib === ic && ic === id) continue;
    // Walk the cell's sides clockwise (y runs down): top, right, bottom, left.
    const sides: [number, boolean, boolean][] = [
      [hk(x, y), ia, ib], [vk(x + 1, y), ib, ic], [hk(x, y + 1), ic, id], [vk(x, y), id, ia],
    ];
    const cross: { key: number; exit: boolean }[] = [];
    for (const [key, from, to] of sides) if (from !== to) cross.push({ key, exit: from });
    // In a saddle, the centre decides whether the inside corners join.
    const joined = cross.length === 4 && (a + b + c + d) / 4 > iso;
    for (let i = 0; i < cross.length; i++) {
      if (!cross[i].exit) continue;
      const n = cross.length;
      const entry = joined ? cross[(i + 1) % n] : cross[(i - 1 + n) % n];
      next.set(cross[i].key, entry.key);
    }
  }
  const point = (key: number): Pt => {
    const cell = key >> 1, x = cell % N, y = (cell - x) / N;
    const [x1, y1] = key & 1 ? [x, y + 1] : [x + 1, y];
    const v0 = f[y * N + x], v1 = f[y1 * N + x1];
    const t = (iso - v0) / (v1 - v0);
    return toMm(x + (x1 - x) * t, y + (y1 - y) * t);
  };
  const loops: Pt[][] = [];
  for (const start of [...next.keys()]) {
    if (!next.has(start)) continue;
    const loop: Pt[] = [];
    let key = start;
    while (next.has(key)) {
      const to = next.get(key) as number;
      next.delete(key);
      const p = point(key), last = loop[loop.length - 1];
      if (!last || Math.hypot(p[0] - last[0], p[1] - last[1]) > 0.18) loop.push(p);
      key = to;
    }
    if (loop.length > 8) loops.push(relax(loop));
  }
  return loops;
}

const signedArea = (l: Pt[]) => l.reduce((s, p, i) => { const q = l[(i + 1) % l.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;
const perimeter = (l: Pt[]) => l.reduce((s, p, i) => { const q = l[(i + 1) % l.length]; return s + Math.hypot(q[0] - p[0], q[1] - p[1]); }, 0);

/** Scale loops so the longer side is SIZE mm, centred on 0. */
function normalise(loops: Pt[][]): Pt[][] {
  const all = loops.flat();
  const xs = all.map(p => p[0]), ys = all.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const k = SIZE / Math.max(x1 - x0, y1 - y0);
  return loops.map(l => l.map(([x, y]) => [(x - (x0 + x1) / 2) * k, (y - (y0 + y1) / 2) * k] as Pt));
}

const centroidOf = (l: Pt[]): Pt => [l.reduce((t, p) => t + p[0], 0) / l.length, l.reduce((t, p) => t + p[1], 0) / l.length];

/** Ease out the last stair-steps of the raster in a traced loop. */
const relax = (l: Pt[]): Pt[] => {
  let cur = l;
  for (let pass = 0; pass < 2; pass++) cur = cur.map((p, i) => {
    const a = cur[(i - 1 + cur.length) % cur.length], b = cur[(i + 1) % cur.length];
    return [(a[0] + 2 * p[0] + b[0]) / 4, (a[1] + 2 * p[1] + b[1]) / 4] as Pt;
  });
  return cur;
};

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

// ---------------------------------------------------------------------------
// The cleanup itself.

function fitOf(loops: Pt[][]): Fit {
  const all = loops.flat();
  const xs = all.map(p => p[0]), ys = all.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, k: SIZE / Math.max(x1 - x0, y1 - y0, 1) };
}
const padToMm = (f: Fit, [x, y]: Pt): Pt => [(x - f.cx) * f.k, (f.cy - y) * f.k];
const mmToPad = (f: Fit, [x, y]: Pt): Pt => [f.cx + x / f.k, f.cy - y / f.k];

function makeCharm(from: Pt[][]): Made | { error: string } {
  const all = from.flat();
  if (all.length < 8) return { error: "Draw a closed outline first." };
  const fit = fitOf(from);
  if (SIZE / fit.k < 60) return { error: "That's very small. Draw it a bit bigger." };
  let s = fill(from.map(l => l.map(p => padToMm(fit, p))));
  const filled = s.reduce((n, v) => n + v, 0);
  if (filled * CELL * CELL < 0.1 * SIZE * SIZE) return { error: "That reads as a line. Draw a closed shape." };
  const marks: Pt[] = [];

  // 1. Gaps and inside corners narrower than the rule: the plaster can't hold them.
  const bg = s.map(v => 1 - v);
  const bgOpen = open(bg);
  const slots = bg.map((v, i) => (v && !bgOpen[i] ? 1 : 0));
  let gaps = 0;
  for (const p of pieces(slots)) if (p.cells.length >= SIG) { gaps++; marks.push(centre(p.cells)); }
  s = s.map((v, i) => v | slots[i]);

  // 2. Parts thinner than the rule would burn out: thicken them along their
  //    middle, so a thin neck becomes 0.8 mm rather than a lump.
  const sOpen = open(s);
  const thin = s.map((v, i) => (v && !sOpen[i] ? 1 : 0));
  const d = dist2(s, 0);
  const ridge = new Uint8Array(N * N);
  let thins = 0;
  for (const p of pieces(thin)) {
    if (p.cells.length < SIG) continue;
    thins++;
    marks.push(centre(p.cells));
    for (const c of p.cells) {
      const x = c % N;
      if ((x === 0 || d[c] >= d[c - 1]) && (x === N - 1 || d[c] >= d[c + 1]) && d[c] >= d[c - N] && d[c] >= d[c + N]) ridge[c] = 1;
    }
  }
  if (thins) { const grown = dilate(ridge); s = s.map((v, i) => v | grown[i]); }

  // 3. One piece of metal: anything loose is dropped.
  const solid = pieces(s).sort((a, b) => b.cells.length - a.cells.length);
  let loose = 0;
  for (const p of solid.slice(1)) {
    if (p.cells.length >= SIG) { loose++; marks.push(centre(p.cells)); }
    for (const c of p.cells) s[c] = 0;
  }

  // 4. Holes too small to keep open are closed.
  let holes = 0;
  const holeCells = (Math.PI * (MIN_HOLE / 2) ** 2) / (CELL * CELL);
  for (const p of pieces(s.map(v => 1 - v))) {
    if (p.edge || p.cells.length >= holeCells) continue;
    if (p.cells.length >= SIG) { holes++; marks.push(centre(p.cells)); }
    for (const c of p.cells) s[c] = 1;
  }

  // Trace it back to a smooth outline.
  const loops = trace(soften(s)).sort((a, b) => Math.abs(signedArea(b)) - Math.abs(signedArea(a)));
  const outer = loops[0];
  if (!outer) return { error: "That one didn't trace. Try a simpler shape." };
  const sign = Math.sign(signedArea(outer));
  const inner = loops.slice(1).filter(l => Math.sign(signedArea(l)) !== sign);
  const area = Math.abs(signedArea(outer)) - inner.reduce((t, l) => t + Math.abs(signedArea(l)), 0);
  const edge = perimeter(outer) + inner.reduce((t, l) => t + perimeter(l), 0);

  // The jump ring sits on the highest point near the middle.
  let sx = 0, count = 0;
  for (let i = 0; i < N * N; i++) if (s[i]) { sx += i % N; count++; }
  const mid = Math.round(sx / count), reach = Math.round((RING_R * 0.6) / CELL);
  let top = N;
  for (let x = mid - reach; x <= mid + reach; x++) for (let y = 0; y < top; y++) if (s[y * N + x]) { top = y; break; }
  const topY = HALF - top * CELL;
  const bail: Pt = [toMm(mid, 0)[0], topY + RING_R - RING_WIRE + 0.1];

  const xs = outer.map(p => p[0]), ys = outer.map(p => p[1]);
  const minX = Math.min(...xs, bail[0] - RING_R - RING_WIRE), maxX = Math.max(...xs, bail[0] + RING_R + RING_WIRE);
  const minY = Math.min(...ys), maxY = Math.max(...ys, bail[1] + RING_R + RING_WIRE);

  // Volume of the extrusion: full thickness, less what the rounded edges take
  // off (a quarter ellipse along the whole edge, front and back), plus the
  // part of the ring that isn't buried in the body.
  const body = area * THICK - 2 * edge * BEVEL_S * BEVEL_T * (1 - Math.PI / 4);
  const ring = 2 * Math.PI * Math.PI * RING_R * RING_WIRE * RING_WIRE * 0.8;

  const fixes = [
    thins && `thickened ${plural(thins, "thin spot", "thin spots")} to ${MIN_FEATURE} mm`,
    gaps && `filled ${plural(gaps, "gap", "gaps")} under ${MIN_FEATURE} mm`,
    holes && `closed ${plural(holes, "hole", "holes")} under ${MIN_HOLE} mm`,
    loose && `dropped ${plural(loose, "loose piece", "loose pieces")}`,
  ].filter(Boolean) as string[];
  const list = fixes.length > 1 ? `${fixes.slice(0, -1).join(", ")} and ${fixes[fixes.length - 1]}` : fixes[0];
  const note = list ? `${list[0].toUpperCase()}${list.slice(1)}.` : `Nothing under ${MIN_FEATURE} mm, so nothing to fix.`;

  return {
    fit,
    from,
    charm: { outer, holes: inner, bail, width: maxX - minX, height: maxY - minY, volume: body + ring, note, marks },
  };
}

// ---------------------------------------------------------------------------
// Drawing: join the ends, even out the spacing, smooth the wobble.

function smoothLoop(pts: Pt[]): Pt[] {
  const len = perimeter(pts), step = Math.max(4, len / 220);
  const out: Pt[] = [];
  let carry = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], seg = Math.hypot(b[0] - a[0], b[1] - a[1]);
    let t = carry;
    while (t < seg) { out.push([a[0] + ((b[0] - a[0]) * t) / seg, a[1] + ((b[1] - a[1]) * t) / seg]); t += step; }
    carry = t - seg;
  }
  let cur = out;
  for (let pass = 0; pass < 3; pass++) {
    cur = cur.map((_, i) => {
      let x = 0, y = 0;
      for (let k = -2; k <= 2; k++) { const p = cur[(i + k + cur.length) % cur.length]; x += p[0]; y += p[1]; }
      return [x / 5, y / 5] as Pt;
    });
  }
  return cur;
}

// The sample outlines, in pad units, as if drawn at the middle of the pad.
const showFit: Fit = { cx: W / 2, cy: H / 2, k: SIZE / (0.7 * H) };
const sampleCache: Partial<Record<SampleId, Pt[][]>> = {};

function sample(id: SampleId): Pt[][] {
  const cached = sampleCache[id];
  if (cached) return cached;
  let loops: Pt[][];
  if (id === "heart") {
    loops = [Array.from({ length: 160 }, (_, i) => {
      const t = (i / 160) * Math.PI * 2;
      return [16 * Math.sin(t) ** 3, 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)] as Pt;
    })];
  } else if (id === "star") {
    // Sharp points on purpose: their tips are thinner than the rule.
    loops = [Array.from({ length: 10 }, (_, i) => {
      const a = Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 0.42 : 1;
      return [Math.cos(a) * r, Math.sin(a) * r] as Pt;
    })];
  } else {
    // Teddy, the poodle from the first charm, face on: a round head, a
    // topknot, long ears and a muzzle, with eyes and a nose cut through.
    const inEllipse = (x: number, y: number, cx: number, cy: number, rx: number, ry: number, tilt = 0) => {
      const c = Math.cos(tilt), s = Math.sin(tilt), dx = x - cx, dy = y - cy;
      const u = dx * c + dy * s, v = -dx * s + dy * c;
      return (u / rx) ** 2 + (v / ry) ** 2 <= 1;
    };
    const m = new Uint8Array(N * N);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const [mx, my] = toMm(i, j), x = mx / 7.2, y = my / 7.2;
      const solid =
        inEllipse(x, y, 0, 0.05, 0.78, 0.78) ||
        inEllipse(x, y, -0.42, 0.68, 0.36, 0.36) || inEllipse(x, y, 0, 0.84, 0.4, 0.4) || inEllipse(x, y, 0.42, 0.68, 0.36, 0.36) ||
        inEllipse(x, y, -0.8, -0.28, 0.34, 0.7, -0.2) || inEllipse(x, y, 0.8, -0.28, 0.34, 0.7, 0.2) ||
        inEllipse(x, y, 0, -0.6, 0.5, 0.38);
      const cut = inEllipse(x, y, -0.3, 0.1, 0.12, 0.12) || inEllipse(x, y, 0.3, 0.1, 0.12, 0.12) || inEllipse(x, y, 0, -0.42, 0.13, 0.1);
      m[j * N + i] = solid && !cut ? 1 : 0;
    }
    loops = trace(soften(m));
  }
  const pad = normalise(loops).map(l => l.map(p => mmToPad(showFit, p)));
  sampleCache[id] = pad;
  return pad;
}

const pathOf = (loops: Pt[][]) => loops.map(l => `M${l.map(p => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join("L")}Z`).join("");

// ---------------------------------------------------------------------------
// The 3D charm: plain three.js, imported on demand.

type Viewer = {
  setCharm: (c: Charm) => void;
  setPiece: (id: PieceId) => Promise<boolean>;
  setMetal: (m: Metal) => void;
  setActive: (on: boolean) => void;
  dispose: () => void;
};

async function createViewer(canvas: HTMLCanvasElement, reduce: boolean, onPainted: () => void): Promise<Viewer> {
  const [THREE, { RoomEnvironment }, { OrbitControls }, { mergeVertices }, { MeshoptDecoder }] = await Promise.all([
    import("three"),
    import("three/examples/jsm/environments/RoomEnvironment.js"),
    import("three/examples/jsm/controls/OrbitControls.js"),
    import("three/examples/jsm/utils/BufferGeometryUtils.js"),
    import("three/examples/jsm/libs/meshopt_decoder.module.js"),
  ]);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.NeutralToneMapping;
  const scene = new THREE.Scene();
  // A small procedural room to reflect, instead of downloading an HDR.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const env = pmrem.fromScene(room, 0.03).texture;
  room.dispose();
  pmrem.dispose();
  scene.environment = env;
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(-4, 6, 8);
  scene.add(key);

  const camera = new THREE.PerspectiveCamera(22, W / H, 1, 400);
  const material = new THREE.MeshPhysicalMaterial({ metalness: 1, roughness: 0.2 });
  const holder = new THREE.Group();
  scene.add(holder);
  let meshes: InstanceType<typeof THREE.Mesh>[] = [];
  let showing = 0; // bumps on every change, so a slow download can't land late

  /** A sculpted piece: one meshoptimizer-encoded closed mesh, bail included. */
  const decodePiece = async (id: PieceId) => {
    const info: Piece = pieceData[id];
    const [buf] = await Promise.all([
      fetch(`/demos/ai-jewelry/${id}.bin`).then(r => { if (!r.ok) throw new Error(r.statusText); return r.arrayBuffer(); }),
      MeshoptDecoder.ready,
    ]);
    const bytes = new Uint8Array(buf);
    const q = new Uint16Array(info.vertices * 4), idx = new Uint32Array(info.triangles * 3);
    MeshoptDecoder.decodeVertexBuffer(new Uint8Array(q.buffer), info.vertices, 8, bytes.subarray(0, info.vertexBytes));
    MeshoptDecoder.decodeIndexBuffer(new Uint8Array(idx.buffer), idx.length, 4, bytes.subarray(info.vertexBytes, info.vertexBytes + info.indexBytes));
    const pos = new Float32Array(info.vertices * 3);
    for (let v = 0; v < info.vertices; v++) for (let a = 0; a < 3; a++) {
      pos[v * 3 + a] = info.min[a] + (q[v * 4 + a] / 65535) * (info.max[a] - info.min[a]);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setIndex(new THREE.BufferAttribute(info.vertices < 65536 ? Uint16Array.from(idx) : idx, 1));
    geo.computeVertexNormals();
    return geo;
  };
  const pieceGeometry = new Map<PieceId, ReturnType<typeof decodePiece>>();
  const loadPiece = (id: PieceId) => {
    let p = pieceGeometry.get(id);
    if (p) return p;
    p = decodePiece(id);
    p.catch(() => pieceGeometry.delete(id));
    pieceGeometry.set(id, p);
    return p;
  };
  const clear = () => {
    for (const m of meshes) {
      holder.remove(m);
      // Sculpted pieces stay cached; a drawn charm's geometry is its own.
      if (!m.userData.piece) m.geometry.dispose();
    }
    meshes = [];
  };

  const controls = new OrbitControls(camera, canvas);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minPolarAngle = Math.PI * 0.32;
  controls.maxPolarAngle = Math.PI * 0.68;
  controls.autoRotate = !reduce;
  controls.autoRotateSpeed = 2.4; // one turn in 25 s
  // Leave vertical swipes to the page on phones; drag sideways to turn it.
  canvas.style.touchAction = "pan-y";

  const fitCamera = (w: number, h: number) => {
    const t = Math.tan(((camera.fov / 2) * Math.PI) / 180);
    const dist = Math.max(h / 2 / t, w / 2 / (t * camera.aspect)) / 0.74;
    const az = 0.5, el = 0.1;
    camera.position.set(Math.sin(az) * Math.cos(el) * dist, Math.sin(el) * dist, Math.cos(az) * Math.cos(el) * dist);
    controls.target.set(0, 0, 0);
    controls.update();
  };

  let raf = 0, last = 0, visible = false, active = true, painted = false, size: Pt = [0, 0];
  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    controls.update(dt);
    renderer.render(scene, camera);
    if (!painted && meshes.length) { painted = true; onPainted(); }
  };
  const sync = () => {
    const run = visible && active && document.visibilityState === "visible";
    if (run && !raf) { last = 0; raf = requestAnimationFrame(frame); }
    if (!run && raf) { cancelAnimationFrame(raf); raf = 0; }
  };
  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h || (w === size[0] && h === size[1])) return;
    size = [w, h];
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); });
  io.observe(canvas);
  document.addEventListener("visibilitychange", sync);

  return {
    setCharm(c) {
      showing++;
      clear();
      const shape = new THREE.Shape(c.outer.map(([x, y]) => new THREE.Vector2(x, y)));
      shape.holes = c.holes.map(h => new THREE.Path(h.map(([x, y]) => new THREE.Vector2(x, y))));
      const extruded = new THREE.ExtrudeGeometry(shape, {
        depth: DEPTH, bevelEnabled: true, bevelThickness: BEVEL_T, bevelSize: BEVEL_S, bevelOffset: -BEVEL_S, bevelSegments: 5, curveSegments: 1, steps: 1,
      });
      extruded.translate(0, 0, -DEPTH / 2);
      // One smooth surface from face to edge: weld the seams, then shade.
      extruded.deleteAttribute("uv");
      extruded.deleteAttribute("normal");
      const body = mergeVertices(extruded, 1e-4);
      extruded.dispose();
      body.computeVertexNormals();
      // The faces have no inner vertices, so averaged normals streak across
      // their long triangles. Give them a normal that leans out a little
      // towards the edge instead: it is linear in x and y, so it interpolates
      // exactly, and reads as a softly domed, polished face.
      const [mx, my] = centroidOf(c.outer);
      const pos = body.getAttribute("position"), nor = body.getAttribute("normal");
      const face = DEPTH / 2 + BEVEL_T - 1e-4;
      for (let i = 0; i < pos.count; i++) {
        const z = pos.getZ(i);
        if (Math.abs(z) < face) continue;
        const n = new THREE.Vector3((pos.getX(i) - mx) * 0.018, (pos.getY(i) - my) * 0.018, Math.sign(z)).normalize();
        nor.setXYZ(i, n.x, n.y, n.z);
      }
      const ring = new THREE.TorusGeometry(RING_R, RING_WIRE, 20, 72);
      ring.translate(c.bail[0], c.bail[1], 0);
      meshes = [new THREE.Mesh(body, material), new THREE.Mesh(ring, material)];
      const xs = c.outer.map(p => p[0]), ys = c.outer.map(p => p[1]);
      const minX = Math.min(...xs, c.bail[0] - RING_R - RING_WIRE), maxX = Math.max(...xs, c.bail[0] + RING_R + RING_WIRE);
      const minY = Math.min(...ys), maxY = c.bail[1] + RING_R + RING_WIRE;
      holder.position.set(-(minX + maxX) / 2, -(minY + maxY) / 2, 0);
      for (const m of meshes) holder.add(m);
      fitCamera(maxX - minX, maxY - minY);
      if (!raf) renderer.render(scene, camera);
    },
    async setPiece(id) {
      const token = ++showing;
      const geo = await loadPiece(id);
      if (token !== showing) return false;
      clear();
      const mesh = new THREE.Mesh(geo, material);
      mesh.userData.piece = id;
      meshes = [mesh];
      holder.position.set(0, 0, 0);
      holder.add(mesh);
      // It turns about its bail, so frame about as wide as it gets as it turns.
      const { min, max } = pieceData[id];
      const reach = Math.hypot(Math.max(-min[0], max[0]), Math.max(-min[2], max[2]));
      fitCamera(1.7 * reach, max[1] - min[1]);
      if (!raf) renderer.render(scene, camera);
      // Fetch the other pieces now, so switching is instant.
      for (const other of PIECES) if (other !== id) loadPiece(other).catch(() => {});
      return true;
    },
    setMetal(m) {
      material.color.setRGB(...m.f0);
      material.roughness = m.roughness;
      if (!raf) renderer.render(scene, camera);
    },
    setActive(on) { active = on; sync(); },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      controls.dispose();
      for (const m of meshes) if (!m.userData.piece) m.geometry.dispose();
      for (const p of pieceGeometry.values()) p.then(geo => geo.dispose(), () => {});
      material.dispose();
      env.dispose();
      renderer.dispose();
    },
  };
}

// ---------------------------------------------------------------------------

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function JewelryCharm() {
  // It opens on the sculpted dog in silver: its still and numbers are there
  // before any script runs. A drawn charm only exists once someone makes one.
  const [phase, setPhase] = useState<"piece" | "charm" | "draw" | "making">("piece");
  const [piece, setPiece] = useState<PieceId>("dog");
  const [shown, setShown] = useState<string | null>(null); // what the 3D is showing
  const [made, setMade] = useState<Made | null>(null);
  const [metal, setMetal] = useState<MetalId>("silver");
  const [loops, setLoops] = useState<Pt[][]>([]);
  const [picked, setPicked] = useState<SampleId | null>(null);
  const [stroke, setStroke] = useState<Pt[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [near, setNear] = useState(false);
  const [live, setLive] = useState(false);
  const [failed, setFailed] = useState(false);
  const [waited, setWaited] = useState(false);
  const [ready, setReady] = useState(false);

  const figureRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SVGSVGElement>(null);
  const viewer = useRef<Viewer | null>(null);
  const drawing = useRef<Pt[] | null>(null);
  const latest = useRef(metal);
  useEffect(() => { latest.current = metal; }, [metal]);

  // Start loading the 3D when the demo comes near the screen.
  useEffect(() => {
    const el = figureRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setNear(true); io.disconnect(); } }, { rootMargin: "400px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!near || !canvas) return;
    let gone = false, v: Viewer | null = null;
    createViewer(canvas, reduced(), () => { if (!gone) setLive(true); })
      .then(created => {
        if (gone) { created.dispose(); return; }
        v = created;
        viewer.current = created;
        created.setMetal(METALS.find(x => x.id === latest.current) as Metal);
        setReady(true);
      })
      .catch(() => { if (!gone) setFailed(true); });
    return () => { gone = true; v?.dispose(); viewer.current = null; };
  }, [near]);

  useEffect(() => { viewer.current?.setMetal(METALS.find(x => x.id === metal) as Metal); }, [metal]);

  // Put the chosen piece, or the charm just made, in the 3D.
  const target = phase === "piece" ? piece : phase === "draw" ? null : "charm";
  useEffect(() => {
    const v = viewer.current;
    if (!ready || !v || !target) return;
    let gone = false;
    if (target === "charm") {
      if (!made) return;
      v.setCharm(made.charm);
      queueMicrotask(() => { if (!gone) setShown("charm"); });
    } else {
      v.setPiece(target).then(ok => { if (ok && !gone) setShown(target); }, () => { if (!gone) setFailed(true); });
    }
    return () => { gone = true; };
  }, [ready, target, made]);

  // After Make it, the cleaned outline shows on the drawing for a moment,
  // then the metal takes over once it's ready.
  const mode = phase === "making" && waited && (live || failed) ? "charm" : phase;
  useEffect(() => {
    if (phase !== "making") return;
    const t = window.setTimeout(() => setWaited(true), reduced() ? 0 : 1400);
    return () => window.clearTimeout(t);
  }, [phase]);
  const turning = mode === "charm" || mode === "piece";
  useEffect(() => { viewer.current?.setActive(turning); }, [turning, ready]);

  const choose = (id: PieceId) => {
    setPiece(id);
    setMessage(null);
    setPhase("piece");
  };
  const make = () => {
    const result = makeCharm(loops);
    if ("error" in result) { setMessage(result.error); return; }
    setMade(result);
    setNear(true);
    setWaited(false);
    setPhase("making");
  };
  const drawAgain = () => {
    setLoops([]);
    setPicked(null);
    setMessage(null);
    setPhase("draw");
  };
  const pick = (id: SampleId) => {
    setLoops(sample(id));
    setPicked(id);
    setMessage(null);
  };

  const at = (e: { clientX: number; clientY: number }): Pt => {
    const r = (padRef.current as SVGSVGElement).getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H];
  };
  const onDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (mode !== "draw" || (e.pointerType === "mouse" && e.button !== 0)) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = [at(e)];
    setStroke(drawing.current);
    setPicked(null);
    setMessage(null);
  };
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const pts = drawing.current;
    if (!pts) return;
    const events = e.nativeEvent.getCoalescedEvents?.() ?? [e.nativeEvent];
    for (const ev of events.length ? events : [e.nativeEvent]) {
      const p = at(ev), q = pts[pts.length - 1];
      if (Math.hypot(p[0] - q[0], p[1] - q[1]) > 2) pts.push(p);
    }
    setStroke([...pts]);
  };
  const onUp = () => {
    const pts = drawing.current;
    drawing.current = null;
    setStroke(null);
    if (!pts) return;
    if (pts.length < 8 || perimeter(pts) < 120) { setMessage("Draw a closed outline, a bit bigger."); return; }
    setLoops([smoothLoop(pts)]);
  };

  const m = METALS.find(x => x.id === metal) as Metal;
  const c = made?.charm;
  const p = pieceData[piece];

  let readout: string;
  let label = "";
  if (mode === "piece") {
    const [w, h, d] = p.size;
    readout = `${w.toFixed(1)} × ${h.toFixed(1)} × ${d.toFixed(1)} mm with the bail, about ${((p.volume / 1000) * m.density).toFixed(1)} g of solid ${m.name}. ${p.note}`;
    label = `A ${m.name} ${p.label.toLowerCase()} charm, sculpted after Taiyaki's ${AFTER[piece]}, ${w.toFixed(0)} by ${h.toFixed(0)} mm with a bail at the top. Drag to turn it.`;
  } else if (mode === "charm" && c) {
    readout = `${c.width.toFixed(1)} × ${c.height.toFixed(1)} mm with the ring, ${THICK.toFixed(1)} mm thick, about ${((c.volume / 1000) * m.density).toFixed(1)} g in ${m.name}. ${c.note}`;
    label = `A ${m.name} charm from your drawing, ${c.width.toFixed(0)} by ${c.height.toFixed(0)} mm, with a jump ring at the top. Drag to turn it.`;
  } else if (mode === "making" && c) readout = c.note;
  else if (message) readout = message;
  else if (loops.length) readout = "The ends join and the line smooths out. Make it when it looks right.";
  else readout = "Draw one outline. The ends join up when you let go.";

  const onShow = (mode === "piece" && shown === piece) || (mode === "charm" && shown === "charm");

  return (
    <figure className="ui-try jc" ref={figureRef}>
      <div className="ui-media ui-try-stage jc-stage">
        {mode === "piece" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="jc-still" src={`/demos/ai-jewelry/${piece}-silver.webp`} alt="" width={W} height={H} data-gone={(onShow && !failed) || undefined} />
        )}
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={label}
          data-ready={onShow || undefined}
          data-piece={(mode === "piece" && onShow && piece) || undefined}
          data-hidden={!turning || undefined}
        />
        {mode === "charm" && failed && c && (
          <svg className="jc-pad jc-flat" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
            <path d={pathOf([c.outer, ...c.holes].map(l => l.map(p => mmToPad(showFit, p))))} />
          </svg>
        )}
        {(mode === "draw" || mode === "making") && (
          <svg
            ref={padRef}
            className="jc-pad"
            viewBox={`0 0 ${W} ${H}`}
            data-making={mode === "making" || undefined}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            aria-hidden="true"
          >
            {mode === "draw" && !stroke && loops.length > 0 && <path d={pathOf(loops)} />}
            {stroke && <polyline points={stroke.map(p => p.join(",")).join(" ")} />}
            {mode === "making" && made && c && (
              <>
                <path className="jc-was" d={pathOf(made.from)} />
                <path d={pathOf([c.outer, ...c.holes].map(l => l.map(p => mmToPad(made.fit, p))))} />
                {c.marks.map((p, i) => { const [x, y] = mmToPad(made.fit, p); return <circle key={i} cx={x} cy={y} r={22} />; })}
              </>
            )}
          </svg>
        )}
        {mode === "draw" && !stroke && loops.length === 0 && <p className="jc-hint">Draw a closed shape here</p>}
      </div>
      <div className="ui-try-controls">
        {mode === "draw" ? (
          <>
            <div className="ui-try-row" role="group" aria-label="Shape">
              {SAMPLES.map(s => (
                <button key={s.id} type="button" className="ui-try-pill" aria-pressed={picked === s.id} onClick={() => pick(s.id)}>{s.label}</button>
              ))}
            </div>
            <div className="ui-try-row">
              <button type="button" className="ui-try-pill" onClick={() => { setMessage(null); setPhase("piece"); }}>Back</button>
              <button type="button" className="ui-try-pill" disabled={loops.length === 0} onClick={make}>Make it</button>
            </div>
          </>
        ) : (
          <>
            <div className="ui-try-row" role="group" aria-label="Piece">
              {PIECES.map(id => (
                <button key={id} type="button" className="ui-try-pill" aria-pressed={mode === "piece" && piece === id} disabled={mode === "making"} onClick={() => choose(id)}>{pieceData[id].label}</button>
              ))}
              <button type="button" className="ui-try-pill" aria-pressed={mode !== "piece"} disabled={mode === "making"} onClick={drawAgain}>Draw your own</button>
            </div>
            <div className="ui-try-row" role="group" aria-label="Metal">
              {METALS.map(x => (
                <button key={x.id} type="button" className="ui-try-pill" aria-pressed={metal === x.id} disabled={mode === "making"} onClick={() => setMetal(x.id)}>{x.label}</button>
              ))}
            </div>
          </>
        )}
      </div>
      <p className="jc-readout" aria-live="polite">{readout}</p>
      <figcaption className="ui-try-caption">Try it: turn a piece, try each metal, or draw your own. The 3D pieces are simple sculpts after real Taiyaki charms, cleaned up by the same casting rules. The AI that turns photos into 3D is not here.</figcaption>
    </figure>
  );
}
