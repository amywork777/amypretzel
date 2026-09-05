"use client";

import {
  OrbitControls,
  PerspectiveCamera,
  RoundedBox,
  useCursor,
} from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { easing } from "maath";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentRef } from "react";
import {
  Bone,
  BoxGeometry,
  CanvasTexture,
  Color,
  Float32BufferAttribute,
  MathUtils,
  RepeatWrapping,
  MeshStandardMaterial,
  MeshPhysicalMaterial,
  Skeleton,
  SkinnedMesh,
  SRGBColorSpace,
  Uint16BufferAttribute,
  Vector3,
} from "three";
import type { Group, Texture } from "three";
import { bookChapters, type BookChapter } from "./chapters";
import TableDecor from "./table-decor";

type StoryPage = {
  text: string;
  title: string;
  chapter: string;
  pageNumber: number;
};

type TexturePage =
  | { kind: "cover" }
  | { kind: "back-cover" }
  | { kind: "blank" }
  | { kind: "story"; page: StoryPage };

type BookSheet = {
  front: TexturePage;
  back: TexturePage;
};

const TEXTURE_WIDTH = 900;
const TEXTURE_HEIGHT = 1200;
const PAGE_WIDTH = 1.34;
const PAGE_HEIGHT = 1.9;
const PAGE_DEPTH = 0.018;
const COVER_DEPTH = 0.035;
const PAGE_SEGMENTS = 30;

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
    ? `400 ${size}px Georgia, serif`
    : `400 ${size}px Helvetica, Arial, sans-serif`;
}

let paperBase: HTMLCanvasElement | undefined;
function drawPaper(target: CanvasRenderingContext2D) {
  if (paperBase) { target.drawImage(paperBase, 0, 0); return; }
  paperBase = document.createElement("canvas");
  paperBase.width = TEXTURE_WIDTH;
  paperBase.height = TEXTURE_HEIGHT;
  const ctx = paperBase.getContext("2d")!;
  ctx.fillStyle = "#f5f1e7";
  ctx.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);
  for (let i = 0; i < 24000; i++) {
    ctx.fillStyle = `rgba(85,70,45,${seededJitter(i + 2) * .035})`;
    ctx.fillRect(seededJitter(i) * TEXTURE_WIDTH, seededJitter(i + 1) * TEXTURE_HEIGHT, 1, 1);
  }
  const gutter = ctx.createLinearGradient(0, 0, TEXTURE_WIDTH, 0);
  gutter.addColorStop(0, "rgba(58,45,25,.23)");
  gutter.addColorStop(.08, "rgba(58,45,25,.02)");
  gutter.addColorStop(.85, "rgba(58,45,25,0)");
  gutter.addColorStop(1, "rgba(58,45,25,.06)");
  ctx.fillStyle = gutter;
  ctx.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);
  target.drawImage(paperBase, 0, 0);
}

function drawCover(ctx: CanvasRenderingContext2D, back = false) {
  ctx.fillStyle = "#493333";
  ctx.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);
  // Fine crossing threads, also used by the material as shallow relief.
  for (let x = 0; x < TEXTURE_WIDTH; x += 3) {
    ctx.fillStyle = `rgba(230,205,175,${.025 + seededJitter(x) * .05})`;
    ctx.fillRect(x, 0, 1, TEXTURE_HEIGHT);
  }
  for (let y = 0; y < TEXTURE_HEIGHT; y += 3) {
    ctx.fillStyle = `rgba(10,5,3,${.06 + seededJitter(y + 1) * .08})`;
    ctx.fillRect(0, y, TEXTURE_WIDTH, 1);
  }
  const hinge = ctx.createLinearGradient(back ? TEXTURE_WIDTH : 0, 0, back ? TEXTURE_WIDTH - 95 : 95, 0);
  hinge.addColorStop(0, "rgba(0,0,0,.3)");
  hinge.addColorStop(.45, "rgba(0,0,0,.05)");
  hinge.addColorStop(.6, "rgba(0,0,0,.24)");
  hinge.addColorStop(.7, "rgba(255,240,210,.08)");
  hinge.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = hinge;
  ctx.fillRect(back ? TEXTURE_WIDTH - 95 : 0, 0, 95, TEXTURE_HEIGHT);
  ctx.textAlign = "left";
  ctx.fillStyle = "#d8c8a6";
  if (back) {
    ctx.font = printFont(32, "--font-display");
    ctx.fillText("To be continued.", 125, 910);
    ctx.font = printFont(19);
    ctx.fillText("amypretzel.com", 125, 1050);
  } else {
    ctx.font = printFont(24);
    ctx.fillText("AMY ZHOU", 125, 160);
    ctx.font = printFont(120, "--font-display");
    ctx.fillText("A little", 120, 380);
    ctx.fillText("book of", 120, 503);
    ctx.fillText("making.", 120, 626);
    ctx.fillStyle = "rgba(216,200,166,.75)";
    ctx.font = printFont(23);
    ctx.fillText("Hardware, software, and the in-between.", 125, 965);
    ctx.fillRect(125, 1010, 45, 1);
    ctx.font = printFont(18);
    ctx.fillText("A PERSONAL HISTORY", 125, 1060);
  }
}

function drawStoryPage(ctx: CanvasRenderingContext2D, page: StoryPage) {
  drawPaper(ctx);
  const margin = 116;
  const maxWidth = TEXTURE_WIDTH - margin * 2;
  ctx.textAlign = "left";
  ctx.fillStyle = "#807a6e";
  ctx.font = printFont(18);
  ctx.fillText(page.chapter.toUpperCase(), margin, 104);
  ctx.fillStyle = "#d4ccbc";
  ctx.fillRect(margin, 130, maxWidth, 1);
  ctx.fillStyle = "#38352f";
  ctx.font = printFont(70, "--font-display");
  const titleWords = page.title.split(" ");
  let titleLine = "";
  let y = 280;
  for (const word of titleWords) {
    const test = titleLine ? `${titleLine} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && titleLine) {
      ctx.fillText(titleLine, margin, y);
      titleLine = word; y += 78;
    } else titleLine = test;
  }
  ctx.fillText(titleLine, margin, y);
  y += 98;
  ctx.font = printFont(32);
  const words = page.text.split(/\s+/);
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, margin, y); line = word; y += 53;
    } else line = test;
  }
  if (line) ctx.fillText(line, margin, y);
  ctx.fillStyle = "#807a6e";
  ctx.font = printFont(18);
  ctx.fillText("AMY ZHOU", margin, 1090);
  ctx.textAlign = "right";
  ctx.fillText(String(page.pageNumber).padStart(2, "0"), TEXTURE_WIDTH - margin, 1090);
  ctx.textAlign = "left";
}

function createPageCanvasTexture(content: TexturePage) {
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not create page texture context");
  }

  ctx.scale(768 / TEXTURE_WIDTH, 1024 / TEXTURE_HEIGHT);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;

  if (content.kind === "cover") {
    drawCover(ctx);
  } else if (content.kind === "back-cover") {
    drawCover(ctx, true);
  } else if (content.kind === "story") {
    drawStoryPage(ctx, content.page);
  } else {
    drawPaper(ctx);
  }

  return texture;
}

function usePageTexture(content: TexturePage) {
  // These pages use installed system fonts. Redrawing after fonts.ready only
  // repeated all of the canvas work and uploaded every texture a second time.
  const texture = useMemo(() => createPageCanvasTexture(content), [content]);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

function createEdgeTexture(vertical: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#e9e1ce";
  ctx.fillRect(0, 0, 64, 64);
  for (let i = 0; i < 64; i += 8) {
    ctx.fillStyle = `rgba(98,82,57,${.1 + seededJitter(i) * .14})`;
    ctx.fillRect(vertical ? i : 0, vertical ? 0 : i, vertical ? 1 : 64, vertical ? 64 : 1);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

function createPageMaterials(frontTexture: Texture, backTexture: Texture, frontCover: boolean, backCover: boolean) {
  const white = new Color(frontCover || backCover ? "#493333" : "#e8e0cd");
  const edgeMaps = frontCover || backCover ? [null, null] : [createEdgeTexture(true), createEdgeTexture(false)];
  const hoverEmissive = new Color("#c98a5a");

  return [
    new MeshStandardMaterial({ color: white, map: edgeMaps[0], roughness: 0.88 }),
    new MeshStandardMaterial({ color: white, roughness: 0.88 }),
    new MeshStandardMaterial({ color: white, map: edgeMaps[1], roughness: 0.88 }),
    new MeshStandardMaterial({ color: white, map: edgeMaps[1], roughness: 0.88 }),
    new MeshPhysicalMaterial({
      color: "#ffffff",
      map: frontTexture,
      bumpMap: frontCover ? frontTexture : null,
      bumpScale: frontCover ? 0.002 : 0,
      sheen: frontCover ? 0.45 : 0,
      sheenColor: new Color("#ad8d81"),
      sheenRoughness: 0.85,
      roughness: 0.94,
      emissive: hoverEmissive,
      emissiveIntensity: 0,
    }),
    new MeshPhysicalMaterial({
      color: "#ffffff",
      map: backTexture,
      bumpMap: backCover ? backTexture : null,
      bumpScale: backCover ? 0.002 : 0,
      sheen: backCover ? 0.45 : 0,
      sheenColor: new Color("#ad8d81"),
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
  const frontTexture = usePageTexture(sheet.front);
  const backTexture = usePageTexture(sheet.back);
  const groupRef = useRef<Group>(null);
  const skinnedMeshRef = useRef<SkinnedMesh>(null);
  const turnedAt = useRef(0);
  const lastOpened = useRef(opened);
  const drag = useRef<PageDrag | null>(null);
  const dragCleanup = useRef<(() => void) | null>(null);
  const [highlighted, setHighlighted] = useState(false);
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
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    mesh.add(skeleton.bones[0]);
    mesh.bind(skeleton);
    return mesh;
  }, [frontTexture, backTexture, sheet, isCover]);

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

    let turningTime = Math.min(420, Date.now() - turnedAt.current) / 420;
    turningTime = Math.sin(turningTime * Math.PI);

    // The hinge rotates above the table; the leaves settle in two physical stacks.
    let targetRotation = opened ? -Math.PI : 0;
    if (drag.current) {
      targetRotation += (opened ? 1 : -1) * Math.PI * drag.current.progress;
    }
    const arch = isCover || bookClosed ? 0 : 0.025 + 0.11 * turningTime;
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
        moving = easing.damp(target.rotation, "y", rotation, drag.current ? 0.12 : easingFactor, delta) || moving;
        moving = easing.dampAngle(target.rotation, "x", 0, easingFactorFold, delta) || moving;
      }
    }
    if (moving || turningTime > 0.001 || drag.current) invalidate();
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
        setHighlighted(true);
      }}
      onPointerLeave={(event) => {
        event.stopPropagation();
        setHighlighted(false);
      }}
      onPointerDown={(event) => {
        event.stopPropagation();
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

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const goToPage = () => {
      setDelayedPage((currentPage) => {
        if (page === currentPage) {
          return currentPage;
        }

        timeout = setTimeout(goToPage, Math.abs(page - currentPage) > 2 ? 50 : 150);
        return page > currentPage ? currentPage + 1 : currentPage - 1;
      });
    };

    goToPage();
    return () => clearTimeout(timeout);
  }, [page]);

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
        <meshPhysicalMaterial color="#493333" roughness={.9} sheen={.45} sheenColor="#ad8d81" />
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

function ResponsiveCamera() {
  const { size } = useThree();
  const aspect = size.width / size.height;
  // Fit an open spread with a little table around it, including portrait phones.
  const distance = Math.max(4.9, 4.8 / aspect);
  return <PerspectiveCamera makeDefault position={[distance * 0.2, distance * 0.82, distance * 0.55]} fov={42} />;
}

function Tabletop() {
  const grain = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024; canvas.height = 1024;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#c3b096";
    ctx.fillRect(0, 0, 1024, 1024);
    for (let i = 0; i < 1800; i++) {
      const y = i / 1800 * 1024;
      ctx.strokeStyle = `rgba(97,77,48,${0.015 + seededJitter(i + 9) * 0.04})`;
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
}: {
  sheets: BookSheet[];
  page: number;
  onPageChange: (page: number) => void;
}) {
  const controlsRef = useRef<ComponentRef<typeof OrbitControls>>(null);

  const handleDraggingChange = useCallback((dragging: boolean) => {
    if (controlsRef.current) {
      controlsRef.current.enabled = !dragging;
    }
  }, []);

  return (
    <>
      <CanvasSizer />
      <ResponsiveCamera />
      <color attach="background" args={["#ded8cc"]} />
      <ambientLight intensity={0.3} />
      <hemisphereLight args={["#f7f5ef", "#847561", 0.65]} />
      <directionalLight
        position={[-3, 6, -3]}
        color="#fff7ed"
        intensity={2.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
        shadow-normalBias={0.004}
        shadow-radius={5}
        shadow-blurSamples={8}
        shadow-bias={-0.0001}
      />
      <directionalLight position={[4, 3, 4]} intensity={0.25} color="#e8efff" />
      <Tabletop />
      <TableDecor />
      <group position-y={0.003} rotation-x={-Math.PI / 2}>
        <BookStack sheets={sheets} page={page} onPageChange={onPageChange} onDraggingChange={handleDraggingChange} />
      </group>
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableZoom={false}
        minDistance={2.4}
        maxDistance={20}
        minPolarAngle={0.25}
        maxPolarAngle={0.95}
        rotateSpeed={0.7}
        enableDamping
        dampingFactor={0.08}
        target={[0, 0.04, 0]}
      />
    </>
  );
}

function BookCanvas({
  sheets,
  page,
  onPageChange,
  onReady,
}: {
  sheets: BookSheet[];
  page: number;
  onPageChange: (page: number) => void;
  onReady?: () => void;
}) {
  return (
    <div className="book-three-frame">
      <Canvas
        className="book-three-canvas"
        shadows="variance"
        frameloop="demand"
        camera={{ position: [0.82, 3.36, 2.25], fov: 42 }}
        dpr={[1, 1.5]}
        gl={{ alpha: false, antialias: true, powerPreference: "high-performance" }}
      >
        <BookScene sheets={sheets} page={page} onPageChange={onPageChange} />
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
  let pageNumber = 0;
  const pages: StoryPage[] = chapters.flatMap((chapter) =>
    chapter.pages.map((page) => {
      pageNumber += 1;
      return { text: page.text, title: page.title, chapter: chapter.kicker, pageNumber };
    })
  );

  // pages flow two-up continuously — no chapter breaks, no blank fillers.
  // sheet 0 is cover/p1, sheet k is p2k/p2k+1, the final back is the cover.
  const sheets: BookSheet[] = [
    {
      front: { kind: "cover" },
      back: pages[0] ? { kind: "story", page: pages[0] } : { kind: "blank" },
    },
  ];
  for (let i = 1; i < pages.length; i += 2) {
    sheets.push({
      front: { kind: "story", page: pages[i] },
      back: pages[i + 1]
        ? { kind: "story", page: pages[i + 1] }
        : { kind: "back-cover" },
    });
  }
  if (pages.length % 2 === 1) {
    // odd page count: the last story page sits on a sheet back, so the
    // back cover needs a final sheet of its own
    sheets.push({ front: { kind: "blank" }, back: { kind: "back-cover" } });
  }

  return { sheets, spreadCount: Math.ceil(pages.length / 2) };
}

export default function StoryBook({ onExit, onReady }: { onExit?: () => void; onReady?: () => void }) {
  const { sheets } = useMemo(() => makeBookModel(bookChapters), []);
  // page = sheets flipped: 0 is the closed front cover, sheets.length is
  // the closed back cover
  const [page, setPageState] = useState(0);
  const lastPage = sheets.length;
  const atBackCover = page === lastPage;

  function setPage(nextPage: number) {
    if (atBackCover && nextPage > lastPage) {
      // The forward control leaves the book; previous still opens it again.
      onExit?.();
      return;
    }
    setPageState(Math.min(Math.max(nextPage, 0), lastPage));
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowRight") {
        setPageState((current) => Math.min(current + 1, lastPage));
      } else if (event.key === "ArrowLeft") {
        setPageState((current) => Math.max(current - 1, 0));
      } else if (event.key === "Escape") {
        onExit?.();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lastPage, onExit]);

  return (
    <div className="storybook">
      <div className="storybook-canvas" aria-hidden="true">
        <BookCanvas sheets={sheets} page={page} onPageChange={setPage} onReady={onReady} />
      </div>
      <div className="storybook-controls">
        <div className="storybook-pagination">
          <button type="button" aria-label="Previous page" disabled={page === 0} onClick={() => setPage(page - 1)}>←</button>
          <span aria-live="polite">{page === 0 ? "A little book of making" : atBackCover ? "To be continued" : `${String(page * 2 - 1).padStart(2, "0")} — ${String(page * 2).padStart(2, "0")}`}</span>
          <button type="button" aria-label={atBackCover ? "Enter site" : "Next page"} onClick={() => setPage(page + 1)}>→</button>
        </div>
        <p className="storybook-hint">Click a page to turn · Drag to look around · ← → to read</p>
      </div>
      <details className="book-reading"><summary>Read as text</summary>
        {bookChapters.map(chapter => <section key={chapter.id}><h2>{chapter.title}</h2>{chapter.pages.map(p => <p key={p.title}>{p.text}</p>)}</section>)}
      </details>
    </div>
  );
}
