"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { BufferGeometry } from "three";
import "./cad-stepper.css";

/* A part's build, one step at a time: the solid as it stood after each step of
   its real feature tree, turned by dragging. Studio's page and CAD-Steps' page
   share it; each passes its own baked part.

   Nothing here is modelled in the browser. scripts/make-cad-steps.py runs the
   part's own construction in OpenCascade, meshes the solid after every step and
   writes steps.json (the steps, in words, imported by the page so the list is
   server-rendered) and steps.bin (the meshes, fetched when the demo nears the
   screen, with three.js). Until then, and if WebGL fails, a still of the
   finished part stands in (still.webp, a capture of this same view). Triangles
   a step added (their centre is off the previous step's surface) come at the
   end of its index list and are drawn a little darker; lines a sketch drew and
   no solid has used yet are drawn in ink. */

export type CadStep = {
  name: string;
  kind: string;
  detail: string;
  vertices: number;
  triangles: number;
  /** Where the triangles this step added start, in triangles. */
  fresh: number;
  wide: boolean;
  edges: number;
  sketch: number;
  at: { positions: number; indices: number; edges: number; sketch: number };
};

export type CadSteps = {
  bounds: { centre: number[]; half: number; extent: number[] };
  bytes: number;
  steps: CadStep[];
};

type View = { azimuth: number; elevation: number };

type Viewer = {
  show: (index: number) => void;
  turn: (azimuth: number, elevation: number) => void;
  dispose: () => void;
};

const INK = 0x1c1c1c;

/** Build the scene once the meshes are in. Coordinates stay in the file's
    normalized units (the part's largest half-size is 1). */
async function makeViewer(canvas: HTMLCanvasElement, part: CadSteps, data: ArrayBuffer, color: string, view: View): Promise<Viewer> {
  const THREE = await import("three");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(26, 16 / 9, 0.01, 100);
  camera.up.set(0, 0, 1);
  const sky = new THREE.HemisphereLight(0xffffff, 0x9a9a9a, 1.7);
  sky.position.set(0, 0, 1);
  scene.add(sky);
  // A key light that rides with the camera, so the part reads at any angle.
  const key = new THREE.DirectionalLight(0xffffff, 1.5);
  key.position.set(-0.6, 0.9, 1);
  camera.add(key);
  scene.add(camera);

  const base = new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1, side: THREE.DoubleSide });
  const added = base.clone();
  added.color.multiplyScalar(0.72);
  const edgeLine = new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0.3 });
  const sketchLine = new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0.9, depthTest: false });

  const group = new THREE.Group();
  scene.add(group);

  const meshes = new Map<number, BufferGeometry>();
  const lines = new Map<number, BufferGeometry>();
  const geometries: BufferGeometry[] = [];
  const positionsAt = (at: number, count: number) => new THREE.BufferAttribute(new Int16Array(data, at, count * 3), 3, true);
  const meshOf = (s: CadStep) => {
    if (!s.triangles) return null;
    let g = meshes.get(s.at.positions);
    if (!g) {
      g = new THREE.BufferGeometry();
      g.setAttribute("position", positionsAt(s.at.positions, s.vertices));
      g.setIndex(new THREE.BufferAttribute(s.wide ? new Uint32Array(data, s.at.indices, s.triangles * 3) : new Uint16Array(data, s.at.indices, s.triangles * 3), 1));
      g.computeVertexNormals();
      meshes.set(s.at.positions, g);
      geometries.push(g);
    }
    return g;
  };
  const linesOf = (at: number, segments: number) => {
    if (!segments) return null;
    let g = lines.get(at);
    if (!g) {
      g = new THREE.BufferGeometry();
      g.setAttribute("position", positionsAt(at, segments * 2));
      lines.set(at, g);
      geometries.push(g);
    }
    return g;
  };

  // Frame the whole build (every step's bounds) from the starting view, so the
  // part never jumps in scale from one step to the next.
  const half = part.bounds.half;
  const ext = part.bounds.extent.map(e => e / 2 / half);
  const corners = [-1, 1].flatMap(x => [-1, 1].flatMap(y => [-1, 1].map(z => new THREE.Vector3(x * ext[0], y * ext[1], z * ext[2]))));
  let azimuth = (view.azimuth * Math.PI) / 180;
  let elevation = (view.elevation * Math.PI) / 180;
  let distance = 6;
  const place = () => {
    const c = Math.cos(elevation);
    camera.position.set(c * Math.cos(azimuth), c * Math.sin(azimuth), Math.sin(elevation)).multiplyScalar(distance);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
  };
  for (let i = 0; i < 6; i++) {
    place();
    let x = 0, y = 0;
    for (const corner of corners) {
      const p = corner.clone().project(camera);
      x = Math.max(x, Math.abs(p.x));
      y = Math.max(y, Math.abs(p.y));
    }
    distance *= Math.max(x / 0.84, y / 0.74);
  }
  place();

  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  let frame = 0;
  const render = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => renderer.render(scene, camera));
  };
  const observer = new ResizeObserver(() => { resize(); render(); });
  observer.observe(canvas);
  resize();

  return {
    show(index) {
      const s = part.steps[index];
      group.clear();
      const g = meshOf(s);
      if (g) {
        g.clearGroups();
        g.addGroup(0, s.fresh * 3, 0);
        g.addGroup(s.fresh * 3, (s.triangles - s.fresh) * 3, 1);
        group.add(new THREE.Mesh(g, [base, added]));
      }
      const e = linesOf(s.at.edges, s.edges);
      if (e) group.add(new THREE.LineSegments(e, edgeLine));
      const k = linesOf(s.at.sketch, s.sketch);
      if (k) {
        const sketch = new THREE.LineSegments(k, sketchLine);
        sketch.renderOrder = 1;
        group.add(sketch);
      }
      render();
    },
    turn(da, de) {
      azimuth += da;
      elevation = Math.max(-1.45, Math.min(1.45, elevation + de));
      place();
      render();
    },
    dispose() {
      cancelAnimationFrame(frame);
      observer.disconnect();
      geometries.forEach(g => g.dispose());
      [base, added, edgeLine, sketchLine].forEach(m => m.dispose());
      renderer.dispose();
    },
  };
}

export function CadStepper({
  part,
  bin,
  still,
  color,
  view,
  object,
  listLabel,
  caption,
}: {
  part: CadSteps;
  /** The meshes, fetched when the demo nears the screen. */
  bin: string;
  /** A capture of the finished part from the starting view, for the first paint. */
  still: string;
  /** The part's own colour: an object's, not the interface's. */
  color: string;
  view: View;
  /** What the part is, for the picture's description. */
  object: string;
  /** What the list of steps is called, for assistive tech. */
  listLabel: string;
  caption: ReactNode;
}) {
  const steps = part.steps;
  const last = steps.length - 1;
  const figure = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const viewer = useRef<Viewer | null>(null);
  const drag = useRef<{ x: number; y: number; id: number } | null>(null);
  // The first paint is the finished part, the still underneath.
  const [step, setStep] = useState(last);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  // Until someone touches it, it plays the build over and over while on screen.
  const [looping, setLooping] = useState(false);
  const [touched, setTouched] = useState(false);

  // Load three.js and the meshes when the demo is near the screen, not before.
  useEffect(() => {
    const el = figure.current, c = canvas.current;
    if (!el || !c) return;
    let cancelled = false;
    const start = async () => {
      try {
        const response = await fetch(bin);
        if (!response.ok) throw new Error(`${bin}: ${response.status}`);
        const data = await response.arrayBuffer();
        const made = await makeViewer(c, part, data, color, view);
        if (cancelled) { made.dispose(); return; }
        viewer.current = made;
        setReady(true);
      } catch {
        if (!cancelled) setFailed(true); // the still stays
      }
    };
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); start(); } }, { rootMargin: "400px 0px" });
    io.observe(el);
    return () => {
      cancelled = true;
      io.disconnect();
      viewer.current?.dispose();
      viewer.current = null;
    };
  }, [bin, part, color, view]);

  useEffect(() => { viewer.current?.show(step); }, [step, ready]);

  // Playing: one step at a time. Played by hand it stops at the end; on its own
  // it holds the finished part, then builds it again.
  useEffect(() => {
    if (!playing) return;
    const atEnd = step === last;
    const delay = atEnd ? 2600 : steps[step].kind === "Sketch" ? 750 : 1000;
    const timer = window.setTimeout(() => {
      const next = atEnd ? 0 : step + 1;
      setStep(next);
      if (next === last && !looping) setPlaying(false);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [playing, looping, step, last, steps]);

  // Play on its own while on screen, until touched; never with reduced motion.
  useEffect(() => {
    const el = figure.current;
    if (!ready || touched || !el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(([e]) => { setLooping(true); setPlaying(e.isIntersecting); }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [ready, touched]);

  const take = () => {
    setTouched(true);
    setLooping(false);
  };
  const goTo = (index: number) => {
    take();
    setPlaying(false);
    setStep(index);
  };
  const play = () => {
    take();
    if (playing) { setPlaying(false); return; }
    if (step === last) setStep(0);
    setPlaying(true);
  };

  const turnBy = (da: number, de: number) => viewer.current?.turn(da, de);
  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!ready || e.button !== 0) return;
    drag.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (dx || dy) {
      if (!touched) take();
      if (looping) setPlaying(false);
    }
    drag.current = { ...d, x: e.clientX, y: e.clientY };
    turnBy(-dx * 0.009, dy * 0.009);
  };
  const endDrag = () => { drag.current = null; };
  const onKeyDown = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    const turns: Record<string, [number, number]> = { ArrowLeft: [0.2, 0], ArrowRight: [-0.2, 0], ArrowUp: [0, -0.15], ArrowDown: [0, 0.15] };
    const t = turns[e.key];
    if (!t || !ready) return;
    e.preventDefault();
    take();
    setPlaying(false);
    turnBy(...t);
  };

  const s = steps[step];
  const words = [s.kind, s.detail].filter(Boolean).join(", ");
  const description = `${object}, after step ${step + 1} of ${steps.length}: ${s.name} (${words}). Drag it, or use the arrow keys, to turn it.`;
  const off = failed;

  return (
    <figure className="ui-try" ref={figure}>
      <div className="ui-media ui-try-stage cad-stepper-stage">
        {/* The finished part shows first and stays if scripting or WebGL is off. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={still} alt="" width={1120} height={630} />
        <canvas
          ref={canvas}
          role="img"
          aria-label={description}
          tabIndex={ready ? 0 : -1}
          data-ready={ready || undefined}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={onKeyDown}
        />
        <span className="cad-stepper-ring" aria-hidden="true" />
        <p className="cad-stepper-label" aria-hidden="true">
          <b>{s.kind}</b>{s.detail && `, ${s.detail}`}
        </p>
      </div>
      <div className="ui-try-controls">
        <div className="ui-try-row cad-stepper-scrub">
          <button type="button" className="ui-try-pill" aria-pressed={playing} disabled={off} onClick={play}>
            Play
          </button>
          <input
            className="cad-stepper-range"
            type="range"
            min={0}
            max={last}
            step={1}
            value={step}
            disabled={off}
            aria-label="Step"
            aria-valuetext={`${step + 1} of ${steps.length}: ${s.name}`}
            onChange={e => goTo(Number(e.target.value))}
          />
          <span className="cad-stepper-count" aria-hidden="true">{step + 1} / {steps.length}</span>
        </div>
        <div className="ui-try-row cad-stepper-steps" role="group" aria-label={listLabel}>
          {steps.map((x, i) => (
            <button key={i} type="button" className="ui-try-pill" aria-pressed={i === step} disabled={off} title={[x.kind, x.detail].filter(Boolean).join(", ")} onClick={() => goTo(i)}>
              {x.name}
            </button>
          ))}
        </div>
      </div>
      <figcaption className="ui-try-caption">{caption}</figcaption>
    </figure>
  );
}
