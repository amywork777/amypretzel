// Copied from ~/code/taste/kit/boil/boilPath.ts (Amy's taste kit).
export type Pt = [number, number]

// mulberry32: a tiny seeded PRNG, so a boil frame looks the same on every render.
function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Each point nudged by up to ±`amp` in x and y, the same way every time for a given seed. */
export function boilPoints(points: Pt[], amp: number, seed: number): Pt[] {
  if (amp === 0) return points.map(([x, y]) => [x, y])
  const r = rng(seed)
  return points.map(([x, y]) => [x + (r() * 2 - 1) * amp, y + (r() * 2 - 1) * amp])
}

const round = (n: number) => Math.round(n * 100) / 100

/** A smooth path through every point (Catmull-Rom converted to cubic Béziers). */
export function toPath(points: Pt[], closed = false): string {
  if (points.length < 2) return ''
  const n = points.length
  const at = (i: number) => points[closed ? (i + n) % n : Math.max(0, Math.min(n - 1, i))]
  let d = `M${round(points[0][0])},${round(points[0][1])}`
  const segments = closed ? n : n - 1
  for (let i = 0; i < segments; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)]
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += `C${round(c1[0])},${round(c1[1])} ${round(c2[0])},${round(c2[1])} ${round(p2[0])},${round(p2[1])}`
  }
  return closed ? `${d}Z` : d
}
