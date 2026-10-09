"use client";

import {
  ContactShadows,
  OrbitControls,
  PerspectiveCamera,
  RoundedBox,
  useCursor,
} from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { easing } from "maath";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ComponentRef, RefObject } from "react";
import {
  Bone,
  BoxGeometry,
  CanvasTexture,
  Color,
  Float32BufferAttribute,
  MathUtils,
  RepeatWrapping,
  MeshStandardMaterial,
  NeutralToneMapping,
  MeshPhysicalMaterial,
  Skeleton,
  SkinnedMesh,
  SRGBColorSpace,
  Plane,
  Uint16BufferAttribute,
  Vector2,
  Vector3,
} from "three";
import type { Group, Texture } from "three";
import { bookChapters, bookEnding, type BookChapter } from "./chapters";
import { registerMesh, registerSurface, releaseSurface, sketch, sketchAt } from "./sketch";
import TableDecor from "./table-decor";
import { useCompactBook } from "./use-compact-book";
import { PRETZEL_COUNT, useTableState, type TableState } from "./table-interactions";
import Link from "next/link";
import { Button } from "../_ui/button";

type TexturePage =
  | { kind: "cover" }
  | { kind: "back-cover" }
  | { kind: "blank" }
  | { kind: "text"; title: string; text: string; pageNumber: number }
  | { kind: "sketch"; hint?: string; pageNumber: number };

// A printed page before it has a number: Omit applied to each kind separately.
type UnnumberedPage = TexturePage extends infer T ? T extends { pageNumber: number } ? Omit<T, "pageNumber"> : never : never;

type BookSheet = {
  front: TexturePage;
  back: TexturePage;
};

const TEXTURE_WIDTH = 900;
const TEXTURE_HEIGHT = 1200;
const PRINT_SCALE = 1.5;
const PAGE_WIDTH = 1.34;
const PAGE_HEIGHT = 1.9;
const PAGE_DEPTH = 0.018;
const COVER_DEPTH = 0.035;
const PAGE_SEGMENTS = 30;
const INK = "#1c1c1c";
const INK_SOFT = "rgba(28,28,28,.62)";
const PAGE_MARGIN = 104;

const SEGMENT_WIDTH = PAGE_WIDTH / PAGE_SEGMENTS;
const reducedMotion = typeof window === "undefined" ? null : window.matchMedia("(prefers-reduced-motion: reduce)");

// page-turn animation feel (after Wawa Sensei's book-slider technique)
const easingFactor = 0.5;
const easingFactorFold = 0.3;


const pageGeometry = new BoxGeometry(
  PAGE_WIDTH,
  PAGE_HEIGHT,
  PAGE_DEPTH,
  PAGE_SEGMENTS,
  2
);

pageGeometry.translate(PAGE_WIDTH / 2, 0, 0);

// skin the page to a chain of bones along its width so it can bend
{
  const position = pageGeometry.attributes.position;
  const vertex = new Vector3();
  const skinIndexes: number[] = [];
  const skinWeights: number[] = [];

  for (let i = 0; i < position.count; i++) {
    vertex.fromBufferAttribute(position, i);
    const x = vertex.x;
    const skinIndex = Math.min(
      Math.max(0, Math.floor(x / SEGMENT_WIDTH)),
      PAGE_SEGMENTS
    );
    const skinWeight = (x % SEGMENT_WIDTH) / SEGMENT_WIDTH;
    // clamp the neighbor index: the right-edge vertex would otherwise point
    // one past the last bone (its weight is 0, but three's skinned raycast
    // still dereferences the bone)
    skinIndexes.push(skinIndex, Math.min(skinIndex + 1, PAGE_SEGMENTS), 0, 0);
    skinWeights.push(1 - skinWeight, skinWeight, 0, 0);
  }

  pageGeometry.setAttribute(
    "skinIndex",
    new Uint16BufferAttribute(skinIndexes, 4)
  );
  pageGeometry.setAttribute(
    "skinWeight",
    new Float32BufferAttribute(skinWeights, 4)
  );
}

function seededJitter(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function printFont(size: number, family = "--font-body") {
  return family === "--font-display"
    ? `600 ${size}px Areal, Arial, sans-serif`
    : `400 ${size}px Areal, Arial, sans-serif`;
}

let paperBase: HTMLCanvasElement | undefined;
function drawPaper(target: CanvasRenderingContext2D) {
  if (paperBase) { target.drawImage(paperBase, 0, 0); return; }
  paperBase = document.createElement("canvas");
  paperBase.width = TEXTURE_WIDTH;
  paperBase.height = TEXTURE_HEIGHT;
  const ctx = paperBase.getContext("2d")!;
  ctx.fillStyle = "#fbfbfb";
  ctx.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);
  for (let i = 0; i < 24000; i++) {
    ctx.fillStyle = `rgba(60,60,60,${seededJitter(i + 2) * .03})`;
    ctx.fillRect(seededJitter(i) * TEXTURE_WIDTH, seededJitter(i + 1) * TEXTURE_HEIGHT, 1, 1);
  }
  const gutter = ctx.createLinearGradient(0, 0, TEXTURE_WIDTH, 0);
  gutter.addColorStop(0, "rgba(0,0,0,.2)");
  gutter.addColorStop(.08, "rgba(0,0,0,.02)");
  gutter.addColorStop(.85, "rgba(0,0,0,0)");
  gutter.addColorStop(1, "rgba(0,0,0,.05)");
  ctx.fillStyle = gutter;
  ctx.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);
  target.drawImage(paperBase, 0, 0);
}

function drawCover(ctx: CanvasRenderingContext2D, back = false) {
  ctx.fillStyle = "#f4f4f4";
  ctx.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);
  // Fine crossing threads, also used by the material as shallow relief.
  for (let x = 0; x < TEXTURE_WIDTH; x += 3) {
    ctx.fillStyle = `rgba(0,0,0,${.015 + seededJitter(x) * .03})`;
    ctx.fillRect(x, 0, 1, TEXTURE_HEIGHT);
  }
  for (let y = 0; y < TEXTURE_HEIGHT; y += 3) {
    ctx.fillStyle = `rgba(0,0,0,${.02 + seededJitter(y + 1) * .04})`;
    ctx.fillRect(0, y, TEXTURE_WIDTH, 1);
  }
  const hinge = ctx.createLinearGradient(back ? TEXTURE_WIDTH : 0, 0, back ? TEXTURE_WIDTH - 95 : 95, 0);
  hinge.addColorStop(0, "rgba(0,0,0,.18)");
  hinge.addColorStop(.45, "rgba(0,0,0,.05)");
  hinge.addColorStop(.6, "rgba(0,0,0,.12)");
  hinge.addColorStop(.7, "rgba(255,255,255,.07)");
  hinge.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = hinge;
  ctx.fillRect(back ? TEXTURE_WIDTH - 95 : 0, 0, 95, TEXTURE_HEIGHT);
  ctx.textAlign = "left";
  ctx.fillStyle = INK;
  if (back) {
    ctx.font = printFont(40, "--font-display");
    ctx.fillText("To be continued.", 125, 910);
    ctx.font = printFont(26);
    ctx.fillText("amypretzel.com", 125, 1050);
  } else {
    ctx.font = printFont(34);
    ctx.fillText("AMY ZHOU", 125, 170);
    ctx.font = printFont(120, "--font-display");
    ctx.fillText("A little", 120, 380);
    ctx.fillText("book of", 120, 503);
    ctx.fillText("making.", 120, 626);
    ctx.fillStyle = INK_SOFT;
    ctx.font = printFont(30);
    ctx.fillText("Objects, and software to build objects.", 125, 1040);
  }
}

// Draws wrapped text and returns the baseline after the last line.
function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  let line = "";
  for (const word of text.split(/\s+/)) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = word;
      y += lineHeight;
    } else line = test;
  }
  if (line) ctx.fillText(line, x, y);
  return y;
}

// Page numbers sit on the outer corner: left on left-hand (odd) pages.
function drawFolio(ctx: CanvasRenderingContext2D, pageNumber: number) {
  ctx.fillStyle = INK_SOFT;
  ctx.font = printFont(24);
  ctx.textAlign = pageNumber % 2 ? "left" : "right";
  ctx.fillText(String(pageNumber), pageNumber % 2 ? PAGE_MARGIN : TEXTURE_WIDTH - PAGE_MARGIN, 1110);
  ctx.textAlign = "left";
}

function drawTextPage(ctx: CanvasRenderingContext2D, page: Extract<TexturePage, { kind: "text" }>) {
  drawPaper(ctx);
  const maxWidth = TEXTURE_WIDTH - PAGE_MARGIN * 2;
  ctx.textAlign = "left";
  ctx.fillStyle = INK;
  ctx.font = printFont(78, "--font-display");
  const y = wrapText(ctx, page.title, PAGE_MARGIN, 230, maxWidth, 88);
  ctx.font = printFont(42);
  wrapText(ctx, page.text, PAGE_MARGIN, y + 112, maxWidth, 62);
  drawFolio(ctx, page.pageNumber);
}

function drawSketchPage(ctx: CanvasRenderingContext2D, page: Extract<TexturePage, { kind: "sketch" }>) {
  drawPaper(ctx);
  ctx.fillStyle = INK_SOFT;
  ctx.font = printFont(30);
  if (page.hint) wrapText(ctx, page.hint, PAGE_MARGIN, 1010, TEXTURE_WIDTH - PAGE_MARGIN * 2, 44);
  drawFolio(ctx, page.pageNumber);
}

function isDrawable(page: TexturePage) {
  return page.kind === "text" || page.kind === "sketch";
}

function createPageCanvasTexture(content: TexturePage, lowDetail: boolean) {
  const canvas = document.createElement("canvas");
  // Pages are laid out in TEXTURE_WIDTH units and printed denser than that:
  // an open spread on a Retina laptop shows each page ~1300px wide, and a
  // 900px texture stretched over it read as blurry type.
  const scale = lowDetail ? 1 : PRINT_SCALE;
  canvas.width = TEXTURE_WIDTH * scale;
  canvas.height = TEXTURE_HEIGHT * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not create page texture context");
  }

  ctx.scale(canvas.width / TEXTURE_WIDTH, canvas.height / TEXTURE_HEIGHT);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  // Clamped to the GPU's maximum; keeps type sharp on pages seen at a slant.
  texture.anisotropy = 16;

  const paint = () => {
    if (content.kind === "cover") drawCover(ctx);
    else if (content.kind === "back-cover") drawCover(ctx, true);
    else if (content.kind === "text") drawTextPage(ctx, content);
    else if (content.kind === "sketch") drawSketchPage(ctx, content);
    else drawPaper(ctx);
  };
  paint();

  // Every printed page takes the pencil; reset repaints it clean.
  const surface = isDrawable(content) ? { ctx, texture, repaint: paint } : null;
  return { texture, surface };
}

function usePageTexture(content: TexturePage, id: string) {
  const lowDetail = useCompactBook();
  // loadBook() waits for Areal before this module renders, so one paint is
  // enough. Redrawing after fonts.ready repeated all the canvas work and
  // uploaded every texture a second time.
  const { texture, surface } = useMemo(() => createPageCanvasTexture(content, lowDetail), [content, lowDetail]);
  // Registered on mount, not when the texture is made: development mounts
  // twice, and a cleanup would otherwise leave the page undrawable.
  useEffect(() => {
    if (surface) {
      sketch.width = TEXTURE_WIDTH;
      sketch.height = TEXTURE_HEIGHT;
      registerSurface(id, surface);
    }
    return () => {
      texture.dispose();
      releaseSurface(id, texture);
    };
  }, [texture, surface, id]);
  return texture;
}

function createEdgeTexture(vertical: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#f0f0f0";
  ctx.fillRect(0, 0, 64, 64);
  // Each sheet sits a hair proud or shy of its neighbours, so the block of
  // pages reads as many leaves rather than one printed stripe.
  for (let i = 0; i < 64; i += 4) {
    const shade = .05 + seededJitter(i) * .18;
    const offset = Math.floor(seededJitter(i + 7) * 3) - 1;
    ctx.fillStyle = `rgba(90,90,90,${shade})`;
    ctx.fillRect(vertical ? i + offset : 0, vertical ? 0 : i + offset, vertical ? 1 : 64, vertical ? 64 : 1);
    ctx.fillStyle = `rgba(255,255,255,${.15 + seededJitter(i + 3) * .2})`;
    ctx.fillRect(vertical ? i + offset + 1 : 0, vertical ? 0 : i + offset + 1, vertical ? 1 : 64, vertical ? 64 : 1);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

// Short fibres laid at random, tiled across every page as shallow relief.
let paperFiber: CanvasTexture | undefined;
function getPaperFiber() {
  if (paperFiber) return paperFiber;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2600; i++) {
    const x = seededJitter(i * 3 + 11) * 256;
    const y = seededJitter(i * 3 + 12) * 256;
    const angle = seededJitter(i * 3 + 13) * Math.PI;
    const length = 3 + seededJitter(i + 40) * 9;
    const light = seededJitter(i + 90) > .5;
    ctx.strokeStyle = light ? `rgba(255,255,255,${.06 + seededJitter(i + 5) * .1})` : `rgba(0,0,0,${.06 + seededJitter(i + 6) * .1})`;
    ctx.lineWidth = .6 + seededJitter(i + 8) * .8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
    ctx.stroke();
  }
  paperFiber = new CanvasTexture(canvas);
  paperFiber.wrapS = paperFiber.wrapT = RepeatWrapping;
  paperFiber.repeat.set(3, 4);
  return paperFiber;
}

function createPageMaterials(frontTexture: Texture, backTexture: Texture, frontCover: boolean, backCover: boolean) {
  const white = new Color(frontCover || backCover ? "#f4f4f4" : "#ededed");
  const edgeMaps = frontCover || backCover ? [null, null] : [createEdgeTexture(true), createEdgeTexture(false)];
  const hoverEmissive = new Color("#ffffff");

  return [
    new MeshStandardMaterial({ color: white, map: edgeMaps[0], roughness: 0.88 }),
    new MeshStandardMaterial({ color: white, roughness: 0.88 }),
    new MeshStandardMaterial({ color: white, map: edgeMaps[1], roughness: 0.88 }),
    new MeshStandardMaterial({ color: white, map: edgeMaps[1], roughness: 0.88 }),
    new MeshPhysicalMaterial({
      color: "#ffffff",
      map: frontTexture,
      bumpMap: frontCover ? frontTexture : getPaperFiber(),
      bumpScale: frontCover ? 0.002 : 0.0012,
      sheen: frontCover ? 0.45 : 0,
      sheenColor: new Color("#8e8e93"),
      sheenRoughness: 0.85,
      roughness: 0.94,
      emissive: hoverEmissive,
      emissiveIntensity: 0,
    }),
    new MeshPhysicalMaterial({
      color: "#ffffff",
      map: backTexture,
      bumpMap: backCover ? backTexture : getPaperFiber(),
      bumpScale: backCover ? 0.002 : 0.0012,
      sheen: backCover ? 0.45 : 0,
      sheenColor: new Color("#8e8e93"),
      sheenRoughness: 0.85,
      roughness: 0.94,
      emissive: hoverEmissive,
      emissiveIntensity: 0,
    }),
  ];
}

type PageDrag = {
  startX: number;
  progress: number;
  moved: boolean;
};

function AnimatedPage({
  sheet,
  number,
  opened,
  bookClosed,
  onTurnTo,
  onDraggingChange,
  stackHeight,
}: {
  sheet: BookSheet;
  number: number;
  opened: boolean;
  bookClosed: boolean;
  stackHeight: number;
  onTurnTo: (page: number) => void;
  onDraggingChange: (dragging: boolean) => void;
}) {
  const invalidate = useThree(state => state.invalidate);
  const isCover = sheet.front.kind === "cover" || sheet.back.kind === "back-cover";
  const frontTexture = usePageTexture(sheet.front, `${number}-front`);
  const backTexture = usePageTexture(sheet.back, `${number}-back`);
  const groupRef = useRef<Group>(null);
  const skinnedMeshRef = useRef<SkinnedMesh>(null);
  const turnedAt = useRef(0);
  const lastOpened = useRef(opened);
  const drag = useRef<PageDrag | null>(null);
  const dragCleanup = useRef<(() => void) | null>(null);
  const [highlighted, setHighlighted] = useState(false);
  const lift = useRef(0);
  useCursor(highlighted);
  useEffect(() => () => dragCleanup.current?.(), []);

  const manualSkinnedMesh = useMemo(() => {
    const bones: Bone[] = [];
    for (let i = 0; i <= PAGE_SEGMENTS; i++) {
      const bone = new Bone();
      bones.push(bone);
      bone.position.x = i === 0 ? 0 : SEGMENT_WIDTH;
      if (i > 0) {
        bones[i - 1].add(bone);
      }
    }
    const skeleton = new Skeleton(bones);
    const materials = createPageMaterials(frontTexture, backTexture, sheet.front.kind === "cover", sheet.back.kind === "back-cover");
    const geometry = isCover ? pageGeometry.clone() : pageGeometry;
    if (isCover) geometry.scale(1.018, 1.028, COVER_DEPTH / PAGE_DEPTH);
    const mesh = new SkinnedMesh(geometry, materials);
    // Material 4 is the sheet's front face, 5 its back; either can be drawable.
    mesh.userData.sketch = {
      4: isDrawable(sheet.front) ? `${number}-front` : null,
      5: isDrawable(sheet.back) ? `${number}-back` : null,
    };
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    mesh.add(skeleton.bones[0]);
    mesh.bind(skeleton);
    return mesh;
  }, [frontTexture, backTexture, sheet, isCover, number]);

  useEffect(() => {
    if (!isDrawable(sheet.front) && !isDrawable(sheet.back)) return;
    return registerMesh(manualSkinnedMesh);
  }, [manualSkinnedMesh, sheet]);

  useEffect(() => () => {
    const materials = manualSkinnedMesh.material as MeshStandardMaterial[];
    materials[0].map?.dispose();
    materials[2].map?.dispose();
    materials.forEach(material => material.dispose());
    manualSkinnedMesh.skeleton.dispose();
    if (manualSkinnedMesh.geometry !== pageGeometry) manualSkinnedMesh.geometry.dispose();
  }, [manualSkinnedMesh]);

  useFrame((_, delta) => {
    delta = Math.min(delta, 0.05);
    let moving = false;
    const mesh = skinnedMeshRef.current;
    const group = groupRef.current;
    if (!mesh || !group) return;

    const materials = mesh.material as MeshStandardMaterial[];
    const targetEmissive = highlighted && !drag.current ? 0.035 : 0;
    moving = easing.damp(materials[4], "emissiveIntensity", targetEmissive, 0.12, delta) || moving;
    materials[5].emissiveIntensity = materials[4].emissiveIntensity;

    if (lastOpened.current !== opened) {
      turnedAt.current = Date.now();
      lastOpened.current = opened;
    }

    const sinceTurn = Date.now() - turnedAt.current;
    let turningTime = Math.min(420, sinceTurn) / 420;
    turningTime = Math.sin(turningTime * Math.PI);
    // After a leaf lands its free edge bounces up once and settles; the
    // stiff cover gets a heavier, later bounce at the hinge.
    const settleStart = isCover ? 420 : 340;
    const settleLength = isCover ? 620 : 480;
    const settle = reducedMotion?.matches ? 0 : MathUtils.clamp((sinceTurn - settleStart) / settleLength, 0, 1);
    const bounce = settle > 0 && settle < 1 ? Math.sin(settle * Math.PI) * (1 - settle * 0.5) : 0;

    // A hovered leaf lifts its free edge a little, as an invitation to turn it.
    const liftTarget = highlighted && !drag.current && !reducedMotion?.matches ? 1 : 0;
    moving = easing.damp(lift, "current", liftTarget, 0.14, delta) || moving;
    const hoverLift = lift.current * (isCover ? 0.045 : 0.085);

    // The hinge rotates above the table; the leaves settle in two physical stacks.
    let targetRotation = opened ? -Math.PI : 0;
    if (drag.current) {
      targetRotation += (opened ? 1 : -1) * Math.PI * drag.current.progress;
    }
    targetRotation += (opened ? 1 : -1) * hoverLift;
    if (isCover) targetRotation += (opened ? 1 : -1) * 0.05 * bounce;
    const arch = isCover || bookClosed ? 0 : 0.025 + 0.11 * turningTime + 0.03 * lift.current + 0.045 * bounce;
    const bendSign = opened ? 1 : -1;
    const tangent = (segment: number) => bendSign * Math.atan(
      (arch * Math.PI / PAGE_WIDTH) * Math.cos(Math.PI * segment / PAGE_SEGMENTS)
    );
    if (reducedMotion?.matches) group.position.z = stackHeight;
    else moving = easing.damp(group.position, "z", stackHeight, 0.3, delta) || moving;

    for (let i = 0; i < mesh.skeleton.bones.length; i++) {
      const target = i === 0 ? group : mesh.skeleton.bones[i];
      const rotation = i === 0 ? targetRotation + tangent(0) : tangent(i) - tangent(i - 1);
      if (reducedMotion?.matches) {
        target.rotation.y = rotation;
        target.rotation.x = 0;
      } else {
        // The free edge trails the hinge, so a turning leaf drags through the air and settles tip-last.
        const trail = drag.current ? 0.12 : easingFactor * (1 + 0.6 * i / PAGE_SEGMENTS);
        moving = easing.damp(target.rotation, "y", rotation, trail, delta) || moving;
        moving = easing.dampAngle(target.rotation, "x", 0, easingFactorFold, delta) || moving;
      }
    }
    if (moving || sinceTurn < settleStart + settleLength + 50 || drag.current) invalidate();
  });

  const beginDrag = useCallback(
    (clientX: number) => {
      dragCleanup.current?.();
      drag.current = { startX: clientX, progress: 0, moved: false };
      onDraggingChange(true);
      invalidate();

      const handleMove = (event: PointerEvent) => {
        const state = drag.current;
        if (!state) return;
        const dx = event.clientX - state.startX;
        // turning a right-hand page forward means dragging left; a turned
        // (left-hand) page flips back by dragging right
        const direction = opened ? 1 : -1;
        state.progress = MathUtils.clamp((dx * direction) / 240, 0, 1);
        if (Math.abs(dx) > 6) state.moved = true;
        invalidate();
      };

      const finishDrag = (cancelled = false) => {
        dragCleanup.current?.();
        const state = drag.current;
        drag.current = null;
        onDraggingChange(false);
        invalidate();
        if (!state) return;
        if (!cancelled && (!state.moved || state.progress > 0.35)) {
          onTurnTo(opened ? number : number + 1);
        }
        // otherwise the frame loop eases the page back to its resting pose
      };
      const handleUp = () => finishDrag();
      const handleCancel = () => finishDrag(true);

      window.addEventListener("pointermove", handleMove);
      window.addEventListener("pointerup", handleUp);
      window.addEventListener("pointercancel", handleCancel);
      dragCleanup.current = () => {
        window.removeEventListener("pointermove", handleMove);
        window.removeEventListener("pointerup", handleUp);
        window.removeEventListener("pointercancel", handleCancel);
        dragCleanup.current = null;
      };
    },
    [number, onDraggingChange, onTurnTo, opened, invalidate]
  );

  return (
    <group
      ref={groupRef}
      onPointerEnter={(event) => {
        event.stopPropagation();
        if (!sketch.held) setHighlighted(true);
      }}
      onPointerLeave={(event) => {
        event.stopPropagation();
        setHighlighted(false);
      }}
      onPointerDown={(event) => {
        event.stopPropagation();
        if (sketch.held) return; // the pencil owns the pointer
        beginDrag(event.nativeEvent.clientX);
      }}
    >
      <primitive
        object={manualSkinnedMesh}
        ref={skinnedMeshRef}

      />
    </group>
  );
}

function BookStack({
  sheets,
  page,
  onPageChange,
  onDraggingChange,
}: {
  sheets: BookSheet[];
  page: number;
  onPageChange: (page: number) => void;
  onDraggingChange: (dragging: boolean) => void;
}) {
  const [delayedPage, setDelayedPage] = useState(page);
  const invalidate = useThree(state => state.invalidate);
  const lastStep = useRef(0);

  // Leaves turn one at a time toward the requested page. Each step is
  // scheduled here rather than inside a state updater: updaters can run twice,
  // and a stray timer from an old request would walk the book back to it.
  useEffect(() => {
    if (delayedPage === page) return;
    const interval = Math.abs(page - delayedPage) > 2 ? 50 : 150;
    const wait = Math.max(0, interval - (performance.now() - lastStep.current));
    const timeout = setTimeout(() => {
      lastStep.current = performance.now();
      setDelayedPage(current => current + Math.sign(page - current));
    }, wait);
    return () => clearTimeout(timeout);
  }, [page, delayedPage]);

  const groupRef = useRef<Group>(null);
  const scale = 1;
  const thicknesses = sheets.map(sheet => sheet.front.kind === "cover" || sheet.back.kind === "back-cover" ? COVER_DEPTH : PAGE_DEPTH);
  const spineRadius = thicknesses.reduce((sum, depth) => sum + depth, 0) / 2;

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;
    // the model anchors at the spine, so a closed book hangs to one side;
    // slide it over so the lone cover reads centered
    const shift = (PAGE_WIDTH / 2) * scale;
    const targetX =
      delayedPage === 0 ? -shift : delayedPage === sheets.length ? shift : 0;
    if (reducedMotion?.matches) group.position.x = targetX;
    else if (easing.damp(group.position, "x", targetX, 0.5, Math.min(delta, .05))) invalidate();
  });

  return (
    <group
      ref={groupRef}
      position-x={-PAGE_WIDTH / 2}
      scale={scale}
    >
      <mesh position={[0, 0, spineRadius]} rotation-y={delayedPage === sheets.length ? Math.PI : 0} visible={delayedPage === 0 || delayedPage === sheets.length} castShadow receiveShadow>
        <cylinderGeometry args={[spineRadius, spineRadius, PAGE_HEIGHT * 1.028, 24, 1, false, Math.PI, Math.PI]} />
        <meshPhysicalMaterial color="#f4f4f4" roughness={.9} sheen={.45} sheenColor="#ffffff" />
      </mesh>
      {sheets.map((sheet, index) => (
        <AnimatedPage
          key={index}
          sheet={sheet}
          number={index}
          stackHeight={thicknesses[index] / 2 + (delayedPage > index
            ? thicknesses.slice(0, index).reduce((sum, depth) => sum + depth, 0)
            : thicknesses.slice(index + 1).reduce((sum, depth) => sum + depth, 0))}
          opened={delayedPage > index}
          bookClosed={delayedPage === 0 || delayedPage === sheets.length}
          onTurnTo={(nextPage) => {
            // 0 closes back to the front cover; sheets.length closes onto
            // the back cover
            const clamped = Math.min(Math.max(nextPage, 0), sheets.length);
            onPageChange(clamped);
          }}
          onDraggingChange={onDraggingChange}
        />
      ))}
    </group>
  );
}

// The camera drifts a few degrees with the pointer while nothing else is
// happening, so the table feels alive before the first click.
function PointerParallax({ controls }: { controls: RefObject<ComponentRef<typeof OrbitControls> | null> }) {
  const { gl, invalidate } = useThree();
  const pointer = useRef({ x: 0, y: 0 });
  const applied = useRef({ x: 0, y: 0 });
  const lastApplied = useRef({ x: 0, y: 0 });
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
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [gl, invalidate]);

  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const start = () => { orbiting.current = true; };
    const end = () => { orbiting.current = false; };
    c.addEventListener("start", start);
    c.addEventListener("end", end);
    return () => {
      c.removeEventListener("start", start);
      c.removeEventListener("end", end);
    };
  }, [controls]);

  useFrame((_, delta) => {
    const c = controls.current;
    if (!c || !c.enabled || orbiting.current || sketch.held) return;
    const target = { x: pointer.current.x * 0.045, y: pointer.current.y * 0.022 };
    const moving = easing.damp(applied.current, "x", target.x, 0.6, delta);
    const movingY = easing.damp(applied.current, "y", target.y, 0.6, delta);
    const dx = applied.current.x - lastApplied.current.x;
    const dy = applied.current.y - lastApplied.current.y;
    if (Math.abs(dx) > 1e-6 || Math.abs(dy) > 1e-6) {
      c.setAzimuthalAngle(c.getAzimuthalAngle() - dx);
      c.setPolarAngle(c.getPolarAngle() + dy);
      c.update();
    }
    lastApplied.current.x = applied.current.x;
    lastApplied.current.y = applied.current.y;
    if (moving || movingY) invalidate();
  });
  return null;
}

// While the pencil is in hand: it follows the pointer across the table, and a
// press-and-drag over the sketch page lays graphite onto that page's texture.
function PencilSketcher({ table }: { table: TableState }) {
  const { gl, camera, raycaster, invalidate } = useThree();
  const held = table.pencilHeld;

  useEffect(() => {
    sketch.held = held;
    sketch.drawing = false;
    sketch.last = null;
    if (!held) sketch.hasPointer = false;
    invalidate();
  }, [held, invalidate]);

  useEffect(() => {
    if (!held) return;
    const el = gl.domElement;
    const tabletop = new Plane(new Vector3(0, 1, 0), 0);
    const ndc = new Vector2();
    const hit = new Vector3();
    const aim = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      ndc.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      const hits = sketch.meshes.length ? raycaster.intersectObjects(sketch.meshes, false) : [];
      let onPage: { point: Vector3; uv?: Vector2; id: string } | undefined;
      for (const hit of hits) {
        const index = hit.face?.materialIndex;
        const id = index === undefined ? null : (hit.object.userData.sketch as Record<number, string | null>)?.[index];
        if (id && hit.uv) { onPage = { point: hit.point, uv: hit.uv, id }; break; }
      }
      if (onPage) {
        sketch.pointer.copy(onPage.point);
        sketch.hasPointer = true;
        if (sketch.drawing && onPage.uv) sketchAt(onPage.id, onPage.uv.x, onPage.uv.y);
      } else {
        if (raycaster.ray.intersectPlane(tabletop, hit)) { sketch.pointer.copy(hit); sketch.hasPointer = true; }
        sketch.last = null;
      }
      invalidate();
    };
    const down = (event: PointerEvent) => {
      if (!event.isPrimary) return;
      sketch.drawing = true;
      sketch.last = null;
      aim(event);
    };
    const up = () => { sketch.drawing = false; sketch.last = null; };
    el.addEventListener("pointermove", aim);
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointermove", aim);
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [held, gl, camera, raycaster, invalidate]);

  return null;
}

const FOV = 42;
const TABLE_TARGET = new Vector3(0, 0.04, 0);

// The table view: fits the whole interaction area, including taken pretzels
// and tipped coffee.
function tablePosition(aspect: number) {
  const distance = Math.max(4.9, (aspect < .9 ? 4.8 : 7) / aspect);
  return new Vector3(distance * 0.2, distance * 0.82, distance * 0.55);
}

export type ReadingSide = "spread" | "left" | "right";

// The reading view: close and nearly overhead, so the open pages fill the
// screen and read like a book in your hands. Phones frame one page at a time.
function readingPose(aspect: number, side: ReadingSide) {
  const halfFov = MathUtils.degToRad(FOV / 2);
  const visible = 2 * Math.tan(halfFov); // visible height per unit of distance
  const width = side === "spread" ? PAGE_WIDTH * 2 : PAGE_WIDTH;
  // Leave room for the controls along the bottom and a little air at the sides.
  const distance = Math.max(width / 0.86 / (visible * aspect), PAGE_HEIGHT / 0.74 / visible);
  const x = side === "left" ? -PAGE_WIDTH / 2 : side === "right" ? PAGE_WIDTH / 2 : 0;
  const target = new Vector3(x, 0, 0.12);
  const tilt = 0.2; // radians from straight down, toward the reader
  return { target, position: target.clone().add(new Vector3(0, distance * Math.cos(tilt), distance * Math.sin(tilt))) };
}

function ResponsiveCamera() {
  const { size } = useThree();
  // A stable position object: a fresh one on every page turn would snap the
  // camera back to the table view mid-read. The rig takes it from here.
  const position = useMemo(() => tablePosition(size.width / size.height), [size.width, size.height]);
  return <PerspectiveCamera makeDefault position={position} fov={FOV} />;
}

// Glides between the table view and the reading view when the book opens,
// closes or turns to the other page on a phone, then lets go so the visitor
// can still look around.
function CameraRig({ controls, reading, side }: { controls: RefObject<ComponentRef<typeof OrbitControls> | null>; reading: boolean; side: ReadingSide }) {
  const { camera, size, invalidate } = useThree();
  const pose = useMemo(() => {
    const aspect = size.width / size.height;
    return reading ? readingPose(aspect, side) : { target: TABLE_TARGET.clone(), position: tablePosition(aspect) };
  }, [reading, side, size.width, size.height]);
  const moving = useRef(false);

  useEffect(() => { moving.current = true; invalidate(); }, [pose, invalidate]);

  useFrame((_, delta) => {
    const c = controls.current;
    if (!moving.current || !c) return;
    if (reducedMotion?.matches) {
      camera.position.copy(pose.position);
      c.target.copy(pose.target);
      c.update();
      moving.current = false;
      return;
    }
    delta = Math.min(delta, 0.05);
    const a = easing.damp3(camera.position, pose.position, 0.45, delta);
    const b = easing.damp3(c.target, pose.target, 0.45, delta);
    c.update();
    if (a || b) invalidate();
    else moving.current = false;
  });
  return null;
}

function Tabletop() {
  const grain = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024; canvas.height = 1024;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#121212";
    ctx.fillRect(0, 0, 1024, 1024);
    for (let i = 0; i < 1800; i++) {
      const y = i / 1800 * 1024;
      ctx.strokeStyle = `rgba(255,255,255,${0.004 + seededJitter(i + 9) * 0.012})`;
      ctx.lineWidth = 0.5 + seededJitter(i + 3);
      ctx.beginPath(); ctx.moveTo(0, y);
      ctx.bezierCurveTo(300, y + Math.sin(i * .008) * 65, 750, y - Math.cos(i * .007) * 48, 1024, y);
      ctx.stroke();
    }
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.repeat.set(2, 2);
    texture.anisotropy = 8;
    return texture;
  }, []);
  useEffect(() => () => grain.dispose(), [grain]);
  return <RoundedBox args={[18, 0.18, 14]} radius={0.035} smoothness={3} position={[0, -0.09, 0]} receiveShadow>
    <meshStandardMaterial map={grain} roughness={0.88} bumpMap={grain} bumpScale={0.009} />
  </RoundedBox>;
}

function CanvasSizer() {
  const { gl, setSize } = useThree();

  useEffect(() => {
    const frame = gl.domElement.closest(".book-three-frame");
    if (!(frame instanceof HTMLElement)) return;

    const resize = () => {
      const rect = frame.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setSize(rect.width, rect.height);
      }
    };

    resize();
    const animationFrame = window.requestAnimationFrame(resize);
    const timeout = window.setTimeout(resize, 500);
    const observer = new ResizeObserver(resize);
    observer.observe(frame);
    window.addEventListener("resize", resize);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(timeout);
      observer.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, [gl, setSize]);

  return null;
}

function BookScene({
  sheets,
  page,
  onPageChange,
  table,
  side,
}: {
  sheets: BookSheet[];
  page: number;
  onPageChange: (page: number) => void;
  table: TableState;
  side: ReadingSide;
}) {
  const controlsRef = useRef<ComponentRef<typeof OrbitControls>>(null);
  const lowDetail = useCompactBook();

  const handleDraggingChange = useCallback((dragging: boolean) => {
    if (controlsRef.current) {
      controlsRef.current.enabled = !dragging;
    }
  }, []);
  // Orbit yields to the pencil the same way it yields to a page drag.
  useEffect(() => { handleDraggingChange(table.pencilHeld); }, [table.pencilHeld, handleDraggingChange]);

  return (
    <>
      <CanvasSizer />
      <ResponsiveCamera />
      <color attach="background" args={["#000000"]} />
      <ambientLight intensity={0.18} />
      <hemisphereLight args={["#ffffff", "#2a2a2a", 0.55]} />
      <directionalLight
        position={[-3, 6, -3]}
        color="#ffffff"
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
      <directionalLight position={[4, 3, 4]} intensity={0.25} color="#e8efff" />
      <Tabletop />
      <ContactShadows
        position={[0, 0.0015, 0]}
        opacity={lowDetail ? 0.3 : 0.42}
        scale={[7.5, 6]}
        blur={2.4}
        far={1.3}
        resolution={lowDetail ? 256 : 512}
        color="#000000"
        frames={Infinity}
      />
      <TableDecor table={table} onDraggingChange={handleDraggingChange} />
      <group position-y={0.003} rotation-x={-Math.PI / 2}>
        <BookStack sheets={sheets} page={page} onPageChange={onPageChange} onDraggingChange={handleDraggingChange} />
      </group>
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableZoom={false}
        minDistance={2.4}
        maxDistance={20}
        minPolarAngle={0.2}
        maxPolarAngle={0.95}
        rotateSpeed={0.7}
        enableDamping
        dampingFactor={0.08}
        target={[0, 0.04, 0]}
      />
      <CameraRig controls={controlsRef} reading={page > 0 && page < sheets.length} side={side} />
      {!lowDetail && <PointerParallax controls={controlsRef} />}
      <PencilSketcher table={table} />
    </>
  );
}

function BookCanvas({
  sheets,
  page,
  onPageChange,
  table,
  side,
  onReady,
}: {
  sheets: BookSheet[];
  page: number;
  onPageChange: (page: number) => void;
  table: TableState;
  side: ReadingSide;
  onReady?: () => void;
}) {
  const lowDetail = useCompactBook();
  return (
    <div className="book-three-frame" data-pencil={table.pencilHeld || undefined}>
      <Canvas
        className="book-three-canvas"
        shadows="variance"
        frameloop="demand"
        camera={{ position: [0.82, 3.36, 2.25], fov: FOV }}
        // Render at the screen's own density, up to 2x. Desktop was capped at
        // 1.5x, which Retina screens upscaled into a soft, blurry book.
        dpr={[1, 2]}
        gl={{ alpha: false, antialias: !lowDetail, powerPreference: "high-performance" }}
        // The contact-shadow pass clears its render target with the renderer's
        // clear alpha; on an opaque canvas that is 1, which paints the whole
        // shadow plane dark instead of only where something casts.
        onCreated={({ gl }) => {
          gl.setClearAlpha(0);
          // ACES (the default) greys whites out; Neutral keeps the paper white
          // and the black table black, so the book reads crisp, not muddy.
          gl.toneMapping = NeutralToneMapping;
        }}
      >
        <BookScene sheets={sheets} page={page} onPageChange={onPageChange} table={table} side={side} />
        <SceneReady onReady={onReady} />
      </Canvas>
    </div>
  );
}

function SceneReady({ onReady }: { onReady?: () => void }) {
  const frame = useRef<number | null>(null);
  useEffect(() => () => { if (frame.current !== null) cancelAnimationFrame(frame.current); }, []);
  useFrame(() => {
    if (frame.current !== null) return;
    // Notify after the first completed WebGL frame, not just canvas creation.
    frame.current = requestAnimationFrame(() => {
      performance.mark("book-ready");
      onReady?.();
    });
  });
  return null;
}

function makeBookModel(chapters: BookChapter[]) {
  // One chapter to a page, then the goodbye, then a blank spread to draw on.
  const faces: TexturePage[] = [];
  const add = (face: UnnumberedPage) =>
    faces.push({ ...face, pageNumber: faces.length + 1 } as TexturePage);
  for (const chapter of chapters) add({ kind: "text", title: chapter.title, text: chapter.text });
  add({ kind: "text", title: bookEnding.title, text: bookEnding.text });
  // The blank spread starts on a left-hand page, so pad to an even count first.
  if (faces.length % 2) add({ kind: "sketch" });
  add({ kind: "sketch", hint: bookEnding.sketchHint });
  add({ kind: "sketch" });

  // sheet 0 is the cover and page 1; sheet k carries pages 2k and 2k + 1;
  // the last sheet's back is the back cover.
  const sheets: BookSheet[] = [{ front: { kind: "cover" }, back: faces[0] ?? { kind: "blank" } }];
  for (let i = 1; i < faces.length; i += 2) {
    sheets.push({ front: faces[i], back: faces[i + 1] ?? { kind: "back-cover" } });
  }
  if (faces.length % 2 === 1) sheets.push({ front: { kind: "blank" }, back: { kind: "back-cover" } });
  return { sheets };
}

// What a page says, for the screen-reader announcement on each turn.
function describeFace(face: TexturePage) {
  switch (face.kind) {
    case "text": return `${face.title}. ${face.text}`;
    case "sketch": return face.hint ?? "A blank page.";
    case "cover": return "A little book of making, by Amy Zhou.";
    case "back-cover": return "Back cover. To be continued.";
    default: return "";
  }
}

// Spilling the coffee and taking a pretzel, as plain buttons. The props also
// respond to taps and drags; these make the two easy to find and keyboard-able.
function TableButtons({ table }: { table: TableState }) {
  const taken = table.cookiesTaken.filter(Boolean).length;
  const changed = table.coffeeTipped || table.coffeeSpilled || taken > 0;
  return <div className="book-toys">
    <Button variant="pill" onClick={() => table.setCoffee(!table.coffeeTipped)}>{table.coffeeTipped ? "Stand the cup up" : "Spill coffee"}</Button>
    <Button variant="pill" disabled={taken === PRETZEL_COUNT} onClick={() => table.setCookie(table.cookiesTaken.lastIndexOf(false), true)}>Take a pretzel</Button>
    {changed && <Button variant="text" onClick={table.reset}>Reset the table</Button>}
    <p className="sr-only" role="status">{table.coffeeSpilled ? "Coffee spilled. " : ""}{taken ? `${taken} of ${PRETZEL_COUNT} pretzels taken.` : ""}</p>
  </div>;
}

export default function StoryBook({ onExit, onReady }: { onExit?: () => void; onReady?: () => void }) {
  const { sheets } = useMemo(() => makeBookModel(bookChapters), []);
  const table = useTableState();
  const compact = useCompactBook();
  // page = sheets flipped: 0 is the closed front cover, sheets.length is
  // the closed back cover
  const [page, setPageState] = useState(0);
  // Phones read one page of an open spread at a time.
  const [phoneSide, setPhoneSide] = useState<"left" | "right">("left");
  const lastPage = sheets.length;
  const atBackCover = page === lastPage;
  const open = page > 0 && page < lastPage;
  const side: ReadingSide = compact ? phoneSide : "spread";

  const setPage = useCallback((nextPage: number) => {
    setPageState(current => {
      const clamped = Math.min(Math.max(nextPage, 0), lastPage);
      // Turning back lands on the right-hand page, the one just left behind.
      setPhoneSide(clamped < current ? "right" : "left");
      return clamped;
    });
  }, [lastPage]);

  const next = useCallback(() => {
    if (atBackCover) { onExit?.(); return; }
    if (compact && open && phoneSide === "left") { setPhoneSide("right"); return; }
    setPage(page + 1);
  }, [atBackCover, compact, open, phoneSide, page, setPage, onExit]);

  const previous = useCallback(() => {
    if (compact && open && phoneSide === "right") { setPhoneSide("left"); return; }
    setPage(page - 1);
  }, [compact, open, phoneSide, page, setPage]);

  // While the pencil is in hand, the first Escape only puts it down; a second
  // one leaves the book. This listener lives here, always attached and reading
  // the current state, because the canvas's own effects attach a beat later
  // and a quick Escape would otherwise reach the overlay first.
  const pencilHeld = useRef(table.pencilHeld);
  useLayoutEffect(() => { pencilHeld.current = table.pencilHeld; }, [table.pencilHeld]);
  const { setPencil } = table;
  useEffect(() => {
    function onEscape(event: KeyboardEvent) {
      if (event.key !== "Escape" || !pencilHeld.current) return;
      event.stopImmediatePropagation();
      pencilHeld.current = false;
      setPencil(false);
    }
    window.addEventListener("keydown", onEscape, { capture: true });
    return () => window.removeEventListener("keydown", onEscape, { capture: true });
  }, [setPencil]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowRight" && !atBackCover) next();
      else if (event.key === "ArrowLeft") previous();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [next, previous, atBackCover]);

  const left = open ? sheets[page - 1].back : null;
  const right = open ? sheets[page].front : null;
  const leftNumber = page * 2 - 1;
  const counter = page === 0 ? "" : atBackCover ? "The end"
    : compact ? `Page ${phoneSide === "left" ? leftNumber : leftNumber + 1}`
    : `Pages ${leftNumber} and ${leftNumber + 1}`;
  const announcement = page === 0 ? describeFace(sheets[0].front)
    : atBackCover ? describeFace({ kind: "back-cover" })
    : [compact && phoneSide === "right" ? null : left, compact && phoneSide === "left" ? null : right]
        .filter((face): face is TexturePage => face !== null).map(describeFace).join(" ");
  const ending = page >= lastPage - 1;

  return (
    <div className="storybook">
      <div className="storybook-canvas" aria-hidden="true">
        <BookCanvas sheets={sheets} page={page} onPageChange={setPage} onReady={onReady} table={table} side={side} />
      </div>
      <TableButtons table={table} />
      <p className="sr-only" aria-live="polite">{announcement}</p>
      <div className="storybook-bar">
        <div className="storybook-pagination">
          <Button variant="text" aria-label="Previous page" disabled={page === 0} onClick={previous}>Previous</Button>
          <span className="ui-meta">{counter}</span>
          <Button variant="text" aria-label={atBackCover ? "Go to the website" : page === 0 ? "Open the book" : "Next page"} onClick={next}>{atBackCover ? "Go to the website" : page === 0 ? "Open" : "Next"}</Button>
        </div>
        <div className="storybook-aside">
          {ending && <nav className="storybook-links" aria-label="Amy's work">
            <Link href="/portfolio">Objects</Link>
            <Link href="/software">Software</Link>
          </nav>}
          <details className="book-reading">
            <summary>Read as text</summary>
            <div className="book-reading-panel">
              {bookChapters.map(chapter => <section key={chapter.id}>
                <h2>{chapter.title}</h2>
                <p>{chapter.text}</p>
              </section>)}
              <section><h2>{bookEnding.title}</h2><p>{bookEnding.text}</p></section>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
