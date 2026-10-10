import {
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  CylinderGeometry,
  Euler,
  Float32BufferAttribute,
  IcosahedronGeometry,
  Matrix4,
  Quaternion,
  SphereGeometry,
  TubeGeometry,
  Vector3,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// A pretzel built from one rope. Thin along x (x is "up" once laid flat),
// about .86 units across, bottom at x = -.11. Each chapter of the story gets
// its own kind: a coating, a topping and a slightly different twist.

export type PretzelKind = "salt" | "sprinkles" | "chocolate" | "everything" | "cinnamon" | "matcha" | "filler" | "logo";

type Topping = "salt" | "sprinkles" | "everything" | "cinnamon" | "none";
type Bake = "pale" | "golden" | "toasty" | "lye";
type Recipe = {
  topping: Topping;
  coat?: string;
  dip?: "half" | "full";
  drizzle?: string; // thin zigzag lines over the top
  bake?: Bake;
  rope?: number; // rope thickness, 1 = a classic soft pretzel
  size?: number; // across, 1 = .86 units
  wonk?: number; // how roughly it was twisted, 1 = a careful hand
  lift?: number; // how far the crossing rides over the rope beneath, 1 = baked flat
  score?: boolean; // a knife cut along the top of the belly that bursts open pale in the oven
  salt?: number; // how much salt, 1 = a light sprinkle
};

// Six pretzels that should be told apart at a glance from across the bowl:
// each differs in outline (size, rope, wonk) as well as finish.
const RECIPES: Record<PretzelKind, Recipe> = {
  // A kid's pretzel: small, chubby, all white and covered in sprinkles.
  sprinkles: { topping: "sprinkles", coat: "#f6f1e7", dip: "full", rope: 1.3, size: .82, wonk: 1.6 },
  // The textbook one: a big soft pretzel, golden, coarse salt.
  salt: { topping: "salt", bake: "golden", rope: 1.28, size: 1.16, wonk: .5 },
  // Made a million times over: fully enrobed, perfectly even, a neat drizzle.
  chocolate: { topping: "none", coat: "#3a2015", dip: "full", drizzle: "#f3efe6", rope: .92, size: 1, wonk: 0 },
  // Rough, everything seasoning all over, twisted in a hurry.
  everything: { topping: "everything", bake: "toasty", rope: 1.05, size: 1.02, wonk: 3 },
  // Thin and crunchy, pale, crusted in cinnamon sugar.
  cinnamon: { topping: "cinnamon", bake: "pale", rope: .78, size: .96, wonk: 1 },
  // Half dipped in matcha white chocolate, flaky salt, a white drizzle.
  matcha: { topping: "salt", coat: "#9bb46a", dip: "half", drizzle: "#f6f1e7", rope: 1, size: 1, wonk: .8 },
  // The bowl's plain filling: small, thin, crunchy, so the chapters stand out.
  filler: { topping: "salt", bake: "golden", rope: .82, size: .9, wonk: 1 },
  // The site's mark (rendered by app/logo-render): a real soft pretzel, lye-baked
  // dark with a pale split belly and coarse salt.
  logo: { topping: "salt", bake: "lye", rope: 1.3, size: 1, wonk: .9, lift: 1.4, score: true, salt: 1.8 },
};

const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// [across, along, height] in the pretzel's own plane. The rope starts at one
// end pressed onto the belly, crosses the middle, rises to the dip at the
// top, loops round one lobe, the belly and the other lobe, then comes back
// down over its first pass to end on the belly again: two loops on top, a
// small hole underneath.
const ROPE: [number, number, number][] = [
  [-.23, -.35, .07], [-.17, -.22, .035], [-.08, -.1, 0], [0, -.02, 0], [.07, .08, 0],
  [.1, .22, 0], [.17, .34, 0], [.3, .38, 0], [.42, .28, 0], [.46, .08, 0],
  [.42, -.15, 0], [.3, -.33, 0], [.1, -.42, 0], [-.1, -.42, 0], [-.3, -.33, 0],
  [-.42, -.15, 0], [-.46, .08, 0], [-.42, .28, 0], [-.3, .38, 0], [-.17, .34, 0],
  [-.1, .22, .02], [-.07, .08, .05], [0, -.02, .085], [.08, -.1, .07], [.17, -.22, .07],
  [.23, -.35, .075],
];

// Dough is fattest round the belly, thinner up the arms, tapered at the ends.
function thickness(t: number) {
  const belly = Math.exp(-(((t - .5) / .17) ** 2));
  const ends = Math.min(1, t / .06, (1 - t) / .06);
  return (.72 + .38 * belly) * (.72 + .28 * ends);
}

const RADIUS = .1;
const COAT_DEPTH = 1.08;
// [top crust, body, split] per bake.
const BAKES: Record<Bake, [Color, Color, Color]> = {
  pale: [new Color("#a8642a"), new Color("#d39a55"), new Color("#f2d6a2")],
  golden: [new Color("#7a3410"), new Color("#b0601f"), new Color("#e8b574")],
  toasty: [new Color("#5a2a10"), new Color("#8f4f22"), new Color("#d8a46a")],
  lye: [new Color("#2e1104"), new Color("#8a4618"), new Color("#ecc996")],
};
const SPRINKLES = ["#f4a7c3", "#8fc9f0", "#f7dd6b", "#9ad8b4", "#ffffff", "#f6a35c"].map(c => new Color(c));

function colourise(geometry: BufferGeometry, colour: Color) {
  const count = geometry.getAttribute("position").count;
  const values = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) colour.toArray(values, i * 3);
  geometry.setAttribute("color", new Float32BufferAttribute(values, 3));
  return geometry;
}

// The colours a chapter's coating and drizzle are made in, for their materials.
export function pretzelFinish(kind: PretzelKind) {
  const { coat, drizzle } = RECIPES[kind];
  return { coat, drizzle };
}

export function createPretzelGeometry(lowDetail: boolean, kind: PretzelKind = "salt", seed = 0) {
  const recipe = RECIPES[kind];
  const [DARK, BAKED, GOLDEN] = BAKES[recipe.bake ?? "golden"];
  const rope = RADIUS * (recipe.rope ?? 1);
  // Each pretzel is twisted by hand, so no two quite match.
  const wonk = .03 * (recipe.wonk ?? 1);
  const curve = new CatmullRomCurve3(ROPE.map(([u, v, h], i) => new Vector3(
    h * (recipe.lift ?? 1),
    v + (rand(seed * 31 + i) - .5) * wonk,
    u + (rand(seed * 17 + i + 5) - .5) * wonk,
  )), false, "centripetal");
  const segments = lowDetail ? 140 : 260;
  const radial = lowDetail ? 10 : 18;

  // Half-dipped pretzels are dipped belly first, up to just below the twist.
  const dipLine = -.04 + (rand(seed + 3) - .5) * .06;
  const coated = (p: Vector3) => !!recipe.coat && (recipe.dip === "full" || p.y < dipLine);

  // The dough, baked. Coatings and drizzle are separate layers on top.
  const tube = new TubeGeometry(curve, segments, rope, radial, false);
  const position = tube.getAttribute("position");
  const normal = tube.getAttribute("normal");
  const uv = tube.getAttribute("uv");
  const colors: number[] = [];
  const centre = new Vector3(), p = new Vector3(), n = new Vector3(), c = new Color();
  for (let i = 0; i < position.count; i++) {
    const t = uv.getX(i);
    curve.getPointAt(t, centre);
    n.fromBufferAttribute(normal, i);
    const ring = Math.floor(i / (radial + 1));
    // The score runs along the crown of the belly, ragged at the edges.
    const score = recipe.score
      ? Math.max(0, 1 - Math.acos(Math.min(1, Math.max(-1, n.x))) / (.3 + .14 * rand(ring * .53 + seed))) * Math.max(0, 1 - Math.abs(t - .5) / .15) ** .4
      : 0;
    p.fromBufferAttribute(position, i).sub(centre).multiplyScalar(thickness(t) * (1 - .05 * Math.min(1, score * 2.2))).add(centre);
    position.setXYZ(i, p.x, p.y, p.z);
    // Tops bake dark and glossy; the sides of the belly split open pale
    // where the dough stretched in the oven.
    const up = n.x;
    const crack = Math.max(0, 1 - Math.abs(up + .05) / .35) * Math.exp(-(((t - .5) / .22) ** 2)) * (.55 + .45 * rand(ring * .37 + seed));
    c.copy(BAKED).lerp(DARK, Math.max(0, up) * .55).lerp(GOLDEN, recipe.score ? Math.min(1, Math.max(0, score * 4 - .6)) : crack);
    // The crust darkens where it tore open, like the edge of a split loaf.
    if (recipe.score && score > 0 && score < .3) c.multiplyScalar(.8);
    c.multiplyScalar(.92 + rand(i) * .12);
    colors.push(c.r, c.g, c.b);
  }
  // Normals are kept from the even tube: recomputing them would show the seam.
  tube.setAttribute("color", new Float32BufferAttribute(colors, 3));
  tube.deleteAttribute("uv");
  // Round the two cut ends.
  const caps = [0, 1].map(t => {
    const point = curve.getPointAt(t);
    const cap = new SphereGeometry(rope * thickness(t), 12, 8);
    cap.translate(point.x, point.y, point.z);
    cap.deleteAttribute("uv");
    return colourise(cap, BAKED);
  });
  const dough = mergeGeometries([tube, ...caps])!;

  const coat = recipe.coat ? coatGeometry(curve, coated, rope, segments, radial) : null;
  const drizzle = recipe.drizzle ? drizzleGeometry(curve, coated, rope, seed, lowDetail) : null;
  const toppings = toppingGeometry(recipe, curve, coated, seed, lowDetail, rope);

  // Fit to one frame: .86 across times the recipe's size, resting on x = -.11.
  dough.computeBoundingBox();
  const box = dough.boundingBox!;
  const scale = .86 * (recipe.size ?? 1) / Math.max(box.max.y - box.min.y, box.max.z - box.min.z);
  const mid = box.getCenter(new Vector3());
  const layers = [dough, toppings, coat, drizzle].filter((g): g is BufferGeometry => !!g);
  for (const g of layers) {
    g.translate(-mid.x, -mid.y, -mid.z);
    g.scale(scale, scale, scale);
  }
  dough.computeBoundingBox();
  const lift = -.11 - dough.boundingBox!.min.x;
  for (const g of layers) g.translate(lift, 0, 0);
  for (const g of [tube, ...caps]) g.dispose();
  return { dough, toppings, coat, drizzle };
}

// The dip: a shell over the coated stretches of rope, standing proud of the
// dough. Where the dip stops it thins to a rounded lip instead of a step.
function coatGeometry(curve: CatmullRomCurve3, coated: (p: Vector3) => boolean, rope: number, segments: number, radial: number) {
  const shell = new TubeGeometry(curve, segments, 1, radial, false);
  const rings = Array.from({ length: segments + 1 }, (_, i) => coated(curve.getPointAt(i / segments)));
  // Rings from the nearest bare one: the lip swells over the first few.
  const edge = rings.map((_, i) => {
    let k = 0;
    while (k < 4 && rings[i - k - 1] !== false && rings[i + k + 1] !== false) k++;
    return k;
  });
  const position = shell.getAttribute("position");
  const centre = new Vector3(), p = new Vector3();
  for (let i = 0; i < position.count; i++) {
    const ring = Math.floor(i / (radial + 1));
    const t = ring / segments;
    curve.getPointAt(t, centre);
    const swell = COAT_DEPTH - .05 * (1 - edge[ring] / 4);
    p.fromBufferAttribute(position, i).sub(centre).multiplyScalar(rope * thickness(t) * swell).add(centre);
    position.setXYZ(i, p.x, p.y, p.z);
  }
  // Keep only the faces between two coated rings.
  const index = shell.getIndex()!;
  const kept: number[] = [];
  for (let f = 0; f < index.count; f += 3) {
    const a = index.getX(f), b = index.getX(f + 1), d = index.getX(f + 2);
    const ring = Math.min(a, b, d) / (radial + 1) | 0;
    if (rings[ring] && rings[ring + 1]) kept.push(a, b, d);
  }
  shell.setIndex(kept);
  shell.deleteAttribute("uv");
  const parts: BufferGeometry[] = [shell];
  for (const t of [0, 1]) {
    const point = curve.getPointAt(t);
    if (!coated(point)) continue;
    const cap = new SphereGeometry(rope * thickness(t) * COAT_DEPTH, 14, 10);
    cap.translate(point.x, point.y, point.z);
    cap.deleteAttribute("uv");
    parts.push(cap);
  }
  return mergeGeometries(parts)!;
}

// Drizzle: thin strands of icing piped back and forth across the pretzel.
// Each strand follows the top of whatever rope is under it and breaks where
// it would cross a hole, the way icing does when it falls through.
function drizzleGeometry(curve: CatmullRomCurve3, coated: (p: Vector3) => boolean, rope: number, seed: number, lowDetail: boolean) {
  const samples = Array.from({ length: 500 }, (_, i) => {
    const t = i / 499;
    const point = curve.getPointAt(t);
    return { point, radius: rope * thickness(t) * (coated(point) ? COAT_DEPTH : 1) };
  });
  // Height of the pretzel's top surface over a point in its plane, if any.
  const top = (y: number, z: number) => {
    let best = -Infinity;
    for (const { point, radius } of samples) {
      const d2 = (y - point.y) ** 2 + (z - point.z) ** 2;
      const r = radius * .82; // stay on the crown, not down the sides
      if (d2 < r * r) best = Math.max(best, point.x + Math.sqrt(radius * radius - d2));
    }
    return best;
  };
  const strand = .011;
  const strands: BufferGeometry[] = [];
  const lines = 9;
  for (let l = 0; l < lines; l++) {
    // Diagonal passes, each a little uneven, like a hand with a piping bag.
    const offset = -.5 + (l + .5) / lines + (rand(seed * 13 + l) - .5) * .04;
    const tilt = .9 + (rand(seed * 7 + l) - .5) * .25;
    let run: Vector3[] = [];
    const flush = () => {
      if (run.length >= 4) {
        const path = new CatmullRomCurve3(run);
        const tube = new TubeGeometry(path, run.length * 2, strand, lowDetail ? 5 : 7, false);
        for (const end of [run[0], run[run.length - 1]]) {
          const blob = new SphereGeometry(strand * 1.1, 8, 6);
          blob.translate(end.x, end.y, end.z);
          strands.push(blob);
        }
        strands.push(tube);
      }
      run = [];
    };
    for (let k = 0; k <= 90; k++) {
      const s = -.6 + k / 90 * 1.2;
      const z = offset + s * Math.cos(tilt) + Math.sin(s * 9 + l) * .012;
      const y = s * Math.sin(tilt);
      const h = top(y, z);
      if (h === -Infinity) { flush(); continue; }
      run.push(new Vector3(h + strand * .4, y, z));
    }
    flush();
  }
  if (!strands.length) return null;
  for (const g of strands) g.deleteAttribute("uv");
  const merged = mergeGeometries(strands)!;
  for (const g of strands) g.dispose();
  return merged;
}

// Toppings sit on the upper half of the rope. Dipped pretzels only carry them
// on the coating, where they would stick in a real kitchen.
function toppingGeometry(recipe: Recipe, curve: CatmullRomCurve3, coated: (p: Vector3) => boolean, seed: number, lowDetail: boolean, rope: number) {
  const counts: Record<Topping, number> = { salt: 18, sprinkles: 46, everything: 170, cinnamon: 150, none: 0 };
  const count = Math.round(counts[recipe.topping] * (recipe.salt ?? 1) * (lowDetail ? .6 : 1));
  const pieces: BufferGeometry[] = [];
  const centre = new Vector3(), tangent = new Vector3(), side = new Vector3(), up = new Vector3(1, 0, 0);
  const dir = new Vector3(), p = new Vector3(), m = new Matrix4(), q = new Quaternion(), along = new Quaternion();
  for (let i = 0; pieces.length < count && i < count * 6; i++) {
    const r = (k: number) => rand(seed * 101 + i * 7.3 + k);
    const t = .04 + r(1) * .92;
    curve.getPointAt(t, centre);
    if (recipe.dip && !coated(centre)) continue;
    curve.getTangentAt(t, tangent);
    side.crossVectors(tangent, up).normalize();
    const angle = (r(2) - .5) * (recipe.topping === "salt" ? 1.6 : 2.4);
    dir.copy(up).multiplyScalar(Math.cos(angle)).addScaledVector(side, Math.sin(angle)).normalize();
    const surface = rope * thickness(t) * (coated(centre) ? COAT_DEPTH : 1);
    p.copy(centre).addScaledVector(dir, surface * .97);
    q.setFromEuler(new Euler(r(3) * 6, r(4) * 6, r(5) * 6));

    let piece: BufferGeometry;
    let colour: Color;
    const kind = recipe.topping === "everything" ? (r(6) < .45 ? "sesame" : r(6) < .85 ? "poppy" : "salt") : recipe.topping;
    if (kind === "salt") {
      const size = .02 + r(7) * .014;
      piece = new IcosahedronGeometry(1, 0);
      m.compose(p, q, new Vector3(size, size * (.7 + r(8) * .5), size * (.8 + r(9) * .4)));
      colour = new Color("#fbfaf6");
    } else if (kind === "sesame") {
      piece = new SphereGeometry(1, 6, 4).toNonIndexed();
      // Seeds lie flat on the surface, turned any way round.
      along.setFromUnitVectors(new Vector3(0, 0, 1), dir).multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), r(7) * 6));
      m.compose(p, along, new Vector3(.03, .018, .008));
      colour = new Color(r(8) < .5 ? "#eadcb4" : "#d9c08a");
    } else if (kind === "poppy") {
      piece = new SphereGeometry(1, 5, 3).toNonIndexed();
      m.compose(p, q, new Vector3(.011, .011, .011));
      colour = new Color("#1f1d24");
    } else if (kind === "sprinkles") {
      piece = new CylinderGeometry(1, 1, 1, 6).toNonIndexed();
      // Lying on the coating: the stick's axis is perpendicular to the surface normal.
      const lying = new Vector3().crossVectors(dir, tangent).normalize().applyAxisAngle(dir, r(7) * 6);
      along.setFromUnitVectors(new Vector3(0, 1, 0), lying);
      m.compose(p.addScaledVector(dir, .004), along, new Vector3(.008, .045, .008));
      colour = SPRINKLES[Math.floor(r(8) * SPRINKLES.length)];
    } else {
      const size = .006 + r(7) * .006;
      piece = new IcosahedronGeometry(1, 0);
      m.compose(p, q, new Vector3(size, size, size));
      colour = new Color(r(8) < .55 ? "#f6efe2" : "#8a4b22");
    }
    piece.applyMatrix4(m);
    if (piece.hasAttribute("uv")) piece.deleteAttribute("uv");
    pieces.push(colourise(piece, colour));
  }
  // A pretzel with no topping still hands back a (degenerate) mesh.
  if (!pieces.length) pieces.push(colourise(new IcosahedronGeometry(0, 0), new Color()));
  const merged = mergeGeometries(pieces)!;
  merged.computeVertexNormals();
  for (const piece of pieces) piece.dispose();
  return merged;
}
