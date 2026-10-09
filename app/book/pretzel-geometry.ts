import {
  BufferGeometry,
  CatmullRomCurve3,
  Color,
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

// A pretzel built from one rope, replacing a low-poly model that looked faceted
// once the book was rendered sharp. Same frame as the old model so the pile
// code is unchanged: thin along x (x is "up" once laid flat), about .86 units
// across, bottom at x = -.11.

const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// [across, along, height] in the pretzel's own plane. The rope starts at one
// end pressed onto the belly, rises through the twist, loops round the two
// lobes and the belly, and comes back through the twist (over the first pass)
// to end on the belly again.
const ROPE: [number, number, number][] = [
  [-.19, -.33, .07], [-.15, -.2, .03], [-.08, -.04, 0], [0, .08, 0], [.11, .23, 0],
  [.24, .35, 0], [.37, .31, 0], [.44, .12, 0], [.41, -.12, 0], [.29, -.32, 0],
  [.1, -.41, 0], [-.1, -.41, 0], [-.29, -.32, 0], [-.41, -.12, 0], [-.44, .12, 0],
  [-.37, .31, 0], [-.24, .35, 0], [-.11, .23, .03], [0, .08, .085], [.08, -.04, .06],
  [.15, -.2, .07], [.19, -.33, .075],
];

// Dough is fattest round the belly, thinner up the arms, tapered at the ends.
function thickness(t: number) {
  const belly = Math.exp(-(((t - .5) / .17) ** 2));
  const ends = Math.min(1, t / .06, (1 - t) / .06);
  return (.72 + .38 * belly) * (.72 + .28 * ends);
}

const RADIUS = .1;
const DARK = new Color("#7a3410");
const BAKED = new Color("#b0601f");
const GOLDEN = new Color("#e8b574");

export function createPretzelGeometry(lowDetail: boolean) {
  const curve = new CatmullRomCurve3(ROPE.map(([u, v, h]) => new Vector3(h, v, u)), false, "centripetal");
  const segments = lowDetail ? 140 : 260;
  const tube = new TubeGeometry(curve, segments, RADIUS, lowDetail ? 10 : 18, false);

  const position = tube.getAttribute("position");
  const normal = tube.getAttribute("normal");
  const uv = tube.getAttribute("uv");
  const colors: number[] = [];
  const centre = new Vector3(), p = new Vector3(), n = new Vector3(), c = new Color();
  for (let i = 0; i < position.count; i++) {
    const t = uv.getX(i);
    curve.getPointAt(t, centre);
    p.fromBufferAttribute(position, i).sub(centre).multiplyScalar(thickness(t)).add(centre);
    position.setXYZ(i, p.x, p.y, p.z);
    n.fromBufferAttribute(normal, i);
    // Tops bake dark and glossy; the sides of the belly split open pale where
    // the dough stretched in the oven.
    const up = n.x;
    const ring = Math.floor(i / (tube.parameters.radialSegments + 1));
    const crack = Math.max(0, 1 - Math.abs(up + .05) / .35) * Math.exp(-(((t - .5) / .22) ** 2)) * (.55 + .45 * rand(ring * .37));
    c.copy(BAKED).lerp(DARK, Math.max(0, up) * .55).lerp(GOLDEN, crack);
    c.multiplyScalar(.92 + rand(i) * .12);
    colors.push(c.r, c.g, c.b);
  }
  // Normals are kept from the even tube: recomputing them would show the seam.
  tube.setAttribute("color", new Float32BufferAttribute(colors, 3));

  // Round the two cut ends.
  const caps = [0, 1].map(t => {
    const cap = new SphereGeometry(RADIUS * thickness(t), 12, 8);
    cap.translate(...curve.getPointAt(t).toArray());
    const count = cap.getAttribute("position").count;
    cap.setAttribute("color", new Float32BufferAttribute(Array.from({ length: count }, () => BAKED.toArray()).flat(), 3));
    cap.deleteAttribute("uv");
    return cap;
  });
  tube.deleteAttribute("uv");
  const dough = mergeGeometries([tube, ...caps])!;

  // Coarse salt on the upper half of the rope, mostly round the belly.
  const crystals: BufferGeometry[] = [];
  const crystalCount = lowDetail ? 10 : 18;
  const tangent = new Vector3(), side = new Vector3(), upAxis = new Vector3(1, 0, 0), dir = new Vector3(), m = new Matrix4(), q = new Quaternion();
  for (let i = 0; i < crystalCount; i++) {
    const t = .12 + rand(i * 3.1 + 1) * .76;
    curve.getPointAt(t, centre);
    curve.getTangentAt(t, tangent);
    side.crossVectors(tangent, upAxis).normalize();
    const angle = (rand(i * 5.3 + 2) - .5) * 1.6;
    dir.copy(upAxis).multiplyScalar(Math.cos(angle)).addScaledVector(side, Math.sin(angle)).normalize();
    p.copy(centre).addScaledVector(dir, RADIUS * thickness(t) * .96);
    const size = .02 + rand(i * 7.7 + 3) * .014;
    q.setFromEuler(new Euler(rand(i) * 6, rand(i + 9) * 6, rand(i + 17) * 6));
    m.compose(p, q, new Vector3(size, size * (.7 + rand(i + 4) * .5), size * (.8 + rand(i + 6) * .4)));
    crystals.push(new IcosahedronGeometry(1, 0).applyMatrix4(m));
  }
  const salt = mergeGeometries(crystals)!;

  // Fit to the old model's frame: .86 across, resting on x = -.11.
  dough.computeBoundingBox();
  const box = dough.boundingBox!;
  const span = Math.max(box.max.y - box.min.y, box.max.z - box.min.z);
  const scale = .86 / span;
  const mid = box.getCenter(new Vector3());
  for (const g of [dough, salt]) {
    g.translate(-mid.x, -mid.y, -mid.z);
    g.scale(scale, scale, scale);
  }
  dough.computeBoundingBox();
  const lift = -.11 - dough.boundingBox!.min.x;
  dough.translate(lift, 0, 0);
  salt.translate(lift, 0, 0);
  for (const g of [tube, ...caps, ...crystals]) g.dispose();
  return { dough, salt };
}
