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

export type PretzelKind = "salt" | "sprinkles" | "chocolate" | "everything" | "cinnamon" | "mauve";

type Topping = "salt" | "sprinkles" | "everything" | "cinnamon" | "none";
type Recipe = { coat?: string; dip?: "half" | "full"; topping: Topping };

const RECIPES: Record<PretzelKind, Recipe> = {
  salt: { topping: "salt" },
  sprinkles: { coat: "#f3efe6", dip: "half", topping: "sprinkles" },
  chocolate: { coat: "#3a2015", dip: "half", topping: "none" },
  everything: { topping: "everything" },
  cinnamon: { topping: "cinnamon" },
  mauve: { coat: "#b482aa", dip: "half", topping: "salt" },
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
const DARK = new Color("#7a3410");
const BAKED = new Color("#b0601f");
const GOLDEN = new Color("#e8b574");
const SPRINKLES = ["#f4a7c3", "#8fc9f0", "#f7dd6b", "#9ad8b4", "#ffffff", "#c9a2c2"].map(c => new Color(c));

function colourise(geometry: BufferGeometry, colour: Color) {
  const count = geometry.getAttribute("position").count;
  const values = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) colour.toArray(values, i * 3);
  geometry.setAttribute("color", new Float32BufferAttribute(values, 3));
  return geometry;
}

export function createPretzelGeometry(lowDetail: boolean, kind: PretzelKind = "salt", seed = 0) {
  const recipe = RECIPES[kind];
  const coat = recipe.coat ? new Color(recipe.coat) : null;
  // Each pretzel is twisted by hand, so no two quite match.
  const curve = new CatmullRomCurve3(ROPE.map(([u, v, h], i) => new Vector3(
    h,
    v + (rand(seed * 31 + i) - .5) * .03,
    u + (rand(seed * 17 + i + 5) - .5) * .03,
  )), false, "centripetal");
  const segments = lowDetail ? 140 : 260;
  const radial = lowDetail ? 10 : 18;
  const tube = new TubeGeometry(curve, segments, RADIUS, radial, false);

  // Half-dipped pretzels are dipped belly first, up to just below the twist.
  const dipLine = -.04 + (rand(seed + 3) - .5) * .06;
  const coated = (p: Vector3) => !!coat && (recipe.dip === "full" || p.y < dipLine);

  const position = tube.getAttribute("position");
  const normal = tube.getAttribute("normal");
  const uv = tube.getAttribute("uv");
  const colors: number[] = [];
  const centre = new Vector3(), p = new Vector3(), n = new Vector3(), c = new Color();
  for (let i = 0; i < position.count; i++) {
    const t = uv.getX(i);
    curve.getPointAt(t, centre);
    const isCoated = coated(centre);
    p.fromBufferAttribute(position, i).sub(centre).multiplyScalar(thickness(t) * (isCoated ? COAT_DEPTH : 1)).add(centre);
    position.setXYZ(i, p.x, p.y, p.z);
    n.fromBufferAttribute(normal, i);
    if (isCoated) {
      c.copy(coat!).multiplyScalar(.96 + rand(i) * .06);
    } else {
      // Tops bake dark and glossy; the sides of the belly split open pale
      // where the dough stretched in the oven.
      const up = n.x;
      const ring = Math.floor(i / (radial + 1));
      const crack = Math.max(0, 1 - Math.abs(up + .05) / .35) * Math.exp(-(((t - .5) / .22) ** 2)) * (.55 + .45 * rand(ring * .37 + seed));
      c.copy(BAKED).lerp(DARK, Math.max(0, up) * .55).lerp(GOLDEN, crack);
      if (recipe.topping === "cinnamon") c.lerp(DARK, .25);
      c.multiplyScalar(.92 + rand(i) * .12);
    }
    colors.push(c.r, c.g, c.b);
  }
  // Normals are kept from the even tube: recomputing them would show the seam.
  tube.setAttribute("color", new Float32BufferAttribute(colors, 3));

  // Round the two cut ends.
  const caps = [0, 1].map(t => {
    const point = curve.getPointAt(t);
    const cap = new SphereGeometry(RADIUS * thickness(t) * (coated(point) ? COAT_DEPTH : 1), 12, 8);
    cap.translate(point.x, point.y, point.z);
    cap.deleteAttribute("uv");
    return colourise(cap, coated(point) ? coat! : BAKED);
  });
  tube.deleteAttribute("uv");
  const dough = mergeGeometries([tube, ...caps])!;

  const toppings = toppingGeometry(recipe, curve, coated, seed, lowDetail);

  // Fit to one frame: .86 across, resting on x = -.11.
  dough.computeBoundingBox();
  const box = dough.boundingBox!;
  const scale = .86 / Math.max(box.max.y - box.min.y, box.max.z - box.min.z);
  const mid = box.getCenter(new Vector3());
  for (const g of [dough, toppings]) {
    g.translate(-mid.x, -mid.y, -mid.z);
    g.scale(scale, scale, scale);
  }
  dough.computeBoundingBox();
  const lift = -.11 - dough.boundingBox!.min.x;
  dough.translate(lift, 0, 0);
  toppings.translate(lift, 0, 0);
  for (const g of [tube, ...caps]) g.dispose();
  return { dough, toppings };
}

// Toppings sit on the upper half of the rope. Dipped pretzels only carry them
// on the coating, where they would stick in a real kitchen.
function toppingGeometry(recipe: Recipe, curve: CatmullRomCurve3, coated: (p: Vector3) => boolean, seed: number, lowDetail: boolean) {
  const counts: Record<Topping, number> = { salt: 18, sprinkles: 46, everything: 54, cinnamon: 150, none: 0 };
  const count = Math.round(counts[recipe.topping] * (lowDetail ? .6 : 1));
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
    const surface = RADIUS * thickness(t) * (coated(centre) ? COAT_DEPTH : 1);
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
      m.compose(p, along, new Vector3(.022, .013, .006));
      colour = new Color(r(8) < .5 ? "#eadcb4" : "#d9c08a");
    } else if (kind === "poppy") {
      piece = new SphereGeometry(1, 5, 3).toNonIndexed();
      m.compose(p, q, new Vector3(.008, .008, .008));
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
