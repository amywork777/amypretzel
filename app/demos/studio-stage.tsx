"use client";

import { useEffect, useRef, useState } from "react";
import type * as THREE_NS from "three";
import { Sheet } from "./studio-parts";

/* The linear stage from Amy's assembly demo (2026-11-19), to turn over: 25
   parts, a NEMA 17 driving a Tr8x8 lead screw, the carriage on two 8 mm rods.
   linear-stage.glb is that project's assembly exported by the same CAD engine
   Studio runs (text-to-cad's `model.export`), not remodelled: the part names
   and colours are the engine's own. Drag to turn it, pull the parts apart,
   and pick a kind of part to light it up; its size comes from its geometry.

   three.js loads only once the viewer is near the screen. Before that, and
   with no WebGL, a still of the same scene stands in (linear-stage.webp). */

type Kind = { id: string; label: string };
// Node names in the GLB, by prefix, to plain words.
const KINDS: Kind[] = [
  { id: "base_plate", label: "Base plate" },
  { id: "end_block", label: "End blocks" },
  { id: "motor_bracket", label: "Motor bracket" },
  { id: "nema17_motor", label: "NEMA 17 motor" },
  { id: "shaft_coupler", label: "Coupler" },
  { id: "lead_screw", label: "Lead screw" },
  { id: "t8_nut", label: "T8 nut" },
  { id: "carriage", label: "Carriage" },
  { id: "guide_rod", label: "Guide rods" },
  { id: "lm8uu", label: "LM8UU bushings" },
  { id: "bearing_608", label: "608 bearings" },
  { id: "m5x12_screw", label: "M5 screws" },
  { id: "m3x10_screw", label: "M3 screws" },
];
const kindOf = (name: string) => KINDS.find(k => name.startsWith(k.id))?.id ?? "";

type Api = { setExplode: (v: number) => void; setPick: (id: string | null) => void; sizes: Record<string, { count: number; size: string }>; dispose: () => void };

async function mount(canvas: HTMLCanvasElement, onReady: () => void, onTouch: () => void): Promise<Api> {
  const THREE = await import("three");
  const [{ GLTFLoader }, { OrbitControls }, { RoomEnvironment }] = await Promise.all([
    import("three/examples/jsm/loaders/GLTFLoader.js"),
    import("three/examples/jsm/controls/OrbitControls.js"),
    import("three/examples/jsm/environments/RoomEnvironment.js"),
  ]);
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const sun = new THREE.DirectionalLight(0xffffff, 1.4);
  sun.position.set(2, 4, 3);
  scene.add(sun, new THREE.HemisphereLight(0xffffff, 0xd8d8d8, 0.6));

  const gltf = await new GLTFLoader().loadAsync("/software/studio/linear-stage.glb");
  const root = gltf.scene;
  // Centre the assembly on the origin, sitting on y = 0.
  const box0 = new THREE.Box3().setFromObject(root);
  const c0 = box0.getCenter(new THREE.Vector3());
  root.position.sub(c0);
  const holder = new THREE.Group();
  holder.add(root);
  scene.add(holder);
  holder.updateMatrixWorld(true);
  const span = box0.getSize(new THREE.Vector3());
  const big = Math.max(span.x, span.y, span.z);
  // The engine writes metres; sizes read in millimetres.
  const toMm = big < 5 ? 1000 : 1;

  // Each named part: its home position, which way it moves when the stage is
  // pulled apart (away from the centre, mostly upward so it reads as an
  // exploded view), its materials so they can be ghosted, and its outline.
  type Part = { obj: THREE_NS.Object3D; kind: string; home: THREE_NS.Vector3; dir: THREE_NS.Vector3; mats: THREE_NS.MeshStandardMaterial[] };
  const parts: Part[] = [];
  const sizes: Api["sizes"] = {};
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x1c1c1c, transparent: true, opacity: 0.28 });
  const named = root.children.length === 1 && root.children[0].children.length > 1 ? root.children[0].children : root.children;
  named.forEach(obj => {
    const kind = kindOf(obj.name);
    const b = new THREE.Box3().setFromObject(obj);
    const centre = b.getCenter(new THREE.Vector3());
    // In the world (centred), as a fraction of the assembly's size: out
    // sideways a little, up by how high the part sits, the base plate down.
    const t = (centre.y + span.y / 2) / Math.max(span.y, 1e-6);
    const world = kind === "base_plate"
      ? new THREE.Vector3(0, -0.06 * big, 0)
      : new THREE.Vector3(centre.x * 0.25, (0.04 + t * 0.22) * big, centre.z * 0.6);
    const parent = obj.parent!;
    const dir = parent.worldToLocal(world.clone()).sub(parent.worldToLocal(new THREE.Vector3()));
    const mats: THREE_NS.MeshStandardMaterial[] = [];
    obj.traverse(o => {
      const mesh = o as THREE_NS.Mesh;
      if (!mesh.isMesh) return;
      const m = (mesh.material as THREE_NS.MeshStandardMaterial).clone();
      m.transparent = true;
      m.side = THREE.DoubleSide; // the vendor motor STEP has some faces wound inside out
      mesh.material = m;
      mats.push(m);
      mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 28), edgeMat));
    });
    parts.push({ obj, kind, home: obj.position.clone(), dir, mats });
    const s = b.getSize(new THREE.Vector3()).multiplyScalar(toMm);
    const dims = [s.x, s.y, s.z].sort((p, q) => q - p).map(v => (v >= 10 ? Math.round(v) : Math.round(v * 10) / 10));
    const prev = sizes[kind];
    sizes[kind] = { count: (prev?.count ?? 0) + 1, size: prev?.size ?? `${dims.join(" × ")} mm` };
  });

  const camera = new THREE.PerspectiveCamera(30, 16 / 9, big / 100, big * 20);
  camera.position.set(0.55, 0.42, 0.72).normalize().multiplyScalar(big * 1.8);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = big * 0.6;
  controls.maxDistance = big * 4;
  controls.autoRotate = !reduce;
  controls.autoRotateSpeed = 0.6;
  controls.addEventListener("start", () => { controls.autoRotate = false; onTouch(); });

  let explode = 0, explodeTo = 0, pick: string | null = null;
  const applyPick = () => {
    for (const p of parts) {
      const on = !pick || p.kind === pick;
      for (const m of p.mats) { m.opacity = on ? 1 : 0.12; m.depthWrite = on; }
    }
  };

  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  // Draw only while on screen.
  let visible = true;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
  io.observe(canvas);
  let raf = 0, first = true;
  const loop = () => {
    raf = requestAnimationFrame(loop);
    if (!visible) return;
    explode += (explodeTo - explode) * (reduce ? 1 : 0.12);
    for (const p of parts) p.obj.position.copy(p.home).addScaledVector(p.dir, explode);
    controls.update();
    renderer.render(scene, camera);
    if (first) { first = false; onReady(); }
  };
  loop();

  return {
    sizes,
    setExplode: v => { explodeTo = v; },
    setPick: id => { pick = id; applyPick(); },
    dispose: () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); controls.dispose(); renderer.dispose(); pmrem.dispose(); },
  };
}

export default function StageViewer() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const api = useRef<Api | null>(null);
  const [near, setNear] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [explode, setExplode] = useState(0);
  const [pick, setPick] = useState<string | null>(null);
  const [sizes, setSizes] = useState<Api["sizes"]>({});

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setNear(true); io.disconnect(); } }, { rootMargin: "400px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!near || !canvas.current) return;
    let gone = false;
    mount(canvas.current, () => setReady(true), () => {})
      .then(a => { if (gone) a.dispose(); else { api.current = a; setSizes(a.sizes); } })
      .catch(() => setFailed(true));
    return () => { gone = true; api.current?.dispose(); api.current = null; };
  }, [near]);

  useEffect(() => { api.current?.setExplode(explode); }, [explode]);
  useEffect(() => { api.current?.setPick(pick); }, [pick]);

  const picked = pick ? KINDS.find(k => k.id === pick) : null;
  const info = pick ? sizes[pick] : null;

  return (
    <section className="ui-try st-stage" aria-label="A linear stage built in Studio, in 3D">
      <h2 className="st-head">Turn it over</h2>
      <Sheet fig="3" title="Linear stage, 25 parts" note={ready ? "Drag to turn" : failed ? "Still" : "Loading the model"}>
        <div ref={wrap} className="ui-try-stage st-stage-stage">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="st-stage-still" src="/software/studio/linear-stage.webp" alt="" data-gone={ready || undefined} />
          <canvas ref={canvas} data-ready={ready || undefined} aria-label="The linear stage in 3D. Drag to turn it." />
          {picked && (
            <p className="st-stage-readout" aria-live="polite">
              <b>{picked.label}</b>
              <span>{info ? `${info.count} ${info.count === 1 ? "part" : "parts"} · ${info.size}` : ""}</span>
            </p>
          )}
        </div>
      </Sheet>
      <div className="ui-try-controls st-stage-controls">
        <label className="st-range">
          <span>Explode</span>
          <input type="range" min={0} max={1} step={0.01} value={explode} disabled={!ready} onChange={e => setExplode(Number(e.target.value))} />
        </label>
        <button type="button" className="ui-try-reset" onClick={() => { setExplode(0); setPick(null); }} disabled={!ready || (explode === 0 && !pick)}>Reset</button>
      </div>
      <div className="ui-try-row st-kinds" role="group" aria-label="Light up a kind of part">
        {KINDS.map(k => (
          <button key={k.id} type="button" className="ui-try-part" aria-pressed={pick === k.id} disabled={!ready}
            onClick={() => setPick(pick === k.id ? null : k.id)}
            onMouseEnter={() => ready && !pick && api.current?.setPick(k.id)} onMouseLeave={() => !pick && api.current?.setPick(null)}
          >{k.label}{sizes[k.id]?.count > 1 && <span className="st-kind-n"> ×{sizes[k.id].count}</span>}</button>
        ))}
      </div>
      <p className="ui-try-caption">Try it: drag to turn it, pull it apart, pick a part. This is the real model from my assembly demo, exported by the same CAD engine Studio runs. Change the rail spacing from 60 to 90 mm in Studio and all 25 parts follow their mates; the bought parts are simplified catalogue shapes, apart from the motor, which is the vendor&apos;s STEP.</p>
    </section>
  );
}
