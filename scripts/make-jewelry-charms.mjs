// Bake the sculpted 3D charms for the Taiyaki Jewelry demo (app/demos/ai-jewelry.tsx).
//
// There are no Taiyaki mesh files to show, so these are simple sculpts after
// three Taiyaki pieces in Amy's photos (Teddy the poodle, the goldfish, the duck
// with an umbrella), built here from rounded shapes (signed distance fields),
// not by any AI model. Each one then goes through the same casting rules as the
// demo's drawn charms, in 3D, on a 0.1 mm voxel grid:
//
//   - parts thinner than 0.8 mm would burn out, so they are thickened along
//     their middle to 0.8 mm, with 0.1 mm spare each side (the sculpts' fins,
//     umbrella and tail are thinner on purpose, the way a model straight out
//     of image-to-3D often is)
//   - anything not joined to the main body is dropped, sealed voids are filled
//   - a 1.2 mm wire bail goes on the top, straight above the centre of mass,
//     so the charm hangs level
//   - the 0.8 mm check runs again on the result, and warns if anything is left
//
// The result is meshed as one closed surface (surface nets), smoothed a little
// (Taubin), simplified with meshoptimizer to within 0.01 mm, and its volume is
// measured from that final mesh. The page multiplies it by the metal's density.
//
//   node scripts/make-jewelry-charms.mjs           writes public/demos/ai-jewelry/<id>.bin
//                                                 and charms.json
//   node scripts/make-jewelry-charms.mjs stills [http://localhost:3136]
//                                                 captures <id>-silver.webp from the demo
//                                                 itself, against the built site
//
// Each .bin is the meshoptimizer-encoded vertex buffer (uint16 x, y, z, pad,
// quantized to charms.json "min" and "max") followed by the encoded index
// buffer (uint32 triangles). Lengths and counts are in charms.json.

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "public/demos/ai-jewelry");

// ---------------------------------------------------------------------------
// Stills: the demo's own first paint, per piece, in silver.

if (process.argv[2] === "stills") {
  const { chromium } = await import("playwright");
  const { default: sharp } = await import("sharp");
  const base = process.argv[3] ?? "http://localhost:3136";
  const browser = await chromium.launch({ channel: "chrome", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2, reducedMotion: "reduce" });
  await page.goto(`${base}/portfolio/ai-jewelry`, { waitUntil: "load" });
  await page.addStyleTag({ content: ".jc-still { visibility: hidden; }" });
  const stage = page.locator(".jc-stage");
  await stage.evaluate(el => el.scrollIntoView({ block: "center" }));
  for (const id of ["dog", "fish", "duck"]) {
    await page.locator(".jc button", { hasText: new RegExp(`^${id}$`, "i") }).click();
    await page.waitForSelector(`.jc-stage canvas[data-ready][data-piece="${id}"]`, { timeout: 30000 });
    await page.waitForTimeout(900);
    const png = await stage.screenshot();
    const out = path.join(outDir, `${id}-silver.webp`);
    await sharp(png).resize(1120, 630).webp({ quality: 84 }).toFile(out);
    console.log(`wrote ${path.relative(root, out)}`);
  }
  await browser.close();
  process.exit(0);
}

const { MeshoptSimplifier, MeshoptEncoder } = await import("meshoptimizer");

// ---------------------------------------------------------------------------
// The rules, in millimetres.

const H = 0.1; // voxel
const MIN_FEATURE = 0.8;
const R = MIN_FEATURE / 2 / H; // 4 voxels
const R2 = R * R;
const SIG = 0.08 / H ** 3; // voxels; thin bits smaller than 0.08 mm³ are rounding, not fixes
const BAIL_R = 1.9; // bail, centre line
const BAIL_WIRE = 0.6; // 1.2 mm wire

// ---------------------------------------------------------------------------
// Shapes. Every shape is (x, y, z) => signed distance in mm, negative inside.
// x runs nose-wards, y up, z towards the viewer.

const rot = (ax = 0, ay = 0, az = 0) => {
  // Rotation matrix, applied inverse to bring a point into the shape's frame.
  const [ca, sa, cb, sb, cc, sc] = [Math.cos(ax), Math.sin(ax), Math.cos(ay), Math.sin(ay), Math.cos(az), Math.sin(az)];
  // R = Rz * Ry * Rx; we need R^T.
  const m = [
    cc * cb, cc * sb * sa - sc * ca, cc * sb * ca + sc * sa,
    sc * cb, sc * sb * sa + cc * ca, sc * sb * ca - cc * sa,
    -sb, cb * sa, cb * ca,
  ];
  return (x, y, z) => [m[0] * x + m[3] * y + m[6] * z, m[1] * x + m[4] * y + m[7] * z, m[2] * x + m[5] * y + m[8] * z];
};

const sphere = (cx, cy, cz, r) => (x, y, z) => Math.hypot(x - cx, y - cy, z - cz) - r;

const ellipsoid = (c, r, angles) => {
  const t = angles ? rot(...angles) : null;
  const [rx, ry, rz] = r;
  return (x, y, z) => {
    let dx = x - c[0], dy = y - c[1], dz = z - c[2];
    if (t) [dx, dy, dz] = t(dx, dy, dz);
    const k0 = Math.hypot(dx / rx, dy / ry, dz / rz), k1 = Math.hypot(dx / (rx * rx), dy / (ry * ry), dz / (rz * rz));
    return k1 === 0 ? -Math.min(rx, ry, rz) : (k0 * (k0 - 1)) / k1;
  };
};

/** A capsule whose radius runs from r1 at a to r2 at b (Inigo Quilez's round cone). */
const cone = (a, b, r1, r2) => {
  const ba = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const l2 = ba[0] ** 2 + ba[1] ** 2 + ba[2] ** 2, rr = r1 - r2, a2 = l2 - rr * rr, il2 = 1 / l2;
  return (x, y, z) => {
    const pa = [x - a[0], y - a[1], z - a[2]];
    const yy = pa[0] * ba[0] + pa[1] * ba[1] + pa[2] * ba[2], zz = yy - l2;
    const xv = [pa[0] * l2 - ba[0] * yy, pa[1] * l2 - ba[1] * yy, pa[2] * l2 - ba[2] * yy];
    const x2 = xv[0] ** 2 + xv[1] ** 2 + xv[2] ** 2, y2 = yy * yy * l2, z2 = zz * zz * l2;
    const k = Math.sign(rr) * rr * rr * x2;
    if (Math.sign(zz) * a2 * z2 > k) return Math.sqrt(x2 + z2) * il2 - r2;
    if (Math.sign(yy) * a2 * y2 < k) return Math.sqrt(x2 + y2) * il2 - r1;
    return (Math.sqrt(x2 * a2 * il2) + yy * rr) * il2 - r1;
  };
};

/** A path of round cones through points with radii. */
const tube = (pts, radii) => {
  const segs = pts.slice(1).map((p, i) => cone(pts[i], p, radii[i], radii[i + 1]));
  return (x, y, z) => { let d = Infinity; for (const s of segs) d = Math.min(d, s(x, y, z)); return d; };
};

/** A flat 2D shape in a plane, given its thickness. 2D shapes take (u, v). */
const slab = (shape2, half, frame) => (x, y, z) => {
  const [u, v, w] = frame(x, y, z);
  const d2 = shape2(u, v), dz = Math.abs(w) - half;
  return Math.min(Math.max(d2, dz), 0) + Math.hypot(Math.max(d2, 0), Math.max(dz, 0));
};
const ellipse2 = (cx, cy, a, b, ang = 0) => (u, v) => {
  const c = Math.cos(ang), s = Math.sin(ang), du = u - cx, dv = v - cy;
  const p = du * c + dv * s, q = -du * s + dv * c;
  const k0 = Math.hypot(p / a, q / b), k1 = Math.hypot(p / (a * a), q / (b * b));
  return k1 === 0 ? -Math.min(a, b) : (k0 * (k0 - 1)) / k1;
};
const union2 = (...fs) => (u, v) => Math.min(...fs.map(f => f(u, v)));
const minus2 = (f, g) => (u, v) => Math.max(f(u, v), -g(u, v));

/** A faceted ellipsoid: the planes that touch it in a spread of directions. */
const facets = (c, r, count, seed = 0.5) => {
  const planes = [];
  for (let i = 0; i < count; i++) {
    const y = 1 - (2 * (i + seed)) / count, rad = Math.sqrt(1 - y * y), th = i * Math.PI * (3 - Math.sqrt(5));
    const n = [Math.cos(th) * rad, y, Math.sin(th) * rad];
    planes.push([...n, Math.hypot(r[0] * n[0], r[1] * n[1], r[2] * n[2])]);
  }
  return (x, y, z) => {
    const dx = x - c[0], dy = y - c[1], dz = z - c[2];
    let d = -Infinity;
    for (const [a, b, e, h] of planes) d = Math.max(d, a * dx + b * dy + e * dz - h);
    return d;
  };
};

/** A spherical cap shell (an umbrella canopy), opening downwards. */
const canopy = (c, radius, thick, depth) => (x, y, z) => {
  const dx = x - c[0], dy = y - c[1], dz = z - c[2];
  const shell = Math.abs(Math.hypot(dx, dy, dz) - radius) - thick / 2;
  const cut = (radius - depth) - dy; // keep only the top `depth` of the sphere
  return Math.max(shell, cut);
};

const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
const smax = (a, b, k) => -smin(-a, -b, k);

// ---------------------------------------------------------------------------
// The sculpts. Parts are added in order with a smooth join; "cut" parts are
// carved out. Names are what the cleanup reports.

const z0 = (x, y, z) => [x, y, z]; // a flat part in the x-y plane

const PIECES = [
  {
    id: "dog",
    label: "Dog",
    after: "Teddy, the poodle Taiyaki cast from a photo",
    parts: [
      { name: "body", k: 0, f: ellipsoid([0, 7.4, 0], [5.6, 3.6, 3.2]) },
      { name: "chest", k: 1.2, f: ellipsoid([3.8, 8.3, 0], [2.9, 3.4, 3.2]) },
      { name: "rump", k: 1.2, f: ellipsoid([-4.2, 7.8, 0], [2.3, 2.9, 3]) },
      { name: "head", k: 1.0, f: sphere(6.1, 12.0, 0, 3.0) },
      { name: "topknot", k: 1.0, f: ellipsoid([5.4, 14.2, 0], [2.6, 2.1, 2.6]) },
      { name: "muzzle", k: 0.9, f: ellipsoid([8.9, 11.1, 0], [1.9, 1.35, 1.4]) },
      { name: "nose", k: 0.3, f: sphere(10.7, 11.5, 0, 0.55) },
      { name: "ears", k: 0.6, f: (x, y, z) => Math.min(
        ellipsoid([5.4, 11.0, 2.85], [1.3, 2.5, 0.8], [0.15, 0, -0.25])(x, y, z),
        ellipsoid([5.4, 11.0, -2.85], [1.3, 2.5, 0.8], [-0.15, 0, -0.25])(x, y, z)) },
      { name: "legs", k: 0.9, f: (x, y, z) => {
        let d = Infinity;
        for (const [lx, lz] of [[3.6, 1.7], [3.6, -1.7], [-3.7, 1.7], [-3.7, -1.7]]) {
          d = Math.min(d, cone([lx, 6.4, lz], [lx + 0.1, 1.2, lz], 1.35, 1.15)(x, y, z));
          d = smin(d, ellipsoid([lx + 0.35, 0.75, lz], [1.45, 0.75, 1.15])(x, y, z), 0.6);
        }
        return d;
      } },
      // A thin stem to a pompom, thinner than casting allows.
      { name: "tail", k: 0.5, f: (x, y, z) => smin(
        tube([[-5.6, 9.2, 0], [-6.5, 10.7, 0], [-6.6, 12.0, 0]], [0.55, 0.3, 0.3])(x, y, z),
        sphere(-6.4, 12.7, 0, 1.15)(x, y, z), 0.4) },
      { name: "eyes", k: 0.2, f: (x, y, z) => Math.min(sphere(7.75, 12.65, 1.75, 0.42)(x, y, z), sphere(7.75, 12.65, -1.75, 0.42)(x, y, z)) },
    ],
  },
  {
    id: "fish",
    label: "Fish",
    after: "the faceted goldfish in Taiyaki's photos",
    parts: [
      { name: "body", k: 0, f: facets([0, 0, 0], [5.6, 5.2, 4.1], 46) },
      { name: "lips", k: 0.6, f: (x, y, z) => smin(
        ellipsoid([5.5, -0.35, 0], [0.9, 0.55, 1.45])(x, y, z),
        ellipsoid([5.45, -1.25, 0], [0.8, 0.5, 1.3])(x, y, z), 0.3) },
      { name: "eyes", k: 0.35, f: (x, y, z) => Math.min(sphere(3.3, 1.5, 3.25, 0.85)(x, y, z), sphere(3.3, 1.5, -3.25, 0.85)(x, y, z)) },
      // The fins are 0.5 mm thick, too thin to cast.
      { name: "tail", k: 0.9, f: ellipsoid([-5.7, 0, 0], [1.7, 1.7, 1.1]) },
      { name: "tail fin", k: 0.8, f: slab(minus2(union2(ellipse2(-8.8, 2.3, 3.5, 1.7, -0.55), ellipse2(-8.8, -2.3, 3.5, 1.7, 0.55)), ellipse2(-12.2, 0, 1.4, 1.2)), 0.25, z0) },
      { name: "dorsal fin", k: 0.8, f: slab(ellipse2(0.2, 5.0, 3.5, 1.7, -0.32), 0.25, z0) },
      { name: "belly fins", k: 0.6, f: (x, y, z) => Math.min(
        slab(ellipse2(1.0, -5.2, 1.3, 2.0, 0.5), 0.25, (a, b, c) => [a, b, c - 1.3])(x, y, z),
        slab(ellipse2(1.0, -5.2, 1.3, 2.0, 0.5), 0.25, (a, b, c) => [a, b, c + 1.3])(x, y, z)) },
      { name: "side fins", k: 0.5, f: (x, y, z) => Math.min(
        slab(ellipse2(0, 0, 1.6, 0.9), 0.25, (a, b, c) => { const [u, v, w] = rot(0, 0.9, -0.5)(a - 1.5, b + 2.4, c - 3.6); return [u, v, w]; })(x, y, z),
        slab(ellipse2(0, 0, 1.6, 0.9), 0.25, (a, b, c) => { const [u, v, w] = rot(0, -0.9, -0.5)(a - 1.5, b + 2.4, c + 3.6); return [u, v, w]; })(x, y, z)) },
    ],
  },
  {
    id: "duck",
    label: "Duck",
    after: "Taiyaki's duck with an umbrella",
    parts: [
      { name: "body", k: 0, f: ellipsoid([0, 5.4, 0], [3.9, 3.9, 3.5]) },
      { name: "tail", k: 0.9, f: ellipsoid([-3.5, 6.9, 0], [1.5, 0.9, 1.3], [0, 0, -0.6]) },
      { name: "head", k: 1.1, f: sphere(0.6, 11.1, 0, 2.9) },
      // The hood of the raincoat: a thicker shell behind the face.
      { name: "hood", k: 0.7, f: (x, y, z) => smax(sphere(0.3, 11.4, 0, 3.4)(x, y, z), -(x - 0.3) - 1.0, 0.9) },
      { name: "bill", k: 0.5, f: ellipsoid([3.75, 10.2, 0], [1.6, 0.7, 1.25], [0, 0, -0.12]) },
      { name: "eyes", k: 0.3, f: (x, y, z) => Math.min(ellipsoid([2.55, 11.7, 1.25], [0.45, 0.75, 0.35])(x, y, z), ellipsoid([2.55, 11.7, -1.25], [0.45, 0.75, 0.35])(x, y, z)) },
      { name: "wings", k: 0.8, f: (x, y, z) => Math.min(
        ellipsoid([0.3, 5.8, 3.3], [2.3, 1.2, 0.8], [0.25, 0, 0.7])(x, y, z),
        ellipsoid([0.3, 5.8, -3.3], [2.3, 1.2, 0.8], [-0.25, 0, 0.7])(x, y, z)) },
      { name: "hand", k: 0.6, f: sphere(2.4, 7.2, 3.5, 0.95) },
      { name: "legs", k: 0.5, f: (x, y, z) => Math.min(
        cone([0.4, 2.8, 1.4], [0.8, 1.2, 1.4], 0.75, 0.55)(x, y, z),
        cone([0.4, 2.8, -1.4], [0.8, 1.2, -1.4], 0.75, 0.55)(x, y, z)) },
      // Webbed feet as thin plates.
      { name: "feet", k: 0.5, f: (x, y, z) => Math.min(
        slab(ellipse2(1.6, 1.5, 1.9, 1.1), 0.22, (a, b, c) => [a, c, b - 1.05])(x, y, z),
        slab(ellipse2(1.6, -1.5, 1.9, 1.1), 0.22, (a, b, c) => [a, c, b - 1.05])(x, y, z)) },
      // A 0.6 mm handle and a 0.5 mm canopy: both too thin to cast.
      { name: "umbrella handle", k: 0.35, f: tube([[0.45, 5.5, 3.5], [0.7, 4.4, 3.5], [1.5, 4.0, 3.5], [2.05, 4.8, 3.5], [4.73, 17.8, 3.5]], [0.3, 0.3, 0.3, 0.3, 0.3]) },
      { name: "umbrella", k: 0.4, f: (x, y, z) => {
        const [u, v, w] = rot(0, 0, -0.22)(x - 3.55, y - 12.53, z - 3.5);
        return canopy([0, 0, 0], 5.4, 0.5, 2.3)(u, v, w);
      } },
    ],
  },
];

// ---------------------------------------------------------------------------
// Grid helpers.

function evaluate(piece, bounds) {
  const [x0, y0, z0g] = bounds.min;
  const nx = Math.ceil((bounds.max[0] - x0) / H) + 1, ny = Math.ceil((bounds.max[1] - y0) / H) + 1, nz = Math.ceil((bounds.max[2] - z0g) / H) + 1;
  const f = new Float32Array(nx * ny * nz);
  const owner = new Uint8Array(nx * ny * nz);
  const parts = piece.parts, count = parts.length;
  for (let k = 0; k < nz; k++) {
    const z = z0g + k * H;
    for (let j = 0; j < ny; j++) {
      const y = y0 + j * H;
      for (let i = 0; i < nx; i++) {
        const x = x0 + i * H;
        let d = Infinity, best = Infinity, who = 0;
        for (let n = 0; n < count; n++) {
          const p = parts[n], v = p.f(x, y, z);
          if (p.cut) d = smax(d, -v, p.k);
          else {
            d = p.k && d !== Infinity ? smin(d, v, p.k) : Math.min(d, v);
            if (v < best) { best = v; who = n; }
          }
        }
        const at = (k * ny + j) * nx + i;
        f[at] = d;
        owner[at] = who;
      }
    }
  }
  return { f, owner, nx, ny, nz, origin: [x0, y0, z0g] };
}

/** Coarse look for the sculpt's extent, so the fine grid only covers it. */
function extent(piece) {
  const step = 0.25, lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (let z = -16; z <= 16; z += step) for (let y = -10; y <= 22; y += step) for (let x = -16; x <= 16; x += step) {
    let d = Infinity;
    for (const p of piece.parts) {
      const v = p.f(x, y, z);
      d = p.cut ? smax(d, -v, p.k) : p.k && d !== Infinity ? smin(d, v, p.k) : Math.min(d, v);
    }
    if (d < step) { lo[0] = Math.min(lo[0], x); lo[1] = Math.min(lo[1], y); lo[2] = Math.min(lo[2], z); hi[0] = Math.max(hi[0], x); hi[1] = Math.max(hi[1], y); hi[2] = Math.max(hi[2], z); }
  }
  return { min: lo.map(v => v - 1.2), max: hi.map((v, i) => v + (i === 1 ? 2 * BAIL_R + 2 * BAIL_WIRE + 1.5 : 1.2)) };
}

/** Squared distance, in voxels², from every voxel to the nearest one where
    mask === target (Felzenszwalb and Huttenlocher, one axis at a time). */
function dist2(mask, target, nx, ny, nz) {
  const BIG = 1e20, n = Math.max(nx, ny, nz);
  const d = new Float64Array(nx * ny * nz);
  for (let i = 0; i < d.length; i++) d[i] = mask[i] === target ? 0 : BIG;
  const f = new Float64Array(n), out = new Float64Array(n), v = new Int32Array(n), z = new Float64Array(n + 1);
  const line = (start, stride, len) => {
    for (let q = 0; q < len; q++) f[q] = d[start + q * stride];
    let k = 0;
    v[0] = 0; z[0] = -BIG; z[1] = BIG;
    for (let q = 1; q < len; q++) {
      let s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
      while (s <= z[k]) { k--; s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]); }
      k++; v[k] = q; z[k] = s; z[k + 1] = BIG;
    }
    k = 0;
    for (let q = 0; q < len; q++) { while (z[k + 1] < q) k++; out[q] = (q - v[k]) * (q - v[k]) + f[v[k]]; }
    for (let q = 0; q < len; q++) d[start + q * stride] = out[q];
  };
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) line((k * ny + j) * nx, 1, nx);
  for (let k = 0; k < nz; k++) for (let i = 0; i < nx; i++) line(k * ny * nx + i, nx, ny);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) line(j * nx + i, nx * ny, nz);
  return d;
}

/** Box blur along each axis in turn, `passes` times (close to a Gaussian). */
function blur(a, nx, ny, nz, r, passes) {
  const n = Math.max(nx, ny, nz), line = new Float32Array(n), span = 2 * r + 1;
  const run = (start, stride, len) => {
    for (let q = 0; q < len; q++) line[q] = a[start + q * stride];
    let s = 0;
    for (let q = -r; q <= r; q++) s += line[Math.min(len - 1, Math.max(0, q))];
    for (let q = 0; q < len; q++) {
      a[start + q * stride] = s / span;
      s += line[Math.min(len - 1, q + r + 1)] - line[Math.max(0, q - r)];
    }
  };
  for (let p = 0; p < passes; p++) {
    for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) run((k * ny + j) * nx, 1, nx);
    for (let k = 0; k < nz; k++) for (let i = 0; i < nx; i++) run(k * ny * nx + i, nx, ny);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) run(j * nx + i, nx * ny, nz);
  }
}

/** 6-connected pieces of the voxels where mask is 1. */
function pieces(mask, nx, ny, nz) {
  const seen = new Uint8Array(mask.length), out = [];
  const stack = new Int32Array(mask.length);
  for (let s = 0; s < mask.length; s++) {
    if (!mask[s] || seen[s]) continue;
    let top = 0, count = 0, edge = false;
    const cells = [];
    stack[top++] = s; seen[s] = 1;
    while (top) {
      const c = stack[--top];
      cells.push(c); count++;
      const i = c % nx, j = Math.floor(c / nx) % ny, k = Math.floor(c / (nx * ny));
      if (i === 0 || j === 0 || k === 0 || i === nx - 1 || j === ny - 1 || k === nz - 1) edge = true;
      const ns = [i > 0 ? c - 1 : -1, i < nx - 1 ? c + 1 : -1, j > 0 ? c - nx : -1, j < ny - 1 ? c + nx : -1, k > 0 ? c - nx * ny : -1, k < nz - 1 ? c + nx * ny : -1];
      for (const q of ns) if (q >= 0 && mask[q] && !seen[q]) { seen[q] = 1; stack[top++] = q; }
    }
    out.push({ cells, edge, count });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Meshing: surface nets on the field, quads split into triangles.

function surfaceNets(f, nx, ny, nz, origin) {
  const at = (i, j, k) => (k * ny + j) * nx + i;
  const cellIndex = new Int32Array((nx - 1) * (ny - 1) * (nz - 1)).fill(-1);
  const cid = (i, j, k) => (k * (ny - 1) + j) * (nx - 1) + i;
  const pos = [];
  const corners = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
  const edges = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  const v = new Float64Array(8);
  for (let k = 0; k < nz - 1; k++) for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    let mask = 0;
    for (let c = 0; c < 8; c++) { v[c] = f[at(i + corners[c][0], j + corners[c][1], k + corners[c][2])]; if (v[c] < 0) mask |= 1 << c; }
    if (mask === 0 || mask === 255) continue;
    let sx = 0, sy = 0, sz = 0, n = 0;
    for (const [a, b] of edges) {
      if ((v[a] < 0) === (v[b] < 0)) continue;
      const t = v[a] / (v[a] - v[b]);
      sx += corners[a][0] + (corners[b][0] - corners[a][0]) * t;
      sy += corners[a][1] + (corners[b][1] - corners[a][1]) * t;
      sz += corners[a][2] + (corners[b][2] - corners[a][2]) * t;
      n++;
    }
    cellIndex[cid(i, j, k)] = pos.length / 3;
    pos.push(origin[0] + (i + sx / n) * H, origin[1] + (j + sy / n) * H, origin[2] + (k + sz / n) * H);
  }
  const tris = [];
  const dims = [nx, ny, nz];
  for (let k = 1; k < nz - 1; k++) for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) {
    const p = [i, j, k], here = f[at(i, j, k)];
    for (let a = 0; a < 3; a++) {
      const b = (a + 1) % 3, c = (a + 2) % 3;
      const q = [...p]; q[a]++;
      if (q[a] >= dims[a]) continue;
      const there = f[at(q[0], q[1], q[2])];
      if ((here < 0) === (there < 0)) continue;
      const quad = [[-1, -1], [0, -1], [0, 0], [-1, 0]].map(([ob, oc]) => {
        const cc = [...p]; cc[b] += ob; cc[c] += oc;
        return cellIndex[cid(cc[0], cc[1], cc[2])];
      });
      if (quad.some(x => x < 0)) continue;
      if (here >= 0) quad.reverse();
      tris.push(quad[0], quad[1], quad[2], quad[0], quad[2], quad[3]);
    }
  }
  return { pos: new Float32Array(pos), idx: new Uint32Array(tris) };
}

function taubin(pos, idx, rounds) {
  const n = pos.length / 3;
  const nbr = Array.from({ length: n }, () => new Set());
  for (let t = 0; t < idx.length; t += 3) for (let e = 0; e < 3; e++) { const a = idx[t + e], b = idx[t + ((e + 1) % 3)]; nbr[a].add(b); nbr[b].add(a); }
  const lists = nbr.map(s => [...s]);
  const tmp = new Float32Array(pos.length);
  const pass = (lam) => {
    for (let v = 0; v < n; v++) {
      const l = lists[v];
      if (!l.length) { tmp.set(pos.subarray(v * 3, v * 3 + 3), v * 3); continue; }
      let x = 0, y = 0, z = 0;
      for (const u of l) { x += pos[u * 3]; y += pos[u * 3 + 1]; z += pos[u * 3 + 2]; }
      for (const [o, s] of [[0, x], [1, y], [2, z]]) tmp[v * 3 + o] = pos[v * 3 + o] + lam * (s / l.length - pos[v * 3 + o]);
    }
    pos.set(tmp);
  };
  for (let r = 0; r < rounds; r++) { pass(0.5); pass(-0.53); }
}

function volumeOf(pos, idx) {
  let v = 0;
  for (let t = 0; t < idx.length; t += 3) {
    const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3;
    v += pos[a] * (pos[b + 1] * pos[c + 2] - pos[b + 2] * pos[c + 1])
      - pos[a + 1] * (pos[b] * pos[c + 2] - pos[b + 2] * pos[c])
      + pos[a + 2] * (pos[b] * pos[c + 1] - pos[b + 1] * pos[c]);
  }
  return v / 6;
}

/** Edges not used by exactly two triangles. Surface nets leaves a few used by
    four, where two sheets touch across a saddle; the shell is still closed. */
function openEdges(idx) {
  const count = new Map();
  for (let t = 0; t < idx.length; t += 3) for (let e = 0; e < 3; e++) {
    const a = idx[t + e], b = idx[t + ((e + 1) % 3)];
    const key = a < b ? a * 4294967296 + b : b * 4294967296 + a;
    count.set(key, (count.get(key) ?? 0) + 1);
  }
  let bad = 0;
  for (const c of count.values()) if (c !== 2) bad++;
  return bad;
}

const listOf = (names) => names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0];

// ---------------------------------------------------------------------------

await MeshoptSimplifier.ready;
await MeshoptEncoder.ready;
mkdirSync(outDir, { recursive: true });
const meta = {};

for (const piece of PIECES) {
  const t0 = Date.now();
  const bounds = extent(piece);
  const { f, owner, nx, ny, nz, origin } = evaluate(piece, bounds);
  const N = f.length;
  const solid = new Uint8Array(N);
  for (let i = 0; i < N; i++) solid[i] = f[i] < 0 ? 1 : 0;

  // 1. Thin parts: what an opening with a 0.8 mm ball removes.
  const dOut = dist2(solid, 0, nx, ny, nz);
  const eroded = new Uint8Array(N);
  for (let i = 0; i < N; i++) eroded[i] = solid[i] && dOut[i] > R2 ? 1 : 0;
  const dEr = dist2(eroded, 1, nx, ny, nz);
  const thin = new Uint8Array(N);
  for (let i = 0; i < N; i++) thin[i] = solid[i] && dEr[i] > R2 ? 1 : 0;
  const ridge = new Uint8Array(N);
  const thinNames = new Map();
  let thinVoxels = 0;
  for (const p of pieces(thin, nx, ny, nz)) {
    if (p.count < SIG) continue;
    thinVoxels += p.count;
    const votes = new Map();
    for (const c of p.cells) {
      votes.set(owner[c], (votes.get(owner[c]) ?? 0) + 1);
      const i = c % nx, j = Math.floor(c / nx) % ny, k = Math.floor(c / (nx * ny));
      if (i === 0 || j === 0 || k === 0 || i === nx - 1 || j === ny - 1 || k === nz - 1) continue;
      const d = dOut[c];
      if (d >= dOut[c - 1] && d >= dOut[c + 1] && d >= dOut[c - nx] && d >= dOut[c + nx] && d >= dOut[c - nx * ny] && d >= dOut[c + nx * ny]) ridge[c] = 1;
    }
    const top = [...votes.entries()].sort((a, b) => b[1] - a[1])[0][0];
    const name = piece.parts[top].name;
    thinNames.set(name, (thinNames.get(name) ?? 0) + p.count);
  }
  // Thicken: everything within 0.4 mm of a thin part's middle becomes metal.
  // The middle found on a grid is dotted, so its distance field is blurred a
  // little (about 0.2 mm) to make a smooth rod or plate rather than beads.
  const g = Float32Array.from(f);
  if (thinVoxels) {
    const dRidge = dist2(ridge, 1, nx, ny, nz);
    const t = new Float32Array(N);
    for (let i = 0; i < N; i++) t[i] = Math.min(Math.sqrt(dRidge[i]) * H, 1.2);
    blur(t, nx, ny, nz, 2, 3);
    for (let i = 0; i < N; i++) {
      const d = t[i] - MIN_FEATURE / 2 - H;
      if (d < 2 * H) g[i] = smin(g[i], d, 0.15);
    }
  }

  // 2. One piece of metal: drop what's loose, fill sealed voids.
  for (let i = 0; i < N; i++) solid[i] = g[i] < 0 ? 1 : 0;
  const parts = pieces(solid, nx, ny, nz).sort((a, b) => b.count - a.count);
  let loose = 0;
  for (const p of parts.slice(1)) { if (p.count >= SIG) loose++; for (const c of p.cells) g[c] = H; }
  const empty = new Uint8Array(N);
  for (let i = 0; i < N; i++) empty[i] = g[i] < 0 ? 0 : 1;
  let voids = 0;
  for (const p of pieces(empty, nx, ny, nz)) { if (p.edge) continue; if (p.count >= SIG) voids++; for (const c of p.cells) g[c] = -H; }

  // 3. The bail, straight above the centre of mass, so it hangs level.
  let mx = 0, mz = 0, count = 0;
  for (let i = 0; i < N; i++) if (g[i] < 0) { mx += i % nx; mz += Math.floor(i / (nx * ny)); count++; }
  mx /= count; mz /= count;
  const ci = Math.round(mx), ck = Math.round(mz);
  let topJ = -1;
  for (let j = ny - 1; j >= 0 && topJ < 0; j--) for (let di = -2; di <= 2; di++) if (g[(ck * ny + j) * nx + ci + di] < 0) { topJ = j; break; }
  const bx = origin[0] + mx * H, bz = origin[2] + mz * H, by = origin[1] + topJ * H + BAIL_R - 0.2;
  const bail = (x, y, z) => Math.hypot(Math.hypot(y - by, z - bz) - BAIL_R, x - bx) - BAIL_WIRE;
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const at = (k * ny + j) * nx + i;
    g[at] = smin(g[at], bail(origin[0] + i * H, origin[1] + j * H, origin[2] + k * H), 0.5);
  }

  // Check the rule again on the finished field: nothing thinner than 0.8 mm
  // should be left (rounding of a few voxels at sharp edges aside).
  for (let i = 0; i < N; i++) solid[i] = g[i] < 0 ? 1 : 0;
  const dOut2 = dist2(solid, 0, nx, ny, nz);
  for (let i = 0; i < N; i++) eroded[i] = solid[i] && dOut2[i] > R2 ? 1 : 0;
  const dEr2 = dist2(eroded, 1, nx, ny, nz);
  for (let i = 0; i < N; i++) thin[i] = solid[i] && dEr2[i] > R2 ? 1 : 0;
  const left = pieces(thin, nx, ny, nz).filter(p => p.count >= SIG);
  if (left.length) console.warn(`${piece.id}: still under ${MIN_FEATURE} mm after cleanup: ${left.map(p => `${(p.count * H ** 3).toFixed(2)} mm³ at ${piece.parts[owner[p.cells[0]]].name}`).join(", ")}`);

  // 4. Mesh, smooth, simplify.
  const net = surfaceNets(g, nx, ny, nz, origin);
  if (volumeOf(net.pos, net.idx) < 0) for (let t = 0; t < net.idx.length; t += 3) { const s = net.idx[t + 1]; net.idx[t + 1] = net.idx[t + 2]; net.idx[t + 2] = s; }
  taubin(net.pos, net.idx, 6);
  const [simple] = MeshoptSimplifier.simplify(net.idx, net.pos, 3, Math.round((net.idx.length / 3) * 0.08) * 3, 0.01, ["ErrorAbsolute"]);
  const [remap, unique] = MeshoptEncoder.reorderMesh(simple, true, true);
  const pos = new Float32Array(unique * 3);
  for (let v = 0; v < remap.length; v++) if (remap[v] !== 0xffffffff) pos.set(net.pos.subarray(v * 3, v * 3 + 3), remap[v] * 3);
  const volume = volumeOf(pos, simple);

  // Centre it: the bail's top at the top, the body's middle at x = z = 0.
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (let v = 0; v < unique; v++) for (let a = 0; a < 3; a++) { lo[a] = Math.min(lo[a], pos[v * 3 + a]); hi[a] = Math.max(hi[a], pos[v * 3 + a]); }
  const centre = [bx, (lo[1] + hi[1]) / 2, bz];
  for (let v = 0; v < unique; v++) for (let a = 0; a < 3; a++) pos[v * 3 + a] -= centre[a];
  const qmin = lo.map((v, a) => v - centre[a]), qmax = hi.map((v, a) => v - centre[a]);
  const q = new Uint16Array(unique * 4);
  for (let v = 0; v < unique; v++) for (let a = 0; a < 3; a++) q[v * 4 + a] = Math.round(((pos[v * 3 + a] - qmin[a]) / (qmax[a] - qmin[a])) * 65535);
  const vb = MeshoptEncoder.encodeVertexBuffer(new Uint8Array(q.buffer), unique, 8);
  const ib = MeshoptEncoder.encodeIndexBuffer(new Uint8Array(simple.buffer, simple.byteOffset, simple.byteLength), simple.length, 4);
  writeFileSync(path.join(outDir, `${piece.id}.bin`), Buffer.concat([Buffer.from(vb), Buffer.from(ib)]));

  const names = [...thinNames.keys()].map(n => `the ${n}`);
  const fixes = [
    names.length && `thickened ${listOf(names)} to ${MIN_FEATURE} mm`,
    loose && `dropped ${loose === 1 ? "a loose piece" : `${loose} loose pieces`}`,
    voids && `filled ${voids === 1 ? "a sealed void" : `${voids} sealed voids`}`,
  ].filter(Boolean);
  const list = listOf(fixes);
  const note = list ? `${list[0].toUpperCase()}${list.slice(1)}.` : `Nothing under ${MIN_FEATURE} mm, so nothing to fix.`;

  meta[piece.id] = {
    label: piece.label,
    after: piece.after,
    vertices: unique,
    triangles: simple.length / 3,
    vertexBytes: vb.length,
    indexBytes: ib.length,
    min: qmin.map(v => +v.toFixed(4)),
    max: qmax.map(v => +v.toFixed(4)),
    size: [hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]].map(v => +v.toFixed(2)),
    volume: +volume.toFixed(1),
    note,
  };
  console.log([...thinNames.entries()].map(([n, c]) => `${n} ${(c * H ** 3).toFixed(2)} mm³`).join(", "), "| edges shared by four:", openEdges(net.idx));
  console.log(`${piece.id}: grid ${nx}x${ny}x${nz}, ${net.idx.length / 3} -> ${simple.length / 3} triangles, ${unique} vertices, edges shared by four ${openEdges(simple)}, `
    + `${meta[piece.id].size.join(" x ")} mm, ${volume.toFixed(0)} mm³, ${vb.length + ib.length} bytes, ${((Date.now() - t0) / 1000).toFixed(1)} s. ${note}`);
}

writeFileSync(path.join(outDir, "charms.json"), JSON.stringify(meta, null, 2) + "\n");
console.log("wrote charms.json");
