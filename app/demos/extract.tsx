"use client";

import { useEffect, useId, useRef, useState } from "react";
import "./extract.css";

/* A small, real version of Extract's colours: pick a product, press Extract
   colours, and the palette is worked out here in the browser from the
   picture's own pixels. Nothing is sent anywhere, including your own image.

   How: the picture is drawn small (at most 200px across), the background is
   found from its border and left out with anything near white, and the rest
   is grouped by k-means in OKLab, where distance follows how different two
   colours look. Hue counts three times over lightness, so one red in light and
   shade stays one red. Near twins are merged and six kept that are both
   large and unlike each other, each shown as the colour of its lit side
   (the plain average is muddied by shading), named after the nearest of a short list and marked
   on the picture where it is most itself. The real Extract also pulls
   materials and parts; this is the colour part only. */

type RGB = [number, number, number];
type Lab = [number, number, number];
type Swatch = { hex: string; name: string; rgb: RGB; share: number; x: number; y: number };
type Picture = { id: string; label: string; src: string; w: number; h: number; inset: number; alt: string };

const SLOTS = 6;

const SAMPLES: Picture[] = [
  { id: "cases", label: "Cases", src: "/thumbs/iphone-finewoven-lead.webp", w: 1600, h: 900, inset: 0, alt: "Five FineWoven iPhone cases in a row: mulberry, green, taupe, blue and black." },
  { id: "cardigan", label: "Cardigan", src: "/thumbs/crocheting-lead.webp", w: 1600, h: 900, inset: 0, alt: "A crocheted patchwork cardigan in many colours." },
  { id: "pretzels", label: "Pretzels", src: "/portfolio/pretzel-molds.webp", w: 963, h: 600, inset: 4, alt: "Moulded pretzels in many colours beside the aluminium mould." },
];

/* --- colour maths ------------------------------------------------------ */

const LIN = Array.from({ length: 256 }, (_, i) => {
  const c = i / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
});

function oklab(r: number, g: number, b: number): Lab {
  const R = LIN[r], G = LIN[g], B = LIN[b];
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function rgbOf([L, a, b]: Lab): RGB {
  const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
  const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
  const s = Math.pow(L - 0.0894841775 * a - 1.291485548 * b, 3);
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return lin.map(c => {
    const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(Math.max(c, 0), 1 / 2.4) - 0.055;
    return Math.round(Math.min(1, Math.max(0, v)) * 255);
  }) as RGB;
}

const hexOf = (rgb: RGB) => "#" + rgb.map(v => v.toString(16).padStart(2, "0")).join("").toUpperCase();
const dist2 = (p: Lab, q: Lab) => (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2;

/* Plain names, nearest wins. */
const NAMES = ([
  ["Black", "#1c1c1e"], ["Charcoal", "#3c3c3e"], ["Grey", "#8a8a8c"], ["Silver", "#c4c4c6"], ["White", "#f6f6f4"],
  ["Cream", "#f2e8cf"], ["Beige", "#d9c4a3"], ["Sand", "#c6ad86"], ["Tan", "#ad8657"], ["Taupe", "#8a7766"],
  ["Brown", "#6a4630"], ["Chocolate", "#3f271b"], ["Mustard", "#c9a227"], ["Yellow", "#f1d12c"], ["Ochre", "#c8862a"],
  ["Orange", "#e8722a"], ["Coral", "#ef7766"], ["Salmon", "#f2a08a"], ["Red", "#d2372b"], ["Crimson", "#b31f3c"],
  ["Burgundy", "#6c1d2d"], ["Mulberry", "#71394f"], ["Plum", "#5a2f50"], ["Rose", "#c2607e"], ["Pink", "#f08db2"],
  ["Hot pink", "#e6408c"], ["Blush", "#f1c4ca"], ["Lilac", "#c6a8e2"], ["Purple", "#7c3fb2"], ["Violet", "#5b2a9c"],
  ["Navy", "#1f2a4c"], ["Blue", "#2f5bd1"], ["Cornflower", "#6f8fd9"], ["Sky blue", "#9fc9ec"], ["Pale blue", "#b4cde0"],
  ["Slate blue", "#4a5f7a"], ["Steel blue", "#46708c"], ["Teal", "#1f7a7a"], ["Turquoise", "#3ab2b0"], ["Mint", "#a7e0c4"],
  ["Green", "#2e9a4a"], ["Emerald", "#1f8a4c"], ["Forest green", "#285a3a"], ["Evergreen", "#3d5243"], ["Olive", "#6b6a2c"],
  ["Lime", "#a9d23f"], ["Sage", "#9cae8c"],
] as const).map(([name, hex]) => {
  const n = parseInt(hex.slice(1), 16);
  return { name, lab: oklab((n >> 16) & 255, (n >> 8) & 255, n & 255) };
});

/* --- extraction -------------------------------------------------------- */

// A seeded random, so the same picture always gives the same palette.
function seeded(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CHROMA_WEIGHT = 3;

function extract(img: HTMLImageElement): Swatch[] {
  const scale = Math.min(1, 200 / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale)), h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];
  ctx.drawImage(img, 0, 0, w, h);
  const px = ctx.getImageData(0, 0, w, h).data;
  const n = w * h;

  const lab = new Float32Array(n * 3), opaque = new Uint8Array(n);
  for (let p = 0; p < n; p++) {
    const i = p * 4;
    if (px[i + 3] < 128) continue;
    opaque[p] = 1;
    const [L, a, b] = oklab(px[i], px[i + 1], px[i + 2]);
    lab[p * 3] = L; lab[p * 3 + 1] = a; lab[p * 3 + 2] = b;
  }

  // The background is whatever runs round the border: its median colour.
  const border: Lab[] = [];
  for (let x = 0; x < w; x++) for (const y of [0, 1, h - 2, h - 1]) { const p = y * w + x; if (y >= 0 && y < h && opaque[p]) border.push([lab[p * 3], lab[p * 3 + 1], lab[p * 3 + 2]]); }
  for (let y = 0; y < h; y++) for (const x of [0, 1, w - 2, w - 1]) { const p = y * w + x; if (x >= 0 && x < w && opaque[p]) border.push([lab[p * 3], lab[p * 3 + 1], lab[p * 3 + 2]]); }
  const median = (k: number) => { const v = border.map(c => c[k]).sort((a, b) => a - b); return v[v.length >> 1] ?? 0; };
  const bg: Lab = [median(0), median(1), median(2)];

  const pick = (strict: boolean) => {
    const keep: number[] = [];
    for (let p = 0; p < n; p++) {
      if (!opaque[p]) continue;
      if (!strict) { keep.push(p); continue; }
      const c: Lab = [lab[p * 3], lab[p * 3 + 1], lab[p * 3 + 2]];
      const chroma = Math.hypot(c[1], c[2]);
      if (c[0] > 0.96 && chroma < 0.025) continue; // near white
      if (border.length && dist2(c, bg) < 0.06 * 0.06) continue; // the backdrop
      keep.push(p);
    }
    return keep;
  };
  let keep = pick(true);
  // A photo with no plain backdrop: use all of it rather than a sliver.
  if (keep.length < n * 0.04) keep = pick(false);
  if (!keep.length) return [];
  // Deep shadow (the holes in a knit, the gap under a part) is the absence
  // of a colour, so leave it out unless the thing itself is that dark.
  const lit = keep.filter(p => lab[p * 3] >= 0.24);
  if (lit.length > keep.length * 0.7) keep = lit;

  // Points to cluster, hue weighted over lightness.
  const m = keep.length;
  const pts = new Float32Array(m * 3);
  keep.forEach((p, j) => { pts[j * 3] = lab[p * 3]; pts[j * 3 + 1] = lab[p * 3 + 1] * CHROMA_WEIGHT; pts[j * 3 + 2] = lab[p * 3 + 2] * CHROMA_WEIGHT; });
  const d2 = (j: number, c: number[]) => (pts[j * 3] - c[0]) ** 2 + (pts[j * 3 + 1] - c[1]) ** 2 + (pts[j * 3 + 2] - c[2]) ** 2;

  // k-means++ seeding, then Lloyd's iterations.
  const K = Math.min(16, m);
  const rand = seeded(7);
  const centres: number[][] = [];
  const first = Math.floor(rand() * m);
  centres.push([pts[first * 3], pts[first * 3 + 1], pts[first * 3 + 2]]);
  const near = new Float32Array(m).fill(Infinity);
  while (centres.length < K) {
    let total = 0;
    const last = centres[centres.length - 1];
    for (let j = 0; j < m; j++) { near[j] = Math.min(near[j], d2(j, last)); total += near[j]; }
    let r = rand() * total, j = 0;
    while (j < m - 1 && (r -= near[j]) > 0) j++;
    centres.push([pts[j * 3], pts[j * 3 + 1], pts[j * 3 + 2]]);
  }
  const label = new Int16Array(m);
  for (let it = 0; it < 20; it++) {
    let moved = 0;
    for (let j = 0; j < m; j++) {
      let best = 0, bestD = Infinity;
      for (let k = 0; k < K; k++) { const d = d2(j, centres[k]); if (d < bestD) { bestD = d; best = k; } }
      if (label[j] !== best) { label[j] = best; moved++; }
    }
    const sum = centres.map(() => [0, 0, 0, 0]);
    for (let j = 0; j < m; j++) { const s = sum[label[j]]; s[0] += pts[j * 3]; s[1] += pts[j * 3 + 1]; s[2] += pts[j * 3 + 2]; s[3]++; }
    sum.forEach((s, k) => { if (s[3]) centres[k] = [s[0] / s[3], s[1] / s[3], s[2] / s[3]]; });
    if (it > 0 && moved === 0) break;
  }

  // Groups: size, merge near twins (lit and shaded sides of one colour
  // differ mostly in lightness, so lightness counts for less here), drop
  // the crumbs, keep the largest.
  type Group = { c: number[]; size: number; members: number[] };
  let groups: Group[] = centres.map(c => ({ c, size: 0, members: [] }));
  for (let j = 0; j < m; j++) { groups[label[j]].size++; groups[label[j]].members.push(j); }
  groups = groups.filter(g => g.size).sort((a, b) => b.size - a.size);
  const twins = (a: number[], b: number[]) => ((a[0] - b[0]) * 0.5) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2 < 0.06 * 0.06;
  for (let i = 0; i < groups.length; i++) {
    for (let k = groups.length - 1; k > i; k--) {
      const a = groups[i], b = groups[k];
      if (!twins(a.c, b.c)) continue;
      const t = a.size + b.size;
      a.c = a.c.map((v, q) => (v * a.size + b.c[q] * b.size) / t);
      a.size = t;
      a.members = a.members.concat(b.members);
      groups.splice(k, 1);
    }
  }
  // Keep six that are both large and unlike each other, so a few small
  // bright patches aren't crowded out by five beiges.
  const pool = groups.filter(g => g.size >= m * 0.01);
  const chosen: Group[] = [];
  while (chosen.length < SLOTS && pool.length) {
    let best = 0, bestScore = -1;
    pool.forEach((g, i) => {
      const apart = chosen.length ? Math.min(...chosen.map(c => Math.sqrt(((g.c[0] - c.c[0]) * 0.5) ** 2 + (g.c[1] - c.c[1]) ** 2 + (g.c[2] - c.c[2]) ** 2))) : 1;
      const score = g.size * Math.min(1, apart / 0.25) ** 2;
      if (score > bestScore) { bestScore = score; best = i; }
    });
    chosen.push(pool.splice(best, 1)[0]);
  }
  groups = chosen.sort((a, b) => b.size - a.size);

  // Each group's colour is its lit side, not its average: the mean of its
  // pixels between the 40th and 90th percentile of lightness, so shadows
  // and highlights don't mud it.
  const owner = new Int16Array(n).fill(-1);
  groups.forEach((g, gi) => g.members.forEach(j => { owner[keep[j]] = gi; }));
  const used = new Set<string>();
  return groups.map((g, gi) => {
    const byL = [...g.members].sort((a, b) => pts[a * 3] - pts[b * 3]);
    const from = Math.floor(byL.length * 0.4);
    const lit = byL.slice(from, Math.max(from + 1, Math.floor(byL.length * 0.9)));
    const centre = [0, 1, 2].map(q => lit.reduce((s, j) => s + pts[j * 3 + q], 0) / lit.length);

    // Where it is most itself: a pixel near that colour whose neighbours are
    // the same colour, so the mark lands inside the part, not on an edge.
    let bestJ = lit[0], bestScore = -Infinity;
    for (const j of g.members) {
      const p = keep[j], x = p % w, y = (p / w) | 0;
      if (x < 3 || y < 3 || x > w - 4 || y > h - 4) continue;
      let same = 0;
      for (let dy = -3; dy <= 3; dy += 3) for (let dx = -3; dx <= 3; dx += 3) if (owner[p + dy * w + dx] === gi) same++;
      const score = same - Math.sqrt(d2(j, centre)) * 20;
      if (score > bestScore) { bestScore = score; bestJ = j; }
    }
    const p = keep[bestJ];
    const c: Lab = [centre[0], centre[1] / CHROMA_WEIGHT, centre[2] / CHROMA_WEIGHT];
    const rgb = rgbOf(c);
    // Nearest name, hue weighted like the clustering; the next nearest if two
    // swatches would share one and it is nearly as close.
    const nd = (q: Lab) => (c[0] - q[0]) ** 2 + ((c[1] - q[1]) * CHROMA_WEIGHT) ** 2 + ((c[2] - q[2]) * CHROMA_WEIGHT) ** 2;
    const ranked = NAMES.map(nm => ({ name: nm.name, d: nd(nm.lab) })).sort((a, b) => a.d - b.d);
    const name = ranked.find(r => !used.has(r.name) && r.d < ranked[0].d * 1.6)?.name ?? ranked[0].name;
    used.add(name);
    return { hex: hexOf(rgb), name, rgb, share: g.size / m, x: ((p % w) + 0.5) / w, y: (((p / w) | 0) + 0.5) / h };
  });
}

/* --- the demo ---------------------------------------------------------- */

// The picture's box inside the 16:9 stage, as percentages, so the marks sit
// on the picture and the first paint already has it in place.
function boxOf(pic: Picture): React.CSSProperties {
  const room = 100 - pic.inset * 2;
  const ratio = pic.w / pic.h, stage = 16 / 9;
  const width = ratio >= stage ? room : (room * ratio) / stage;
  const height = ratio >= stage ? (room * stage) / ratio : room;
  return { position: "absolute", left: `${(100 - width) / 2}%`, top: `${(100 - height) / 2}%`, width: `${width}%`, height: `${height}%` };
}

const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const img = new window.Image();
  img.onload = () => resolve(img);
  img.onerror = reject;
  img.src = src;
});

export default function Extract() {
  const [pic, setPic] = useState<Picture>(SAMPLES[0]);
  const [swatches, setSwatches] = useState<Swatch[] | null>(null);
  const [run, setRun] = useState(0);
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const ownUrl = useRef<string | null>(null);
  const copyTimer = useRef(0);
  const hintId = useId();

  useEffect(() => () => {
    if (ownUrl.current) URL.revokeObjectURL(ownUrl.current);
    window.clearTimeout(copyTimer.current);
  }, []);

  const show = (next: Picture) => {
    setPic(next);
    setSwatches(null);
    setActive(null);
    setCopied(null);
  };

  const choose = (sample: Picture) => {
    if (sample.id === pic.id) return;
    setNote("");
    show(sample);
  };

  const openOwn = async (file: File | undefined) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImage(url);
      if (ownUrl.current) URL.revokeObjectURL(ownUrl.current);
      ownUrl.current = url;
      setNote("");
      show({ id: "own", label: "Yours", src: url, w: img.naturalWidth, h: img.naturalHeight, inset: 6, alt: "Your image." });
    } catch {
      URL.revokeObjectURL(url);
      setNote("That file didn't open as an image here. Try a JPEG, PNG or WebP.");
    }
  };

  const go = async () => {
    setBusy(true);
    setActive(null);
    setCopied(null);
    try {
      const img = await loadImage(pic.src);
      // Let "Extracting" paint before the work starts.
      await new Promise(r => requestAnimationFrame(() => setTimeout(r, 0)));
      const result = extract(img);
      setSwatches(result);
      setRun(r => r + 1);
      setNote(result.length ? `Found ${result.length} colours: ${result.map(s => s.name.toLowerCase()).join(", ")}.` : "No colours stood out from the background.");
    } catch {
      setNote("That image couldn't be read.");
    } finally {
      setBusy(false);
    }
  };

  const copy = async (i: number, hex: string) => {
    try {
      await navigator.clipboard.writeText(hex);
      setCopied(i);
      setNote(`Copied ${hex}.`);
      window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(null), 1400);
    } catch {
      setNote(`Couldn't reach the clipboard. The hex is ${hex}.`);
    }
  };

  const slots = Array.from({ length: SLOTS }, (_, i) => swatches?.[i] ?? null);

  return (
    <figure className="ui-try ex">
      <div className="ui-media ui-try-stage ex-stage">
        <div style={boxOf(pic)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img key={pic.src} src={pic.src} alt={pic.alt} width={pic.w} height={pic.h} />
          {swatches?.map((s, i) => (
            <span
              key={`${run}-${i}`}
              className="ex-mark"
              aria-hidden="true"
              data-active={active === i || undefined}
              style={{ left: `${s.x * 100}%`, top: `${s.y * 100}%`, "--swatch": s.hex, "--i": i } as React.CSSProperties}
            />
          ))}
        </div>
      </div>

      <ol className="ex-palette" aria-label="Extracted colours" aria-describedby={hintId}>
        {slots.map((s, i) => (
          <li key={s ? `${run}-${i}` : `empty-${i}`} className="ex-slot" data-filled={s ? true : undefined} style={{ "--i": i } as React.CSSProperties}>
            {s ? (
              <button
                type="button"
                className="ex-swatch"
                aria-label={`${s.name}, ${s.hex}. Copy hex`}
                onClick={() => copy(i, s.hex)}
                onPointerEnter={() => setActive(i)}
                onPointerLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
              >
                <span className="ex-chip" style={{ "--swatch": s.hex } as React.CSSProperties} />
                <span className="ex-text">
                  <span className="ex-name">{s.name}</span>
                  <span className="ex-hex">{copied === i ? "Copied" : s.hex}</span>
                </span>
              </button>
            ) : (
              <span className="ex-swatch ex-empty" aria-hidden="true">
                <span className="ex-chip" />
                <span className="ex-text"><span className="ex-name">&nbsp;</span><span className="ex-hex">&nbsp;</span></span>
              </span>
            )}
          </li>
        ))}
      </ol>
      <p id={hintId} className="sr-only">Each colour is a button that copies its hex code.</p>

      <div className="ui-try-controls">
        <div className="ui-try-row" role="group" aria-label="Product">
          {SAMPLES.map(s => (
            <button key={s.id} type="button" className="ui-try-pill" aria-pressed={pic.id === s.id} onClick={() => choose(s)}>
              {s.label}
            </button>
          ))}
          <button type="button" className="ui-try-pill" aria-pressed={pic.id === "own"} onClick={() => fileRef.current?.click()}>
            Use your own
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={e => { openOwn(e.target.files?.[0]); e.target.value = ""; }}
          />
        </div>
        <div className="ui-try-row">
          <button type="button" className="ui-try-pill ex-go" onClick={go} disabled={busy} aria-busy={busy || undefined}>
            {busy ? "Extracting" : "Extract colours"}
          </button>
        </div>
      </div>
      <p className="sr-only" aria-live="polite">{note}</p>
      {note && !note.startsWith("Found") && !note.startsWith("Copied") && <p className="ex-note">{note}</p>}

      <figcaption className="ui-try-caption">
        Try it: pick a product, extract its colours, then click one to copy its hex. Your own image stays in your browser. This is the colour part only; the real Extract also pulls materials and parts.
      </figcaption>
    </figure>
  );
}
