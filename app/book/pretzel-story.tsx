"use client";

// Six pretzels on the table, one for each chapter of Amy's story, in order.
// The first chapter rises on its own; pick any other and it floats up off
// the table while its chapter slides in beside it.
// After Melike Turgut's site (meliketurgut.com): one object per chapter, the
// chosen one held up as the hero, its story in a card alongside.

import { ContactShadows, Environment, Html, Lightformer, OrbitControls, PerspectiveCamera, RoundedBox, useCursor } from "@react-three/drei";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { easing } from "maath";
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ComponentRef, RefObject } from "react";
import {
  CanvasTexture,
  DoubleSide,
  Euler,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  NeutralToneMapping,
  Quaternion,
  RepeatWrapping,
  SRGBColorSpace,
  Vector3,
} from "three";

import { Button } from "../_ui/button";
import { storyChapters } from "./chapters";
import { createPretzelGeometry, pretzelFinish, type PretzelKind } from "./pretzel-geometry";
import { useCompactBook } from "./use-compact-book";

const FOV = 42;
const HALF_FOV_TAN = Math.tan((FOV / 2) * Math.PI / 180);
const reducedMotion = typeof window === "undefined" ? null : window.matchMedia("(prefers-reduced-motion: reduce)");

// The chapter card's footprint, shared with the CSS (.pretzel-card): a right
// column on wide screens, a bottom sheet on phones. The held pretzel centres
// itself in whatever the card leaves free.
const CARD_WIDTH = (width: number) => Math.min(560, width * .46);
const SHEET_HEIGHT = .52;

const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// ---------------------------------------------------------------- the pretzels

type Pose = { position: Vector3; rotation: Euler; scale: number };

// Laid out on the table in story order, a little uneven, the way you'd set
// them down by hand: one row left to right on wide screens; on a phone, two
// big columns read left to right and down, filling the tall screen.
function chapterPose(i: number, narrow: boolean): Pose {
  const count = storyChapters.length;
  const scale = narrow ? .82 : .62;
  const [x, z] = narrow
    ? [((i % 2) - .5) * .92, (Math.floor(i / 2) - 1) * .98]
    : [(i - (count - 1) / 2) * .68, .08 * ((i - (count - 1) / 2) / ((count - 1) / 2)) ** 2 - .04];
  return {
    // Lying flat: the pretzel's thin axis is x, so a quarter turn about z
    // stands it on the table; its bottom is at -.11 before scaling.
    position: new Vector3(x + (rand(i + 40) - .5) * .06, .11 * scale + .012, z + (rand(i + 50) - .5) * .08),
    // Loops away from the viewer, belly toward them, each turned a little.
    rotation: new Euler(0, -Math.PI / 2 + (rand(i + 11) - .5) * .5, Math.PI / 2, "YXZ"),
    scale,
  };
}

function usePretzelMaterials() {
  const materials = useMemo(() => ({
    // The bake colour lives in the geometry's vertex colours; the egg wash is the clearcoat.
    dough: new MeshPhysicalMaterial({ vertexColors: true, roughness: .5, clearcoat: .8, clearcoatRoughness: .28, sheen: .3, sheenColor: "#f0c090" }),
    toppings: new MeshPhysicalMaterial({ vertexColors: true, roughness: .3, clearcoat: .4, flatShading: true }),
  }), []);
  useEffect(() => () => { materials.dough.dispose(); materials.toppings.dispose(); }, [materials]);
  return materials;
}

// A dip is glossy and a touch thick; piped icing is satin. Both are real
// layers over the dough, so they catch the light and cast their own shadow.
function useFinishMaterials(kind: PretzelKind) {
  const materials = useMemo(() => {
    const { coat, drizzle } = pretzelFinish(kind);
    return {
      coat: coat ? new MeshPhysicalMaterial({ color: coat, roughness: .3, clearcoat: 1, clearcoatRoughness: .15, side: DoubleSide }) : null,
      drizzle: drizzle ? new MeshPhysicalMaterial({ color: drizzle, roughness: .38, clearcoat: .6, clearcoatRoughness: .3 }) : null,
    };
  }, [kind]);
  useEffect(() => () => { materials.coat?.dispose(); materials.drizzle?.dispose(); }, [materials]);
  return materials;
}

function usePretzelShape(kind: PretzelKind, seed: number) {
  const lowDetail = useCompactBook();
  const shape = useMemo(() => createPretzelGeometry(lowDetail, kind, seed), [lowDetail, kind, seed]);
  useEffect(() => () => { shape.dough.dispose(); shape.toppings.dispose(); shape.coat?.dispose(); shape.drizzle?.dispose(); }, [shape]);
  return shape;
}

const ignoreRaycast = () => null;

// Where a chosen pretzel floats: in camera space, centred in the part of the
// screen the chapter card leaves free, upright and facing the viewer.
// Close to the camera, so the table and the other pretzels stay behind the veil.
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

function ChapterPretzel({ index, selected, onSelect }: {
  index: number;
  selected: boolean;
  onSelect: (index: number) => void;
}) {
  const chapter = storyChapters[index];
  const compactLayout = useCompactBook();
  const rest = useMemo(() => chapterPose(index, compactLayout), [index, compactLayout]);
  const materials = usePretzelMaterials();
  const shape = usePretzelShape(chapter.pretzel, index + 1);
  const finish = useFinishMaterials(chapter.pretzel);
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

    // On the way between table and hand, rise in an arc.
    scratch.pos.copy(rest.position).lerp(scratch.heldPos, eased);
    scratch.pos.y += Math.sin(Math.PI * eased) * .35 + s.lift * .07;
    root.current.position.copy(scratch.pos);
    root.current.quaternion.slerpQuaternions(restQuat, scratch.heldQuat, eased);
    root.current.scale.setScalar(rest.scale + (held.scale - rest.scale) * eased + s.lift * .03);

    const settled = Math.abs(s.held - target) < .0005 && Math.abs(s.lift - liftTarget) < .001;
    if (!settled || (selected && !reduced)) invalidate();
  });

  const over = (e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(true); };
  const out = () => setHovered(false);
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    // An orbit drag that ends over a pretzel isn't a pick.
    if (e.delta > 6) return;
    onSelect(index);
  };
  const labelAt = useMemo(() => rest.position.clone().add(new Vector3(0, .02, .36)), [rest]);
  return <>
  {/* The chapter's name, just under the pretzel while the pointer is on it. */}
  {hovered && !selected && <Html position={labelAt} center pointerEvents="none" zIndexRange={[3, 3]}>
    <span className="pretzel-label">{chapter.title}</span>
  </Html>}
  <group ref={root} name={`pretzel-${chapter.id}`} onPointerOver={over} onPointerOut={out} onClick={click}>
    <mesh geometry={shape.dough} material={materials.dough} castShadow receiveShadow />
    {shape.coat && finish.coat && <mesh geometry={shape.coat} material={finish.coat} castShadow receiveShadow />}
    {shape.drizzle && finish.drizzle && <mesh geometry={shape.drizzle} material={finish.drizzle} castShadow receiveShadow />}
    <mesh geometry={shape.toppings} material={materials.toppings} castShadow />
  </group>
  </>;
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

// The table view: wide enough for the whole row (or both rows on a phone).
function tablePosition(aspect: number) {
  const rowWidth = aspect < .9 ? 2.05 : 4.4;
  const distance = Math.max(2.6, rowWidth / (2 * HALF_FOV_TAN * aspect));
  return new Vector3(0, distance * 0.8, distance * 0.6);
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

function PretzelScene({ selected, onSelect }: {
  selected: number | null;
  onSelect: (index: number) => void;
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
    <Scrim open={selected !== null} />
    {storyChapters.map((chapter, i) =>
      <ChapterPretzel key={chapter.id} index={i} selected={selected === i} onSelect={onSelect} />)}
    <OrbitControls
      ref={controls}
      enablePan={false}
      enableZoom={false}
      minPolarAngle={0.25}
      maxPolarAngle={0.95}
      rotateSpeed={0.6}
      enableDamping
      dampingFactor={0.08}
      target={[0, 0, 0]}
    />
    {!lowDetail && <PointerParallax controls={controls} />}
  </>;
}

// ---------------------------------------------------------------- the page

// After the pretzels have been on screen for a moment, the first chapter rises by
// itself so the story starts at the beginning.
const FIRST_CHAPTER_DELAY = 900;

export default function PretzelStory({ onExit, onReady }: { onExit?: () => void; onReady?: () => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  // The card keeps showing the last chapter while it slides away.
  const [shown, setShown] = useState(0);
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
            <PretzelScene selected={selected} onSelect={select} />
            <SceneReady onReady={handleReady} />
          </Canvas>
        </div>
      </div>

      {/* No words on the table: chapter one rises by itself and the pretzels
          name themselves on hover. Keyboard and screen-reader visitors still
          get a way in and the whole story as text. */}
      {!open && <Button variant="pill" className="pretzel-start sr-only focus:not-sr-only" onClick={() => select(0)}>Start at the beginning</Button>}
      <div className="sr-only">
        {storyChapters.map(c => <section key={c.id}><h2>{c.title}</h2><p>{c.text}</p></section>)}
      </div>

      <section className="pretzel-card" data-open={open || undefined} aria-hidden={!open} aria-live="polite" aria-label={chapter.title} inert={!open}>
        <div className="pretzel-card-head">
          <span className="ui-meta">Chapter {shown + 1} of {storyChapters.length}</span>
          <Button variant="text" onClick={() => select(null)}>Put it back</Button>
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
