"use client";

// A bowl of pretzels on the table, one for each chapter of Amy's story. The
// first chapter rises on its own; pick any other and it floats up out of the
// bowl while its chapter slides in beside it.
// After Melike Turgut's site (meliketurgut.com): one object per chapter, the
// chosen one held up as the hero, its story in a card alongside.

import { ContactShadows, Environment, Lightformer, OrbitControls, PerspectiveCamera, RoundedBox, useCursor } from "@react-three/drei";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { easing } from "maath";
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ComponentRef, RefObject } from "react";
import {
  CanvasTexture,
  Euler,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  NeutralToneMapping,
  Quaternion,
  RepeatWrapping,
  SRGBColorSpace,
  Vector2,
  Vector3,
} from "three";

import { Button } from "../_ui/button";
import { storyChapters } from "./chapters";
import { createPretzelGeometry, type PretzelKind } from "./pretzel-geometry";
import { useCompactBook } from "./use-compact-book";

const FOV = 42;
const HALF_FOV_TAN = Math.tan((FOV / 2) * Math.PI / 180);
const reducedMotion = typeof window === "undefined" ? null : window.matchMedia("(prefers-reduced-motion: reduce)");

// The chapter card's footprint, shared with the CSS (.pretzel-card): a right
// column on wide screens, a bottom sheet on phones. The held pretzel centres
// itself in whatever the card leaves free.
const CARD_WIDTH = (width: number) => Math.min(560, width * .46);
const SHEET_HEIGHT = .56;

const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// ---------------------------------------------------------------- the bowl

const BOWL_PROFILE = [
  [0, 0], [.34, 0], [.36, .03], [.58, .13], [.76, .3], [.84, .43], [.835, .455], [.8, .455],
  [.73, .33], [.55, .18], [.33, .09], [0, .08],
].map(([x, y]) => new Vector2(x, y));

function Bowl() {
  const lowDetail = useCompactBook();
  const glaze = useMemo(() => new MeshPhysicalMaterial({ color: "#f4f4f4", roughness: .2, clearcoat: .7, clearcoatRoughness: .12 }), []);
  useEffect(() => () => glaze.dispose(), [glaze]);
  return <mesh castShadow receiveShadow material={glaze}>
    <latheGeometry args={[BOWL_PROFILE, lowDetail ? 40 : 96]} />
  </mesh>;
}

type Pose = { position: Vector3; rotation: Euler; scale: number };

// Plain salted pretzels fill the bowl; the chapter pretzels sit on top where
// a hand would reach for them.
const FILLER_COUNT = 14;
const FILLER_POSES: Pose[] = Array.from({ length: FILLER_COUNT }, (_, i) => {
  const layer = i < 8 ? 0 : 1;
  const k = layer ? i - 8 : i;
  const ring = layer ? 6 : 8;
  const angle = k * (Math.PI * 2 / ring) + layer * .4 + rand(i) * .3;
  const radius = layer ? .3 : .44;
  return {
    position: new Vector3(Math.cos(angle) * radius, .16 + layer * .09 + rand(i + 4) * .02, Math.sin(angle) * radius),
    // Lying flat (a quarter turn about z), leaning against the bowl's wall.
    rotation: new Euler(-(.3 + rand(i + 7) * .25) * (layer ? .5 : 1), -angle + rand(i + 2) * 1.2, Math.PI / 2, "YXZ"),
    scale: .5,
  };
});

// In story order: clockwise round the bowl from the front left, as the
// viewer sees it, with the goodbye in the middle.
const CHAPTER_POSES: Pose[] = storyChapters.map((_, i) => {
  const centre = i === storyChapters.length - 1;
  const angle = i * (Math.PI * 2 / (storyChapters.length - 1)) + 2.2;
  const radius = centre ? 0 : .3;
  return {
    position: new Vector3(Math.cos(angle) * radius, .36 + (centre ? .07 : rand(i + 30) * .03), Math.sin(angle) * radius),
    rotation: new Euler(centre ? .06 : -.22, -angle + .4 + rand(i + 11), Math.PI / 2, "YXZ"),
    scale: .5,
  };
});

function usePretzelMaterials() {
  const materials = useMemo(() => ({
    // The bake colour lives in the geometry's vertex colours; the egg wash is the clearcoat.
    dough: new MeshPhysicalMaterial({ vertexColors: true, roughness: .5, clearcoat: .8, clearcoatRoughness: .28, sheen: .3, sheenColor: "#f0c090" }),
    toppings: new MeshPhysicalMaterial({ vertexColors: true, roughness: .3, clearcoat: .4, flatShading: true }),
  }), []);
  useEffect(() => () => { materials.dough.dispose(); materials.toppings.dispose(); }, [materials]);
  return materials;
}

function usePretzelShape(kind: PretzelKind, seed: number) {
  const lowDetail = useCompactBook();
  const shape = useMemo(() => createPretzelGeometry(lowDetail, kind, seed), [lowDetail, kind, seed]);
  useEffect(() => () => { shape.dough.dispose(); shape.toppings.dispose(); }, [shape]);
  return shape;
}

const ignoreRaycast = () => null;

function FillerPretzels() {
  const materials = usePretzelMaterials();
  const a = usePretzelShape("salt", 101);
  const b = usePretzelShape("salt", 202);
  return <group name="filler-pretzels">
    {FILLER_POSES.map((pose, i) => {
      const shape = i % 2 ? a : b;
      return <group key={i} position={pose.position} rotation={pose.rotation} scale={pose.scale}>
        <mesh geometry={shape.dough} material={materials.dough} castShadow receiveShadow raycast={ignoreRaycast} />
        <mesh geometry={shape.toppings} material={materials.toppings} castShadow raycast={ignoreRaycast} />
      </group>;
    })}
  </group>;
}

// Where a chosen pretzel floats: in camera space, centred in the part of the
// screen the chapter card leaves free, upright and facing the viewer.
// Close to the camera, so the bowl (about 2.3 away at its front rim) stays behind the veil.
const HELD_DEPTH = 1.6;
function heldPose(width: number, height: number, compact: boolean) {
  const aspect = width / height;
  const halfHeight = HELD_DEPTH * HALF_FOV_TAN;
  const halfWidth = halfHeight * aspect;
  if (compact) {
    const freeTop = 1 - SHEET_HEIGHT;
    const y = (1 - freeTop) * halfHeight; // middle of the free band, in NDC: 1 - freeTop
    const size = Math.min(halfWidth * 2 * .62, halfHeight * 2 * freeTop * .7);
    return { position: new Vector3(0, y, -HELD_DEPTH), scale: size / .86 };
  }
  const free = width - CARD_WIDTH(width) - 24;
  const ndcX = (free / 2) / width * 2 - 1;
  const size = Math.min(halfHeight * 2 * .4, (free / width) * halfWidth * 2 * .62);
  return { position: new Vector3(ndcX * halfWidth, .02 * halfHeight, -HELD_DEPTH), scale: size / .86 };
}

// The pretzel's own axes: x is its thin "up", y runs from belly to lobes.
// A quarter turn about y turns its face to the camera, lobes up.
const FACE_CAMERA = new Quaternion().setFromEuler(new Euler(0, -Math.PI / 2, 0));
// Shared by every pretzel's frame callback, which run one after another.
const scratch = { heldQuat: new Quaternion(), spin: new Quaternion(), heldPos: new Vector3(), pos: new Vector3(), up: new Vector3(0, 1, 0) };

function ChapterPretzel({ index, selected, onSelect, onHover }: {
  index: number;
  selected: boolean;
  onSelect: (index: number) => void;
  onHover: (index: number | null) => void;
}) {
  const chapter = storyChapters[index];
  const rest = CHAPTER_POSES[index];
  const materials = usePretzelMaterials();
  const shape = usePretzelShape(chapter.pretzel, index + 1);
  const root = useRef<Group>(null!);
  const { camera, size, invalidate } = useThree();
  const compact = useCompactBook();
  const [hovered, setHovered] = useState(false);
  useCursor(hovered && !selected);
  const state = useRef({ held: 0, lift: 0, time: rand(index) * 10 });
  const restQuat = useMemo(() => new Quaternion().setFromEuler(rest.rotation), [rest]);
  const held = useMemo(() => heldPose(size.width, size.height, compact), [size.width, size.height, compact]);

  useEffect(() => { invalidate(); }, [selected, invalidate]);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, .05);
    const s = state.current;
    const reduced = reducedMotion?.matches;
    const target = selected ? 1 : 0;
    const liftTarget = hovered && !selected ? 1 : 0;
    if (reduced) { s.held = target; s.lift = liftTarget; }
    else {
      easing.damp(s, "held", target, selected ? .32 : .28, delta);
      easing.damp(s, "lift", liftTarget, .12, delta);
    }
    s.time += delta;
    const p = s.held;
    const eased = p * p * (3 - 2 * p);

    // Held: in front of the camera, turning slowly the way Melike's charms do.
    const sway = reduced ? 0 : Math.sin(s.time * .8) * .3;
    const bob = reduced ? 0 : Math.sin(s.time * 1.3) * .015;
    scratch.heldPos.copy(held.position).setY(held.position.y + bob);
    camera.localToWorld(scratch.heldPos);
    scratch.spin.setFromAxisAngle(scratch.up, sway);
    scratch.heldQuat.copy(camera.quaternion).multiply(scratch.spin).multiply(FACE_CAMERA);

    // On the way between bowl and hand, rise in an arc.
    scratch.pos.copy(rest.position).lerp(scratch.heldPos, eased);
    scratch.pos.y += Math.sin(Math.PI * eased) * .35 + s.lift * .07;
    root.current.position.copy(scratch.pos);
    root.current.quaternion.slerpQuaternions(restQuat, scratch.heldQuat, eased);
    root.current.scale.setScalar(rest.scale + (held.scale - rest.scale) * eased + s.lift * .03);

    const settled = Math.abs(s.held - target) < .0005 && Math.abs(s.lift - liftTarget) < .001;
    if (!settled || (selected && !reduced)) invalidate();
  });

  const over = (e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(true); onHover(index); };
  const out = () => { setHovered(false); onHover(null); };
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    // An orbit drag that ends over a pretzel isn't a pick.
    if (e.delta > 6) return;
    onSelect(index);
  };
  return <group ref={root} name={`pretzel-${chapter.id}`} onPointerOver={over} onPointerOut={out} onClick={click}>
    <mesh geometry={shape.dough} material={materials.dough} castShadow receiveShadow />
    <mesh geometry={shape.toppings} material={materials.toppings} castShadow />
  </group>;
}

// A dark veil between the held pretzel and the table, so the chosen one
// stands alone the way a charm does on Melike's site.
function Scrim({ open }: { open: boolean }) {
  const mesh = useRef<Mesh>(null!);
  const { camera, invalidate } = useThree();
  const opacity = useRef(0);
  useEffect(() => { invalidate(); }, [open, invalidate]);
  useFrame((_, delta) => {
    const target = open ? .9 : 0;
    if (reducedMotion?.matches) opacity.current = target;
    else easing.damp(opacity, "current", target, .3, Math.min(delta, .05));
    const m = mesh.current;
    (m.material as MeshBasicMaterial).opacity = opacity.current;
    m.visible = opacity.current > .002;
    m.position.set(0, 0, -(HELD_DEPTH + .2));
    camera.localToWorld(m.position);
    m.quaternion.copy(camera.quaternion);
    if (Math.abs(opacity.current - target) > .002) invalidate();
  });
  return <mesh ref={mesh} raycast={ignoreRaycast} renderOrder={1}>
    <planeGeometry args={[40, 40]} />
    <meshBasicMaterial color="#000000" transparent opacity={0} depthWrite={false} toneMapped={false} />
  </mesh>;
}

// ---------------------------------------------------------------- the table

function Tabletop() {
  const grain = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1024;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#121212";
    ctx.fillRect(0, 0, 1024, 1024);
    for (let i = 0; i < 1800; i++) {
      const y = i / 1800 * 1024;
      ctx.strokeStyle = `rgba(255,255,255,${0.004 + rand(i + 9) * 0.012})`;
      ctx.lineWidth = 0.5 + rand(i + 3);
      ctx.beginPath(); ctx.moveTo(0, y);
      ctx.bezierCurveTo(300, y + Math.sin(i * .008) * 65, 750, y - Math.cos(i * .007) * 48, 1024, y);
      ctx.stroke();
    }
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.repeat.set(2, 2);
    texture.anisotropy = 16;
    return texture;
  }, []);
  useEffect(() => () => grain.dispose(), [grain]);
  return <RoundedBox args={[18, 0.18, 14]} radius={0.035} smoothness={3} position={[0, -0.09, 0]} receiveShadow>
    <meshStandardMaterial map={grain} roughness={0.88} bumpMap={grain} bumpScale={0.009} />
  </RoundedBox>;
}

// The table view: just the bowl, in the middle.
function tablePosition(aspect: number) {
  const distance = Math.max(3.2, 2.5 / aspect);
  return new Vector3(distance * 0.12, distance * 0.84, distance * 0.53);
}

function ResponsiveCamera() {
  const { size } = useThree();
  const position = useMemo(() => tablePosition(size.width / size.height), [size.width, size.height]);
  return <PerspectiveCamera makeDefault position={position} fov={FOV} />;
}

// A little parallax from the pointer while nothing else is moving the camera.
function PointerParallax({ controls }: { controls: RefObject<ComponentRef<typeof OrbitControls> | null> }) {
  const { gl, invalidate } = useThree();
  const pointer = useRef({ x: 0, y: 0 });
  const applied = useRef({ x: 0, y: 0 });
  const last = useRef({ x: 0, y: 0 });
  const orbiting = useRef(false);

  useEffect(() => {
    if (reducedMotion?.matches || window.matchMedia("(pointer: coarse)").matches) return;
    const el = gl.domElement;
    const move = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      pointer.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.current.y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      invalidate();
    };
    const leave = () => { pointer.current.x = 0; pointer.current.y = 0; invalidate(); };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => { el.removeEventListener("pointermove", move); el.removeEventListener("pointerleave", leave); };
  }, [gl, invalidate]);

  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const start = () => { orbiting.current = true; };
    const end = () => { orbiting.current = false; };
    c.addEventListener("start", start);
    c.addEventListener("end", end);
    return () => { c.removeEventListener("start", start); c.removeEventListener("end", end); };
  }, [controls]);

  useFrame((_, delta) => {
    const c = controls.current;
    if (!c || !c.enabled || orbiting.current) return;
    const moving = easing.damp(applied.current, "x", pointer.current.x * .045, .6, delta);
    const movingY = easing.damp(applied.current, "y", pointer.current.y * .022, .6, delta);
    const dx = applied.current.x - last.current.x, dy = applied.current.y - last.current.y;
    if (Math.abs(dx) > 1e-6 || Math.abs(dy) > 1e-6) {
      c.setAzimuthalAngle(c.getAzimuthalAngle() - dx);
      c.setPolarAngle(c.getPolarAngle() + dy);
      c.update();
    }
    last.current.x = applied.current.x;
    last.current.y = applied.current.y;
    if (moving || movingY) invalidate();
  });
  return null;
}

function CanvasSizer() {
  const { gl, setSize } = useThree();
  useEffect(() => {
    const frame = gl.domElement.closest(".book-three-frame");
    if (!(frame instanceof HTMLElement)) return;
    const resize = () => {
      const rect = frame.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) setSize(rect.width, rect.height);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [gl, setSize]);
  return null;
}

function SceneReady({ onReady }: { onReady?: () => void }) {
  const frame = useRef<number | null>(null);
  useEffect(() => () => { if (frame.current !== null) cancelAnimationFrame(frame.current); }, []);
  useFrame(() => {
    if (frame.current !== null) return;
    frame.current = requestAnimationFrame(() => {
      performance.mark("pretzels-ready");
      onReady?.();
    });
  });
  return null;
}

function PretzelScene({ selected, onSelect, onHover }: {
  selected: number | null;
  onSelect: (index: number) => void;
  onHover: (index: number | null) => void;
}) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const lowDetail = useCompactBook();
  return <>
    <CanvasSizer />
    <ResponsiveCamera />
    <color attach="background" args={["#000000"]} />
    <ambientLight intensity={0.18} />
    <hemisphereLight args={["#ffffff", "#2a2a2a", 0.55]} />
    <directionalLight
      position={[-3, 6, -3]}
      intensity={2.8}
      castShadow
      shadow-mapSize-width={lowDetail ? 512 : 2048}
      shadow-mapSize-height={lowDetail ? 512 : 2048}
      shadow-camera-left={-4}
      shadow-camera-right={4}
      shadow-camera-top={4}
      shadow-camera-bottom={-4}
      shadow-normalBias={lowDetail ? 0.012 : 0.004}
      shadow-radius={5}
      shadow-blurSamples={lowDetail ? 4 : 8}
      shadow-bias={lowDetail ? -0.0003 : -0.0001}
    />
    {/* A soft key from the viewer's side so a held pretzel is lit from the front. */}
    <directionalLight position={[1.5, 4, 5]} intensity={0.9} color="#ffffff" />
    <Tabletop />
    <ContactShadows position={[0, 0.0015, 0]} opacity={lowDetail ? 0.3 : 0.42} scale={[7.5, 6]} blur={2.4} far={1.3} resolution={lowDetail ? 256 : 512} color="#000000" frames={Infinity} />
    {/* Reflection cards live only in the environment, outside the visible scene. */}
    <Environment resolution={lowDetail ? 64 : 256} frames={1} environmentIntensity={.55}>
      <color attach="background" args={["#0a0a0a"]} />
      <Lightformer form="rect" intensity={3} position={[-3, 4, 2]} scale={[3, 4, 1]} target={[0, 0, 0]} />
      <Lightformer form="rect" intensity={2} position={[-1, 3, -3]} scale={[3, 2, 1]} target={[0, 0, 0]} />
      <Lightformer form="rect" intensity={1.5} position={[4, 3, -3]} scale={[1, 4, 1]} target={[0, 0, 0]} />
      <Lightformer form="ring" intensity={.5} color="#ffffff" position={[0, 6, 0]} scale={5} rotation-x={Math.PI / 2} />
    </Environment>
    <Bowl />
    <FillerPretzels />
    <Scrim open={selected !== null} />
    {storyChapters.map((chapter, i) =>
      <ChapterPretzel key={chapter.id} index={i} selected={selected === i} onSelect={onSelect} onHover={onHover} />)}
    <OrbitControls
      ref={controls}
      enablePan={false}
      enableZoom={false}
      minPolarAngle={0.25}
      maxPolarAngle={0.95}
      rotateSpeed={0.6}
      enableDamping
      dampingFactor={0.08}
      target={[0, 0.2, 0]}
    />
    {!lowDetail && <PointerParallax controls={controls} />}
  </>;
}

// ---------------------------------------------------------------- the page

// After the bowl has been on screen for a moment, the first chapter rises by
// itself so the story starts at the beginning.
const FIRST_CHAPTER_DELAY = 900;

export default function PretzelStory({ onExit, onReady }: { onExit?: () => void; onReady?: () => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  // The card keeps showing the last chapter while it slides away.
  const [shown, setShown] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const last = storyChapters.length - 1;
  const chapter = storyChapters[shown];

  const select = useCallback((index: number | null) => {
    setSelected(index);
    if (index !== null) setShown(index);
  }, []);
  const next = useCallback(() => select(selected === null ? 0 : Math.min(selected + 1, last)), [select, selected, last]);
  const previous = useCallback(() => { if (selected) select(selected - 1); }, [select, selected]);

  // Escape puts the pretzel back before it closes the whole scene. Capture
  // phase, so it runs before the overlay's own Escape handler.
  const selectedRef = useRef(selected);
  useLayoutEffect(() => { selectedRef.current = selected; }, [selected]);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && selectedRef.current !== null) {
        event.stopImmediatePropagation();
        select(null);
      }
    }
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
  }, [select]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowRight") next();
      else if (event.key === "ArrowLeft") previous();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, previous]);

  const startTimer = useRef<number | null>(null);
  const touched = useRef(false);
  useEffect(() => () => { if (startTimer.current !== null) clearTimeout(startTimer.current); }, []);
  const handleReady = useCallback(() => {
    onReady?.();
    startTimer.current = window.setTimeout(() => { if (!touched.current) select(0); }, FIRST_CHAPTER_DELAY);
  }, [onReady, select]);
  // Anything the visitor picks first wins over the automatic start.
  useEffect(() => { if (selected !== null) touched.current = true; }, [selected]);

  const open = selected !== null;
  const hint = hovered !== null ? storyChapters[hovered].title : "Pick a pretzel. Each one is a chapter.";

  return (
    <div className="storybook" data-open={open || undefined}>
      <div className="storybook-canvas" aria-hidden="true">
        <div className="book-three-frame">
          <Canvas
            className="book-three-canvas"
            shadows="variance"
            frameloop="demand"
            camera={{ position: [0.5, 3.1, 2], fov: FOV }}
            dpr={[1, 2]}
            gl={{ alpha: false, antialias: true, powerPreference: "high-performance" }}
            onCreated={({ gl }) => {
              // ContactShadows clears with the renderer's clear alpha; on an
              // opaque canvas that paints the whole shadow plane dark.
              gl.setClearAlpha(0);
              gl.toneMapping = NeutralToneMapping;
            }}
          >
            <PretzelScene selected={selected} onSelect={select} onHover={setHovered} />
            <SceneReady onReady={handleReady} />
          </Canvas>
        </div>
      </div>

      {!open && <div className="storybook-bar">
        <div className="storybook-pagination">
          <span className="pretzel-hint">{hint}</span>
          <Button variant="text" onClick={() => select(0)}>Start at the beginning</Button>
        </div>
        <details className="book-reading">
          <summary>Read as text</summary>
          <div className="book-reading-panel">
            {storyChapters.map(c => <section key={c.id}><h2>{c.title}</h2><p>{c.text}</p></section>)}
          </div>
        </details>
      </div>}

      <section className="pretzel-card" data-open={open || undefined} aria-hidden={!open} aria-live="polite" aria-label={chapter.title} inert={!open}>
        <div className="pretzel-card-head">
          <span className="ui-meta">Chapter {shown + 1} of {storyChapters.length}</span>
          <Button variant="text" onClick={() => select(null)}>Back to the bowl</Button>
        </div>
        <h2 className="pretzel-card-title">{chapter.title}</h2>
        <p className="pretzel-card-text">{chapter.text}</p>
        {shown === last && <nav className="storybook-links" aria-label="Amy's work">
          <Link href="/portfolio">Objects</Link>
          <Link href="/software">Software</Link>
        </nav>}
        <div className="pretzel-card-nav">
          <Button variant="text" disabled={shown === 0} onClick={previous}>Previous</Button>
          {shown === last
            ? <Button variant="text" onClick={onExit}>Go to the website</Button>
            : <Button variant="text" onClick={next}>Next</Button>}
        </div>
      </section>
    </div>
  );
}
