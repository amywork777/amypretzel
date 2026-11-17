"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import type * as THREE_NS from "three";
import "./folding-yoga-mat.css";

/* The folding yoga mat, to fold yourself: its twenty real panels, at their
   real 4.5 mm thickness with the 22 mm green hinges between them, going
   through the fold sequence from the CAD. Drag to turn it.

   Where every number comes from (the VZ-ORIGAMI-01 project):
   - Crease pattern: cad/vz-origami-cp-01.dxf.py, CP-01 rev4. A 1524 x 609.6 mm
     mat in five 304.8 mm columns, one long centre crease, four cross creases
     and one diagonal per square, giving triangles P1 to P20.
   - Panels: the rev D prototype CAD (uniform 22 mm hinges). Every triangle
     edge is set back 11 mm, so neighbours show 22 mm of green web and the
     outside edge an 11 mm border. 4.5 mm = 1.85 mm of panel each side of a
     0.8 mm green web.
   - Fold: the square-fold study from 14 Sep 2026 (engineering/
     square_fold_study.py): in half lengthwise (H), then back and forth at
     the four cross creases (T1 to T4). Each fold turns the moving packet
     about an axis on the face it lands on, and slides it so the outer web
     keeps its exact 22 mm length (straight, quarter-round, straight). That
     study checked every 2 degrees and found no panel touching another; this
     page checks again live, panel against panel. Its T4 moves the whole
     stack onto the last square; here the last square moves instead (the
     same relative motion, as the rev D CAD shows it), so the stack stays put.
   - Triangle folds: the three options in the hardcore-cases fold study
     (docs/three-connected-fold-options.md: twin pinch, two sweeps,
     alternating zipper), each end rolling in to the centre square along its
     diagonals and cross creases. Two changes from the study, both because it
     is zero-thickness: it folds in half last, which on a joined mat tears
     the long hinge (vz-origami-01's 14 Sep audit), so here that comes first,
     as on the sample; and it leaves each crease's direction open, so here
     diagonals tuck under and cross creases roll over, the alternation that
     keeps every hinge wrap within 22 mm (CP-01's square-fold directions
     would need up to 64 mm). The moves use the square study's method.
   - Paper hinges: the same folds done the way paper folds, about the
     crease lines with no gap. Thick panels can't do that, and the live check
     marks every panel that passes through another.

   Simplified: in the square fold the diagonals stay flat (on the real mat
   they flex to help it collapse, which no model here solves), and the green
   web between panels is drawn as a smooth bend rather than solved. */

// ---------------------------------------------------------------- the mat

const SQ = 304.8; // square pitch = half the width
const COLS = 5;
const MAT_L = COLS * SQ; // 1524
const MAT_W = 2 * SQ; // 609.6
const T = 4.5; // flat thickness
const BUILD = 1.85; // panel build on each face of the web
const WEB = 0.8; // green web
const MID = T / 2; // web mid-plane

type Mode = "gaps" | "paper";
// Full green width between neighbouring panels. Paper hinges have none; the
// 2 mm is only so the crease still reads as a line.
const GAP: Record<Mode, number> = { gaps: 22, paper: 2 };

type V2 = [number, number];
type V3 = [number, number, number];

type Panel = { id: string; sq: number; tri: V2[] };
const sqIndex = (col: number, row: number) => col * 2 + row;

/** P1 to P20 exactly as CP-01's build_panels lays them out. */
const PANELS: Panel[] = (() => {
  const out: Panel[] = [];
  for (let c = 0; c < COLS; c++) {
    const x0 = c * SQ, x1 = (c + 1) * SQ;
    const a: V2[] = c % 2 === 0 ? [[x0, MAT_W], [x1, MAT_W], [x1, SQ]] : [[x0, SQ], [x0, MAT_W], [x1, MAT_W]];
    const b: V2[] = c % 2 === 0 ? [[x0, MAT_W], [x1, SQ], [x0, SQ]] : [[x0, SQ], [x1, MAT_W], [x1, SQ]];
    const mirror = (t: V2[]) => t.map(([x, y]) => [x, MAT_W - y] as V2);
    out.push({ id: `P${4 * c + 1}`, sq: sqIndex(c, 1), tri: a }, { id: `P${4 * c + 2}`, sq: sqIndex(c, 1), tri: b });
    out.push({ id: `P${4 * c + 3}`, sq: sqIndex(c, 0), tri: mirror(a) }, { id: `P${4 * c + 4}`, sq: sqIndex(c, 0), tri: mirror(b) });
  }
  return out;
})();

/** Edge i (tri[i] to tri[i + 1]) moved inward by d[i], as CP-01's
    offset_triangle does it with one d for all three. */
function inset(tri: V2[], d: number | number[]): V2[] {
  const [cx, cy] = centroid(tri);
  const lines = tri.map((a, i) => {
    const b = tri[(i + 1) % 3];
    const di = typeof d === "number" ? d : d[i];
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
    let nx = -dy / len, ny = dx / len;
    if ((cx - a[0]) * nx + (cy - a[1]) * ny < 0) { nx = -nx; ny = -ny; }
    return { p: [a[0] + nx * di, a[1] + ny * di] as V2, d: [dx, dy] as V2 };
  });
  return lines.map((l2, i) => {
    const l1 = lines[(i + 2) % 3];
    const det = l1.d[0] * l2.d[1] - l1.d[1] * l2.d[0];
    const t = ((l2.p[0] - l1.p[0]) * l2.d[1] - (l2.p[1] - l1.p[1]) * l2.d[0]) / det;
    return [l1.p[0] + t * l1.d[0], l1.p[1] + t * l1.d[1]] as V2;
  });
}

function centroid(t: V2[]): V2 {
  return [(t[0][0] + t[1][0] + t[2][0]) / 3, (t[0][1] + t[1][1] + t[2][1]) / 3];
}
const key = ([x, y]: V2) => `${x.toFixed(1)},${y.toFixed(1)}`;

/** Every crease two panels share: 5 along the centre, 8 across and 10
    diagonals. dir points across the crease, from panel a to panel b. */
type Crease = { a: number; b: number; ends: [V2, V2]; dir: V2 };
const CREASES: Crease[] = (() => {
  const out: Crease[] = [];
  PANELS.forEach((pa, a) => PANELS.forEach((pb, b) => {
    if (b <= a) return;
    const shared = pa.tri.filter(v => pb.tri.some(w => key(v) === key(w)));
    if (shared.length !== 2) return;
    const [e0, e1] = shared;
    const len = Math.hypot(e1[0] - e0[0], e1[1] - e0[1]);
    let dir: V2 = [-(e1[1] - e0[1]) / len, (e1[0] - e0[0]) / len];
    const ca = centroid(pa.tri);
    if ((ca[0] - e0[0]) * dir[0] + (ca[1] - e0[1]) * dir[1] > 0) dir = [-dir[0], -dir[1]];
    out.push({ a, b, ends: [e0, e1], dir });
  }));
  return out;
})();

/** How far each edge of panel i sits back from its line for the web: half
    the green on a crease, nothing on the mat's outside edge. */
function webInset(i: number, g: number): number[] {
  const tri = PANELS[i].tri;
  return tri.map((v, j) => {
    const w = key(tri[(j + 1) % 3]);
    return CREASES.some(c => (c.a === i || c.b === i) && c.ends.every(e => key(e) === key(v) || key(e) === w)) ? g / 2 : 0;
  });
}

// ------------------------------------------------------- rigid transforms

/** Row-major 3x4: rotation then translation. */
type M = number[];
const IDENTITY: M = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0];

function apply(m: M, p: V3): V3 {
  return [
    m[0] * p[0] + m[1] * p[1] + m[2] * p[2] + m[3],
    m[4] * p[0] + m[5] * p[1] + m[6] * p[2] + m[7],
    m[8] * p[0] + m[9] * p[1] + m[10] * p[2] + m[11],
  ];
}
const turn = (m: M, d: V3): V3 => [m[0] * d[0] + m[1] * d[1] + m[2] * d[2], m[4] * d[0] + m[5] * d[1] + m[6] * d[2], m[8] * d[0] + m[9] * d[1] + m[10] * d[2]];

/** a after b. */
function compose(a: M, b: M): M {
  const o: M = new Array(12);
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) {
      o[r * 4 + c] = a[r * 4] * b[c] + a[r * 4 + 1] * b[4 + c] + a[r * 4 + 2] * b[8 + c] + (c === 3 ? a[r * 4 + 3] : 0);
    }
  }
  return o;
}

function invert(m: M): M {
  const t: V3 = [m[3], m[7], m[11]];
  const r = [m[0], m[4], m[8], m[1], m[5], m[9], m[2], m[6], m[10]];
  return [
    r[0], r[1], r[2], -(r[0] * t[0] + r[1] * t[1] + r[2] * t[2]),
    r[3], r[4], r[5], -(r[3] * t[0] + r[4] * t[1] + r[5] * t[2]),
    r[6], r[7], r[8], -(r[6] * t[0] + r[7] * t[1] + r[8] * t[2]),
  ];
}

/** Rotation by angle about the line through origin along unit axis u (Rodrigues). */
function rotation(u: V3, angle: number, origin: V3): M {
  const c = Math.cos(angle), s = Math.sin(angle), k = 1 - c;
  const [x, y, z] = u;
  const R = [
    c + x * x * k, x * y * k - z * s, x * z * k + y * s,
    y * x * k + z * s, c + y * y * k, y * z * k - x * s,
    z * x * k - y * s, z * y * k + x * s, c + z * z * k,
  ];
  const t = [0, 1, 2].map(i => origin[i] - (R[i * 3] * origin[0] + R[i * 3 + 1] * origin[1] + R[i * 3 + 2] * origin[2]));
  return [R[0], R[1], R[2], t[0], R[3], R[4], R[5], t[1], R[6], R[7], R[8], t[2]];
}

const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scale = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V3): V3 => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

// ------------------------------------------------------------ the folding

const ease = (t: number) => t * t * (3 - 2 * t);

/** The square fold: where each of the ten squares is at fold progress s
    (0 flat, 5 folded). */
function squarePoses(s: number, mode: Mode): M[] {
  const g = GAP[mode];
  const out: M[] = Array.from({ length: 10 }, () => IDENTITY);
  for (let k = 0; k < 5; k++) {
    const f = Math.min(1, Math.max(0, s - k));
    if (f <= 0) break;
    const a = Math.PI * ease(f);
    const sign = k === 0 || k % 2 === 1 ? 1 : -1;
    const axis: V3 = k === 0 ? [1, 0, 0] : [0, 1, 0];
    const moves = (sq: number) => (k === 0 ? sq % 2 === 1 : Math.floor(sq / 2) < k);
    let step: M;
    if (mode === "paper") {
      // Paper: about the crease line itself, in the middle of the sheet.
      step = rotation(axis, sign * a, k === 0 ? [0, SQ, MID] : [k * SQ, 0, MID]);
    } else {
      // square_fold_study.audit: the axis sits on the face the packet lands
      // on, and the packet slides so the outer web path stays g long.
      let origin: V3, normal: V3, vertical: V3, radius: number, fixed: V3;
      if (k === 0) {
        origin = [0, SQ, T]; normal = [0, 1, 0]; vertical = [0, 0, 1]; radius = T / 2;
        fixed = [SQ / 2, SQ - g / 2, T / 2];
      } else {
        origin = [k * SQ, 0, k % 2 ? 2 * T : 0]; normal = [-1, 0, 0]; vertical = [0, 0, sign]; radius = 1.5 * T;
        fixed = [k * SQ + g / 2, SQ / 2, sign === 1 ? T / 2 : 1.5 * T];
      }
      const movingAnchor = add(fixed, scale(normal, g));
      const leg = Math.max(0, (g - radius * a) / 2);
      const target = add(add(fixed, scale(normal, leg * (1 + Math.cos(a)) + radius * Math.sin(a))), scale(vertical, radius * (1 - Math.cos(a)) + leg * Math.sin(a)));
      const rot = rotation(axis, sign * a, origin);
      const shift = sub(target, apply(rot, movingAnchor));
      step = rot.slice();
      step[3] += shift[0]; step[7] += shift[1]; step[11] += shift[2];
    }
    if (k === 4) {
      // The last square moves rather than the stack: same relative motion.
      const back = invert(step);
      out[8] = compose(back, out[8]);
      out[9] = compose(back, out[9]);
    } else {
      for (let i = 0; i < 10; i++) if (moves(i)) out[i] = compose(step, out[i]);
    }
  }
  return out;
}

/* The triangle folds: the three options in the hardcore-cases fold study
   (docs/three-connected-fold-options.md). Each end of the mat rolls in
   towards the centre square, one crease at a time, alternating diagonal
   and cross crease, until five triangles sit on each half of the centre
   square. The chains are make_connected_center_fold_animation.py's, one
   per layer once the mat is folded in half. */
export type Fold = "square" | "pinch" | "sweeps" | "zipper";
type TriFold = Exclude<Fold, "square">;
type Side = "left" | "right";

const panel = (id: string) => PANELS.findIndex(p => p.id === id);
const CHAINS: Record<Side, number[][]> = {
  left: [["P4", "P3", "P7", "P8", "P12"], ["P2", "P1", "P5", "P6", "P10"]].map(c => c.map(panel)),
  right: [["P19", "P20", "P16", "P15", "P11"], ["P17", "P18", "P14", "P13", "P9"]].map(c => c.map(panel)),
};
// The i-th crease in from each end: left D1 T1 D2 T2, right D5 T4 D4 T3.
type Ref = [Side, number];
const ORDERS: Record<TriFold, Ref[][]> = {
  pinch: [0, 1, 2, 3].map(i => [["left", i], ["right", i]]),
  sweeps: [...[0, 1, 2, 3].map((i): Ref[] => [["left", i]]), ...[0, 1, 2, 3].map((i): Ref[] => [["right", i]])],
  zipper: [0, 1, 2, 3].flatMap((i): Ref[][] => [[["left", i]], [["right", i]]]),
};
export const stepsOf = (fold: Fold) => (fold === "square" ? 5 : 1 + ORDERS[fold].length);

type Move = { moving: number[]; u: V3; sign: number; normal: V3; vertical: V3; r: number; fixed: V3; origin: V3 };

/** One crease turning a packet by angle a. With gaps, as the square-fold
    study does it: about an axis on the face it lands on, sliding so the
    outer web stays g long while it can (once r times a passes g, the web
    would have to stretch). Like paper: about the crease line. */
function moveMatrix(mv: Move, a: number, mode: Mode): M {
  if (mode === "paper") return rotation(mv.u, mv.sign * a, mv.origin);
  const g = GAP.gaps;
  const anchor = add(mv.fixed, scale(mv.normal, g));
  const leg = Math.max(0, (g - mv.r * a) / 2);
  const target = add(add(mv.fixed, scale(mv.normal, leg * (1 + Math.cos(a)) + mv.r * Math.sin(a))), scale(mv.vertical, mv.r * (1 - Math.cos(a)) + leg * Math.sin(a)));
  const m = rotation(mv.u, mv.sign * a, anchor);
  m[3] += target[0] - anchor[0]; m[7] += target[1] - anchor[1]; m[11] += target[2] - anchor[2];
  return m;
}

const bodyZ = (pose: M[], ids: number[]) => {
  let lo = Infinity, hi = -Infinity;
  for (const i of ids) for (const [x, y] of PANELS[i].tri) for (const z of [0, T]) {
    const w = apply(pose[i], [x, y, z])[2];
    lo = Math.min(lo, w); hi = Math.max(hi, w);
  }
  return [lo, hi];
};

/** Works out each crease's move from where the stack is when it starts. The
    study leaves which way each crease turns open; here diagonals tuck under
    and cross creases roll over, which keeps each crease's own panels next
    to the stack they land on, so no web wraps more than the square fold's
    worst: 21.2 of its 22 mm. */
function plan(fold: TriFold, mode: Mode): Move[][] {
  const g = GAP[mode];
  const sq = squarePoses(1, mode);
  const pose = PANELS.map(p => sq[p.sq]);
  return ORDERS[fold].map(step => {
    const moves = step.map(([side, i]): Move => {
      const plies = CHAINS[side];
      const moving = plies.flatMap(c => c.slice(0, i + 1));
      const [m0, s0] = [plies[0][i], plies[0][i + 1]]; // the bottom layer, still where it started
      const [c0, c1] = PANELS[m0].tri.filter(v => PANELS[s0].tri.some(w => key(v) === key(w)));
      const u = norm([c1[0] - c0[0], c1[1] - c0[1], 0]);
      const cm = centroid(PANELS[m0].tri);
      let normal: V3 = [-u[1], u[0], 0];
      if ((cm[0] - c0[0]) * normal[0] + (cm[1] - c0[1]) * normal[1] < 0) normal = scale(normal, -1);
      const under = i % 2 === 0;
      const vertical: V3 = [0, 0, under ? -1 : 1];
      const mv = bodyZ(pose, moving), st = bodyZ(pose, plies.map(c => c[i + 1]));
      const axisZ = under ? (st[0] + mv[0]) / 2 : (st[1] + mv[1]) / 2;
      // Each layer's crease web sits at that layer's mid-plane; the one
      // furthest from the axis wraps outside the other.
      const webs = plies.map(c => apply(pose[c[i]], [cm[0], cm[1], MID])[2]);
      const outer = webs.reduce((a, z) => (Math.abs(axisZ - z) > Math.abs(axisZ - a) ? z : a));
      const mid: V2 = [(c0[0] + c1[0]) / 2, (c0[1] + c1[1]) / 2];
      return {
        moving, u, normal, vertical,
        sign: dot(cross(u, normal), vertical) > 0 ? 1 : -1,
        r: Math.abs(axisZ - outer),
        fixed: [mid[0] - (normal[0] * g) / 2, mid[1] - (normal[1] * g) / 2, outer],
        origin: [c0[0], c0[1], MID],
      };
    });
    for (const mv of moves) {
      const m = moveMatrix(mv, Math.PI, mode);
      for (const i of mv.moving) pose[i] = compose(m, pose[i]);
    }
    return moves;
  });
}

const PLANS: Record<Mode, Record<TriFold, Move[][]>> = {
  gaps: { pinch: plan("pinch", "gaps"), sweeps: plan("sweeps", "gaps"), zipper: plan("zipper", "gaps") },
  paper: { pinch: plan("pinch", "paper"), sweeps: plan("sweeps", "paper"), zipper: plan("zipper", "paper") },
};

/** Where each of the twenty panels is at fold progress s. The triangle folds
    start with the square fold's first step: in half. */
function poses(s: number, mode: Mode, fold: Fold): M[] {
  const sq = squarePoses(fold === "square" ? s : Math.min(s, 1), mode);
  const out = PANELS.map(p => sq[p.sq]);
  if (fold === "square") return out;
  PLANS[mode][fold].forEach((step, k) => {
    const f = Math.min(1, Math.max(0, s - 1 - k));
    if (f <= 0) return;
    for (const mv of step) {
      const m = moveMatrix(mv, Math.PI * ease(f), mode);
      for (const i of mv.moving) out[i] = compose(m, out[i]);
    }
  });
  return out;
}

const STEP_TEXT: Record<Fold, string[]> = {
  square: [
    "the end square folds over the next",
    "the stack folds under the third",
    "and over the fourth",
    "the last square wraps under",
  ],
  pinch: [
    "both end triangles tuck under",
    "both packets roll over onto the next squares",
    "and tuck under along the next diagonals",
    "and roll over onto the centre square",
  ],
  sweeps: [
    "the left end triangle tucks under",
    "it rolls over onto the next square",
    "and tucks under along that square’s diagonal",
    "and rolls over onto the centre square",
    "now the right end triangle tucks under",
    "it rolls over onto the next square",
    "and tucks under along that square’s diagonal",
    "and rolls over onto the other half of the centre",
  ],
  zipper: [
    "the left end triangle tucks under",
    "the right end triangle tucks under",
    "the left packet rolls over onto the next square",
    "the right packet rolls over onto the next square",
    "the left packet tucks under along the next diagonal",
    "the right packet tucks under along the next diagonal",
    "the left packet rolls over onto the centre square",
    "the right packet rolls over onto its other half",
  ],
};
function stepText(s: number, mode: Mode, fold: Fold) {
  const n = stepsOf(fold);
  if (s <= 0) return "Flat: 1524 × 610 mm, 4.5 mm thick";
  if (s >= n) return mode === "gaps" ? "Folded: 305 mm square, 10 layers, 45 mm tall" : "Folded like paper: 10 layers in the same 4.5 mm";
  const k = Math.min(n - 1, Math.floor(s));
  return `Step ${k + 1} of ${n}: ${k === 0 ? "in half, long edge to long edge" : STEP_TEXT[fold][k - 1]}`;
}

// --------------------------------------------- panels passing through each other

type Prism = { pts: V3[]; axes: V3[]; edges: V3[] };

/** Each panel as a full-thickness prism in its own frame. */
function prisms(mode: Mode): Prism[] {
  return PANELS.map(p => {
    const t = inset(p.tri, GAP[mode] / 2);
    const pts: V3[] = [...t.map(([x, y]) => [x, y, 0] as V3), ...t.map(([x, y]) => [x, y, T] as V3)];
    const edges: V3[] = t.map((a, i) => { const b = t[(i + 1) % 3]; return norm([b[0] - a[0], b[1] - a[1], 0]); });
    const axes: V3[] = [[0, 0, 1], ...edges.map(e => [-e[1], e[0], 0] as V3)];
    return { pts, axes, edges: [...edges, [0, 0, 1] as V3] };
  });
}

const OVERLAP = 0.3; // mm: faces resting on each other don't count

function overlaps(a: Prism, b: Prism) {
  const axes = [...a.axes, ...b.axes];
  for (const ea of a.edges) for (const eb of b.edges) {
    const c = cross(ea, eb);
    if (Math.hypot(c[0], c[1], c[2]) > 1e-6) axes.push(norm(c));
  }
  for (const ax of axes) {
    let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
    for (const p of a.pts) { const v = dot(p, ax); if (v < a0) a0 = v; if (v > a1) a1 = v; }
    for (const p of b.pts) { const v = dot(p, ax); if (v < b0) b0 = v; if (v > b1) b1 = v; }
    if (Math.min(a1, b1) - Math.max(a0, b0) <= OVERLAP) return false;
  }
  return true;
}

/** Which panels pass through another panel. */
function collisions(local: Prism[], pose: M[]): boolean[] {
  const world: Prism[] = local.map((p, i) => {
    const m = pose[i];
    return { pts: p.pts.map(q => apply(m, q)), axes: p.axes.map(d => turn(m, d)), edges: p.edges.map(d => turn(m, d)) };
  });
  const box = world.map(w => {
    const lo: V3 = [Infinity, Infinity, Infinity], hi: V3 = [-Infinity, -Infinity, -Infinity];
    for (const p of w.pts) for (let i = 0; i < 3; i++) { lo[i] = Math.min(lo[i], p[i]); hi[i] = Math.max(hi[i], p[i]); }
    return { lo, hi };
  });
  const hit = world.map(() => false);
  for (let i = 0; i < world.length; i++) {
    for (let j = i + 1; j < world.length; j++) {
      const A = box[i], B = box[j];
      if (A.hi[0] - B.lo[0] <= OVERLAP || B.hi[0] - A.lo[0] <= OVERLAP || A.hi[1] - B.lo[1] <= OVERLAP || B.hi[1] - A.lo[1] <= OVERLAP || A.hi[2] - B.lo[2] <= OVERLAP || B.hi[2] - A.lo[2] <= OVERLAP) continue;
      if (overlaps(world[i], world[j])) { hit[i] = true; hit[j] = true; }
    }
  }
  return hit;
}

// ------------------------------------------------------------- the camera

// Three.js world: mat x stays x, mat z (up) is y, mat y is -z.
const toWorld = (p: V3): V3 => [p[0], p[2], -p[1]];
const FOV = 26; // vertical, degrees
const ASPECT = 16 / 9; // the stage is always 16:9
// From the far long side, as the photo above was taken, a little to one end.
const START_AZ = -0.32;
const START_EL = 0.5;

type View = { az: number; el: number };
type Frame = { target: V3; dist: number };

function basis({ az, el }: View) {
  const dir: V3 = [Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)];
  const f = scale(dir, -1);
  const r = norm(cross(f, [0, 1, 0]));
  const u = cross(r, f);
  return { dir, f, r, u };
}

/** The panels' corners in world space. */
function corners(pose: M[]): V3[] {
  const pts: V3[] = [];
  PANELS.forEach((p, i) => { for (const [x, y] of p.tri) for (const z of [0, T]) pts.push(toWorld(apply(pose[i], [x, y, z]))); });
  return pts;
}

/** Centre and distance that fit the points in the frame with a margin. */
function fit(pts: V3[], view: View, aspect: number, margin: number): Frame {
  const lo: V3 = [Infinity, Infinity, Infinity], hi: V3 = [-Infinity, -Infinity, -Infinity];
  for (const p of pts) for (let i = 0; i < 3; i++) { lo[i] = Math.min(lo[i], p[i]); hi[i] = Math.max(hi[i], p[i]); }
  const target: V3 = scale(add(lo, hi), 0.5);
  const { f, r, u } = basis(view);
  const ty = Math.tan((FOV * Math.PI) / 360) * margin, tx = ty * aspect;
  let dist = 0;
  for (const p of pts) {
    const q = sub(p, target);
    const z = dot(q, f);
    dist = Math.max(dist, Math.abs(dot(q, r)) / tx - z, Math.abs(dot(q, u)) / ty - z);
  }
  return { target, dist };
}

const FLAT_POSE = poses(0, "gaps", "square");
const FLAT_CORNERS = corners(FLAT_POSE);
const MARGIN = 0.88;
/** Folded, it is a fifth of the length, so it may come closer, but only so
    far, so the fold still reads as getting smaller. */
function frameFor(pose: M[], view: View, aspect: number): Frame {
  const now = fit(corners(pose), view, aspect, MARGIN);
  const flat = fit(FLAT_CORNERS, view, aspect, MARGIN);
  return { target: now.target, dist: Math.max(now.dist, flat.dist * 0.46) };
}

// --------------------------------------------------- colours of the real mat

// Sampled from the photo of the finished prototype above, then set so the lit
// render matches it: pale pink panels, a dark sage web.
const PINK = "#f2c4c6";
const GREEN = "#55665d";
const HIT = "#a8434d"; // a panel inside another panel
// The same two, as the lit render shows the flat top: for the still.
const LIT_PINK = "#f4c6c8";
const LIT_GREEN = "#56675e";

// ---------------------------------------------- the still, drawn on the server

const SVG_W = 1600, SVG_H = 900;

/** The flat mat at the starting view, drawn from the same geometry and camera
    as the 3D, so the canvas lands on it without a jump. */
const Still = memo(function Still() {
  const view: View = { az: START_AZ, el: START_EL };
  const { target, dist } = frameFor(FLAT_POSE, view, ASPECT);
  const { dir, f, r, u } = basis(view);
  const eye = add(target, scale(dir, dist));
  const ty = Math.tan((FOV * Math.PI) / 360);
  const project = (p: V3) => {
    const q = sub(toWorld(p), eye);
    const z = dot(q, f);
    return [((dot(q, r) / (z * ty * ASPECT)) + 1) * SVG_W / 2, (1 - dot(q, u) / (z * ty)) * SVG_H / 2, z];
  };
  const path = (pts: V3[]) => "M" + pts.map(p => project(p).slice(0, 2).map(v => v.toFixed(1)).join(" ")).join("L") + "Z";
  const webTop = BUILD + WEB;
  const web = path([[0, 0, webTop], [MAT_L, 0, webTop], [MAT_L, MAT_W, webTop], [0, MAT_W, webTop]]);
  const webEdge = path([[0, MAT_W, BUILD], [MAT_L, MAT_W, BUILD], [MAT_L, MAT_W, webTop], [0, MAT_W, webTop]]);
  const panels = PANELS.map(p => {
    const t = inset(p.tri, GAP.gaps / 2);
    const top = t.map(([x, y]) => [x, y, T] as V3);
    const sides = t.map((a, i) => {
      const b = t[(i + 1) % 3];
      const face: V3[] = [[a[0], a[1], webTop], [b[0], b[1], webTop], [b[0], b[1], T], [a[0], a[1], T]];
      // Seen if its outward normal faces the camera.
      const cx = (t[0][0] + t[1][0] + t[2][0]) / 3, cy = (t[0][1] + t[1][1] + t[2][1]) / 3;
      const mid: V3 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, T];
      const out = toWorld(norm([mid[0] - cx, mid[1] - cy, 0]));
      return dot(out, sub(eye, toWorld(mid))) > 0 ? path(face) : null;
    }).filter(Boolean) as string[];
    const depth = project([(t[0][0] + t[1][0] + t[2][0]) / 3, (t[0][1] + t[1][1] + t[2][1]) / 3, T])[2];
    return { id: p.id, top: path(top), sides, depth };
  }).sort((a, b) => b.depth - a.depth);
  return (
    <svg className="yoga-still" viewBox={`0 0 ${SVG_W} ${SVG_H}`} aria-hidden="true" focusable="false">
      <path d={webEdge} fill="#3e4c45" />
      <path d={web} fill={LIT_GREEN} />
      {panels.map(p => (
        <g key={p.id}>
          {p.sides.map((d, i) => <path key={i} d={d} fill="#c99fa1" />)}
          <path d={p.top} fill={LIT_PINK} />
        </g>
      ))}
    </svg>
  );
});

// -------------------------------------------------------------- the 3D scene

type Scene = { dispose: () => void; poke: () => void };
type SceneProps = {
  canvas: HTMLCanvasElement;
  read: () => { s: number; mode: Mode; fold: Fold; view: View };
  onReady: () => void;
  onHits: (n: number) => void;
};

async function makeScene({ canvas, read, onReady, onHits }: SceneProps): Promise<Scene> {
  const THREE = await import("three");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, ASPECT, 10, 20000);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8a8a, 1.95));
  const sun = new THREE.DirectionalLight(0xffffff, 1.4);
  sun.position.set(-500, 1600, -900);
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xffffff, 0.45);
  fill.position.set(900, 300, 1200);
  scene.add(fill);

  // Mat coordinates to three's: x, z up, -y.
  const toThree = new THREE.Matrix4().set(1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1);
  const tmp = new THREE.Matrix4();
  const place = (obj: THREE_NS.Object3D, m: M) => {
    tmp.set(m[0], m[1], m[2], m[3], m[4], m[5], m[6], m[7], m[8], m[9], m[10], m[11], 0, 0, 0, 1);
    obj.matrix.multiplyMatrices(toThree, tmp);
    obj.matrixWorldNeedsUpdate = true;
  };

  /** A straight prism over a convex outline, flat shaded. */
  const prism = (outline: V2[], z0: number, z1: number) => {
    let pts = outline;
    let area = 0;
    for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; area += a[0] * b[1] - b[0] * a[1]; }
    if (area < 0) pts = [...pts].reverse();
    const pos: number[] = [];
    const tri = (a: V3, b: V3, c: V3) => pos.push(...a, ...b, ...c);
    for (let i = 1; i < pts.length - 1; i++) {
      tri([pts[0][0], pts[0][1], z1], [pts[i][0], pts[i][1], z1], [pts[i + 1][0], pts[i + 1][1], z1]);
      tri([pts[0][0], pts[0][1], z0], [pts[i + 1][0], pts[i + 1][1], z0], [pts[i][0], pts[i][1], z0]);
    }
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      tri([a[0], a[1], z0], [b[0], b[1], z0], [b[0], b[1], z1]);
      tri([a[0], a[1], z0], [b[0], b[1], z1], [a[0], a[1], z1]);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.computeVertexNormals();
    return g;
  };

  const disposables: { dispose: () => void }[] = [];
  const keep = <D extends { dispose: () => void }>(d: D) => { disposables.push(d); return d; };

  // Coincident faces (paper hinges, fully folded) need a fixed order to
  // draw in, or they flicker.
  const lambert = (color: string, i: number, side: THREE_NS.Side = THREE.FrontSide) =>
    keep(new THREE.MeshLambertMaterial({ color, side, polygonOffset: true, polygonOffsetFactor: 0, polygonOffsetUnits: -2 * i }));
  const pinkMat = PANELS.map((_, i) => lambert(PINK, i));
  const hitMat = PANELS.map((_, i) => lambert(HIT, i));
  const webMat = PANELS.map((_, i) => lambert(GREEN, i));
  const hingeMat = lambert(GREEN, 0, THREE.DoubleSide);

  type Build = {
    group: THREE_NS.Group;
    bodies: THREE_NS.Group[];
    panels: THREE_NS.Mesh[];
    hinges: { a: number; b: number; ends: V3[]; dir: V3; g: number; geo: THREE_NS.BufferGeometry }[];
    local: Prism[];
  };
  const NU = 18;

  function build(mode: Mode): Build {
    const g = GAP[mode];
    const group = new THREE.Group();
    const bodies = PANELS.map(() => { const b = new THREE.Group(); b.matrixAutoUpdate = false; group.add(b); return b; });
    const panels = PANELS.map((p, i) => {
      // The web under the panel, out to the mat's edge on the outside and to
      // the start of the hinge on a crease.
      bodies[i].add(new THREE.Mesh(keep(prism(inset(p.tri, webInset(i, g)), BUILD, BUILD + WEB)), webMat[i]));
      const t = inset(p.tri, g / 2);
      const geo = keep(new THREE.BufferGeometry());
      const lower = prism(t, 0, BUILD), upper = prism(t, BUILD + WEB, T);
      const merged = [...(lower.getAttribute("position").array as Float32Array), ...(upper.getAttribute("position").array as Float32Array)];
      lower.dispose(); upper.dispose();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(merged, 3));
      geo.computeVertexNormals();
      const mesh = new THREE.Mesh(geo, pinkMat[i]);
      bodies[i].add(mesh);
      return mesh;
    });
    // The hinges: one strip along every crease, its full length.
    const hinges: Build["hinges"] = [];
    const strip = () => {
      const geo = keep(new THREE.BufferGeometry());
      geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array((NU + 1) * 4 * 3), 3));
      geo.setAttribute("normal", new THREE.BufferAttribute(new Float32Array((NU + 1) * 4 * 3), 3));
      const idx: number[] = [];
      for (let i = 0; i < NU; i++) {
        for (const side of [0, 1]) {
          const o = side * 2 * (NU + 1);
          const a = o + i * 2, b = o + i * 2 + 1, c = o + (i + 1) * 2, d = o + (i + 1) * 2 + 1;
          if (side === 0) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, b, d, c);
        }
      }
      geo.setIndex(idx);
      const mesh = new THREE.Mesh(geo, hingeMat);
      mesh.frustumCulled = false;
      group.add(mesh);
      return geo;
    };
    for (const c of CREASES) {
      const ends = c.ends.map(([x, y]) => [x - (c.dir[0] * g) / 2, y - (c.dir[1] * g) / 2, MID] as V3);
      hinges.push({ a: c.a, b: c.b, ends, dir: [c.dir[0], c.dir[1], 0], g, geo: strip() });
    }
    scene.add(group);
    return { group, bodies, panels, hinges, local: prisms(mode) };
  }

  const builds: Record<Mode, Build> = { gaps: build("gaps"), paper: build("paper") };

  /** Bend each hinge strip between the two squares it joins: a smooth curve
      leaving one panel edge and arriving square on to the other. */
  function bend(h: Build["hinges"][number], pose: M[]) {
    const A = pose[h.a], B = pose[h.b];
    const pos = h.geo.getAttribute("position") as THREE_NS.BufferAttribute;
    const nrm = h.geo.getAttribute("normal") as THREE_NS.BufferAttribute;
    const ta = turn(A, h.dir), tb = turn(B, h.dir);
    const along = norm(turn(A, sub(h.ends[1], h.ends[0])));
    const up = turn(A, [0, 0, 1]);
    h.ends.forEach((e, v) => {
      const p0 = apply(A, e), p1 = apply(B, add(e, scale(h.dir, h.g)));
      const d = Math.hypot(...sub(p1, p0));
      const w = (1 - dot(ta, tb)) / 2;
      const bulge = Math.min(d, Math.max(d / 2, h.g / 2 + (d / 2) * (1 - Math.PI / 2)));
      const m = h.g + (4 * bulge - h.g) * w;
      for (let i = 0; i <= NU; i++) {
        const t = i / NU, t2 = t * t, t3 = t2 * t;
        const h00 = 2 * t3 - 3 * t2 + 1, h10 = t3 - 2 * t2 + t, h01 = -2 * t3 + 3 * t2, h11 = t3 - t2;
        const p = add(add(scale(p0, h00), scale(ta, h10 * m)), add(scale(p1, h01), scale(tb, h11 * m)));
        const d00 = 6 * t2 - 6 * t, d10 = 3 * t2 - 4 * t + 1, d01 = -6 * t2 + 6 * t, d11 = 3 * t2 - 2 * t;
        const tan = add(add(scale(p0, d00), scale(ta, d10 * m)), add(scale(p1, d01), scale(tb, d11 * m)));
        // Matches the triangles' winding, so the two-sided material lights
        // whichever face is seen.
        const raw = cross(tan, along);
        const n = Math.hypot(...raw) > 1e-6 ? norm(raw) : scale(up, dot(cross(ta, along), up) < 0 ? -1 : 1);
        for (const side of [0, 1]) {
          const sgn = side === 0 ? 1 : -1;
          const q = toWorld(add(p, scale(n, (sgn * WEB) / 2)));
          const wn = toWorld(scale(n, sgn));
          const j = side * 2 * (NU + 1) + i * 2 + v;
          pos.setXYZ(j, q[0], q[1], q[2]);
          nrm.setXYZ(j, wn[0], wn[1], wn[2]);
        }
      }
    });
    pos.needsUpdate = true;
    nrm.needsUpdate = true;
  }

  let shownS = -1, shownMode: Mode | null = null, shownFold: Fold | null = null, shown: M[] = FLAT_POSE, lastHits = -1;
  let frame: Frame | null = null;
  let width = 0, height = 0;

  function pose(s: number, mode: Mode, fold: Fold) {
    const b = builds[mode];
    builds.gaps.group.visible = mode === "gaps";
    builds.paper.group.visible = mode === "paper";
    const ps = poses(s, mode, fold);
    b.bodies.forEach((body, i) => place(body, ps[i]));
    b.hinges.forEach(h => bend(h, ps));
    const hit = collisions(b.local, ps);
    b.panels.forEach((mesh, i) => { mesh.material = (hit[i] ? hitMat : pinkMat)[i]; });
    const n = hit.filter(Boolean).length;
    if (n !== lastHits) { lastHits = n; onHits(n); }
    return ps;
  }

  let raf = 0, last = performance.now(), running = false, readySent = false;
  const tick = (now: number) => {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    const { s, mode, fold, view } = read();
    let busy = false;
    if (s !== shownS || mode !== shownMode || fold !== shownFold) {
      shown = pose(s, mode, fold);
      shownS = s; shownMode = mode; shownFold = fold;
      busy = true;
    }
    // Keep the mat framed as it changes size, easing there.
    const want = frameFor(shown, view, width && height ? width / height : ASPECT);
    if (!frame || reduce) frame = want;
    else {
      const k = 1 - Math.exp(-dt * 5);
      const next = { target: add(frame.target, scale(sub(want.target, frame.target), k)), dist: frame.dist + (want.dist - frame.dist) * k };
      if (Math.hypot(...sub(next.target, want.target)) > 0.05 || Math.abs(next.dist - want.dist) > 0.05) busy = true;
      frame = next;
    }
    const { dir } = basis(view);
    camera.position.set(...add(frame.target, scale(dir, frame.dist)));
    camera.lookAt(...frame.target);
    renderer.render(scene, camera);
    if (!readySent) { readySent = true; onReady(); }
    running = busy;
    if (busy) raf = requestAnimationFrame(tick);
  };
  const poke = () => {
    if (running) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  };

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    poke();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  let disposed = false;
  return {
    poke,
    dispose: () => {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      disposables.forEach(d => d.dispose());
      renderer.dispose();
    },
  };
}

// ------------------------------------------------------------- the control

const SPEED = 1 / 1.1; // steps per second

const FOLDS: { id: Fold; label: string }[] = [
  { id: "square", label: "Square fold" },
  { id: "pinch", label: "Twin pinch" },
  { id: "sweeps", label: "Two sweeps" },
  { id: "zipper", label: "Alternating zipper" },
];

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function YogaMatFold() {
  const figRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [s, setS] = useState(0);
  const [mode, setMode] = useState<Mode>("gaps");
  const [fold, setFold] = useState<Fold>("square");
  // A fold chosen while the mat is folded another way: it unfolds first.
  const [next, setNext] = useState<Fold | null>(null);
  const nextRef = useRef<Fold | null>(null);
  const [target, setTarget] = useState<number | null>(null);
  const [near, setNear] = useState(false);
  const [ready, setReady] = useState(false);
  const [hits, setHits] = useState(0);
  const [touched, setTouched] = useState(false);
  const live = useRef({ s: 0, mode: "gaps" as Mode, fold: "square" as Fold, view: { az: START_AZ, el: START_EL } as View });
  const sceneRef = useRef<Scene | null>(null);
  const steps = stepsOf(fold);

  useEffect(() => {
    live.current.s = s;
    live.current.mode = mode;
    live.current.fold = fold;
    sceneRef.current?.poke();
  }, [s, mode, fold]);

  // Load three.js only once the demo is close to the screen.
  useEffect(() => {
    const fig = figRef.current;
    if (!fig) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setNear(true); io.disconnect(); } }, { rootMargin: "400px 0px" });
    io.observe(fig);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!near) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    makeScene({
      canvas,
      read: () => live.current,
      onReady: () => setReady(true),
      onHits: n => setHits(n),
    }).then(scene => {
      if (cancelled) scene.dispose();
      else sceneRef.current = scene;
    }).catch(() => { /* the still stays */ });
    return () => { cancelled = true; sceneRef.current?.dispose(); sceneRef.current = null; };
  }, [near]);

  // Play the fold towards its target. Taking the slider stops it at once,
  // before React gets round to cancelling the frame.
  const run = useRef(0);
  useEffect(() => {
    if (target === null) return;
    let raf = 0, last = performance.now();
    const id = run.current;
    const step = (now: number) => {
      if (run.current !== id) return;
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const prev = live.current.s;
      const dir = Math.sign(target - prev);
      const at = prev + dir * SPEED * dt;
      if (dir === 0 || (dir > 0 ? at >= target : at <= target)) {
        live.current.s = target;
        setS(target);
        const then = nextRef.current;
        if (target === 0 && then) {
          // Flat again: now fold the new way.
          nextRef.current = null;
          live.current.fold = then;
          setFold(then);
          setNext(null);
          setTarget(stepsOf(then));
        } else setTarget(t => (t === target ? null : t));
        return;
      }
      live.current.s = at;
      setS(at);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  // Until someone touches it, it folds and unfolds by itself while on screen.
  useEffect(() => {
    if (!ready || touched || reducedMotion()) return;
    const fig = figRef.current;
    if (!fig) return;
    const n = stepsOf(fold);
    let timer = 0, folded = false;
    const play = () => {
      const flip = () => { folded = !folded; setTarget(folded ? n : 0); timer = window.setTimeout(flip, n / SPEED * 1000 + 1800); };
      timer = window.setTimeout(flip, 900);
    };
    const io = new IntersectionObserver(([e]) => { window.clearTimeout(timer); if (e.isIntersecting) play(); }, { threshold: 0.4 });
    io.observe(fig);
    return () => { io.disconnect(); window.clearTimeout(timer); };
  }, [ready, touched, fold]);

  const touch = useCallback(() => { setTouched(true); setNear(true); }, []);
  const forgetNext = () => { nextRef.current = null; setNext(null); };
  /** Put the mat at s now, with nothing playing. */
  const jump = (to: number) => { run.current++; setTarget(null); live.current.s = to; setS(to); };

  // The pill names what pressing it does: reverse a fold that is playing,
  // otherwise go to whichever end is further.
  const toward = target !== null ? (target > 0 ? 0 : steps) : s >= steps ? 0 : steps;
  const press = () => {
    touch();
    forgetNext();
    if (reducedMotion()) jump(toward);
    else setTarget(toward);
  };

  const choose = (f: Fold) => {
    touch();
    if (f === (next ?? fold)) return;
    forgetNext();
    if (reducedMotion()) { setFold(f); jump(stepsOf(f)); return; }
    if (f === fold || live.current.s <= 0) { setFold(f); setTarget(stepsOf(f)); return; }
    nextRef.current = f;
    setNext(f);
    setTarget(0);
  };

  // Drag (or arrow keys) to turn it.
  const drag = useRef<{ x: number; y: number; id: number } | null>(null);
  const turnBy = (daz: number, del: number) => {
    const v = live.current.view;
    live.current.view = { az: v.az + daz, el: Math.min(1.45, Math.max(0.08, v.el + del)) };
    sceneRef.current?.poke();
  };

  const text = stepText(s, mode, fold);
  const status = mode === "paper" && hits > 0 ? `${text}. ${hits} of 20 panels pass through another.` : `${text}.`;

  return (
    <figure className="ui-try yoga-try" ref={figRef}>
      <div className="ui-media ui-try-stage yoga-stage" data-ready={ready || undefined}>
        <Still />
        <canvas
          ref={canvasRef}
          data-ready={ready || undefined}
          tabIndex={0}
          role="img"
          aria-label={`The folding yoga mat in 3D. ${status} Arrow keys turn it.`}
          onPointerDown={e => {
            touch();
            drag.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={e => {
            const d = drag.current;
            if (!d || d.id !== e.pointerId) return;
            turnBy(-(e.clientX - d.x) * 0.008, (e.clientY - d.y) * 0.006);
            drag.current = { ...d, x: e.clientX, y: e.clientY };
          }}
          onPointerUp={() => { drag.current = null; }}
          onPointerCancel={() => { drag.current = null; }}
          onKeyDown={e => {
            const keys: Record<string, [number, number]> = { ArrowLeft: [0.12, 0], ArrowRight: [-0.12, 0], ArrowUp: [0, 0.08], ArrowDown: [0, -0.08] };
            const k = keys[e.key];
            if (!k) return;
            e.preventDefault();
            touch();
            turnBy(k[0], k[1]);
          }}
        />
      </div>
      <div className="ui-try-controls">
        <div className="ui-try-row" role="group" aria-label="Way to fold">
          {FOLDS.map(f => (
            <button key={f.id} type="button" className="ui-try-pill" aria-pressed={(next ?? fold) === f.id} onClick={() => choose(f.id)}>{f.label}</button>
          ))}
        </div>
        <div className="ui-try-row yoga-scrub-row">
          <button type="button" className="ui-try-pill yoga-fold" onClick={press}>{toward > 0 ? "Fold" : "Unfold"}</button>
          <label className="yoga-scrub">
            <span aria-hidden="true">Flat</span>
            <input
              type="range"
              min={0}
              max={steps * 100}
              step={1}
              value={Math.round(s * 100)}
              aria-label="Fold"
              aria-valuetext={text}
              onChange={e => { touch(); forgetNext(); jump(Number(e.target.value) / 100); }}
            />
            <span aria-hidden="true">Folded</span>
          </label>
        </div>
        <p className="yoga-status">{status}</p>
        <div className="ui-try-row" role="group" aria-label="Hinges">
          <button type="button" className="ui-try-pill" aria-pressed={mode === "gaps"} onClick={() => { touch(); setMode("gaps"); }}>22 mm gaps</button>
          <button type="button" className="ui-try-pill" aria-pressed={mode === "paper"} onClick={() => { touch(); setMode("paper"); }}>Paper hinges</button>
        </div>
      </div>
      <figcaption className="ui-try-caption">
        {mode === "paper"
          ? "Try it: the same folds made like paper, about the crease lines with no gap. Panels 4.5 mm thick can’t do that: the dark ones are passing through another panel. The gaps are what give them room."
          : fold === "square"
            ? "Try it: fold it, scrub it, drag to turn it. The panels, hinge gaps and fold order are the CAD’s, checked live: no panel passes through another. The diagonals stay flat here; on the real mat they flex to help it collapse."
            : "Try it: the fold study’s triangle options. The ends tuck in on the diagonals and roll to the centre, five triangles a side. The study folds in half last, which would tear the long hinge on a joined mat, so here that comes first, as on the real sample. The study leaves which way each crease turns open: here diagonals tuck under and cross creases roll over, so every hinge wrap stays within its 22 mm. Checked live: no panel passes through another."}
      </figcaption>
    </figure>
  );
}
