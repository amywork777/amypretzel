"use client";

import {
  ContactShadows,
  OrbitControls,
  PerspectiveCamera,
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
  MeshStandardMaterial,
  Skeleton,
  SkinnedMesh,
  SRGBColorSpace,
  Uint16BufferAttribute,
  Vector3,
} from "three";
import type { Group, Texture } from "three";
import { bookChapters, type BookChapter } from "./chapters";

type StoryPage = {
  text: string;
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
const PAGE_DEPTH = 0.0055; // slight chunk per sheet; thickness comes from the fan
const PAGE_SEGMENTS = 30;

const SEGMENT_WIDTH = PAGE_WIDTH / PAGE_SEGMENTS;

// page-turn animation feel (after Wawa Sensei's book-slider technique)
const easingFactor = 0.5;
const easingFactorFold = 0.3;
const insideCurveStrength = 0.18;
const outsideCurveStrength = 0.05;
const turningCurveStrength = 0.09;

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

function cssFontFamily(varName: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
  return value || fallback;
}

function drawPaper(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#fffef8";
  ctx.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);

  ctx.fillStyle = "rgba(126, 72, 97, 0.18)";
  ctx.fillRect(118, 0, 2, TEXTURE_HEIGHT);

  ctx.fillStyle = "rgba(62, 50, 38, 0.06)";
  for (let y = 150; y < TEXTURE_HEIGHT - 80; y += 58) {
    ctx.fillRect(80, y, TEXTURE_WIDTH - 150, 2);
  }

  const edgeShade = ctx.createLinearGradient(0, 0, TEXTURE_WIDTH, 0);
  edgeShade.addColorStop(0, "rgba(54, 42, 28, 0.08)");
  edgeShade.addColorStop(0.16, "rgba(54, 42, 28, 0)");
  edgeShade.addColorStop(0.84, "rgba(54, 42, 28, 0)");
  edgeShade.addColorStop(1, "rgba(54, 42, 28, 0.08)");
  ctx.fillStyle = edgeShade;
  ctx.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);
}

function scriptFont(size: number, weight: 400 | 600 = 400) {
  return `${weight} ${size}px ${cssFontFamily(
    "--font-script",
    "'Caveat', 'Comic Sans MS', cursive"
  )}`;
}

// deterministic per-line wobble so redraws don't reshuffle the handwriting
function seededJitter(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// the same pixel pretzel the site nav uses, tinted cream for the cover
const pretzelImage =
  typeof window === "undefined"
    ? null
    : (() => {
        const image = new window.Image();
        image.src = "/pretzel.png";
        return image;
      })();

function drawPretzel(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number
) {
  if (
    !pretzelImage ||
    !pretzelImage.complete ||
    pretzelImage.naturalWidth === 0
  ) {
    return;
  }
  const off = document.createElement("canvas");
  off.width = pretzelImage.naturalWidth;
  off.height = pretzelImage.naturalHeight;
  const offCtx = off.getContext("2d");
  if (!offCtx) return;
  offCtx.drawImage(pretzelImage, 0, 0);
  offCtx.globalCompositeOperation = "source-in";
  offCtx.fillStyle = "#f7dfb8";
  offCtx.fillRect(0, 0, off.width, off.height);

  const height = size * (off.height / off.width);
  ctx.imageSmoothingEnabled = false; // keep the pixel-art edges crisp
  ctx.drawImage(off, cx - size / 2, cy - height / 2, size, height);
  ctx.imageSmoothingEnabled = true;
}

function drawHeart(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  color: string
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, s * 0.35);
  ctx.bezierCurveTo(-s, -s * 0.35, -s * 0.4, -s, 0, -s * 0.3);
  ctx.bezierCurveTo(s * 0.4, -s, s, -s * 0.35, 0, s * 0.35);
  ctx.fill();
  ctx.restore();
}

function drawCover(ctx: CanvasRenderingContext2D, back = false) {
  ctx.fillStyle = back ? "#5d2136" : "#6b2438";
  ctx.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);

  // soft vignette so the cover feels rounded, not flat
  const glow = ctx.createRadialGradient(
    TEXTURE_WIDTH / 2,
    TEXTURE_HEIGHT * 0.42,
    120,
    TEXTURE_WIDTH / 2,
    TEXTURE_HEIGHT * 0.5,
    TEXTURE_HEIGHT * 0.75
  );
  glow.addColorStop(0, "rgba(255, 226, 200, 0.14)");
  glow.addColorStop(1, "rgba(30, 8, 16, 0.28)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);

  // hand-stitched border: little dashes, slightly wobbly
  ctx.strokeStyle = "rgba(247, 223, 184, 0.75)";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.setLineDash([26, 20]);
  ctx.save();
  ctx.translate(TEXTURE_WIDTH / 2, TEXTURE_HEIGHT / 2);
  ctx.rotate(0.004);
  ctx.strokeRect(
    -TEXTURE_WIDTH / 2 + 58,
    -TEXTURE_HEIGHT / 2 + 58,
    TEXTURE_WIDTH - 116,
    TEXTURE_HEIGHT - 116
  );
  ctx.restore();
  ctx.setLineDash([]);

  ctx.textAlign = "center";
  if (back) {
    drawHeart(ctx, TEXTURE_WIDTH / 2, 430, 60, "#f7dfb8");
    ctx.fillStyle = "#fff6e6";
    ctx.font = scriptFont(96, 600);
    ctx.fillText("the end", TEXTURE_WIDTH / 2, 620);
    ctx.font = scriptFont(46);
    ctx.fillStyle = "rgba(255, 246, 230, 0.78)";
    ctx.fillText("amypretzel.com", TEXTURE_WIDTH / 2, 720);
  } else {
    ctx.fillStyle = "#fff6e6";
    ctx.save();
    ctx.translate(TEXTURE_WIDTH / 2, 340);
    ctx.rotate(-0.03);
    ctx.font = scriptFont(110, 600);
    ctx.fillText("amy's little book", 0, 0);
    ctx.restore();

    ctx.font = scriptFont(48);
    ctx.fillStyle = "rgba(255, 246, 230, 0.8)";
    ctx.fillText("a short story about making things", TEXTURE_WIDTH / 2, 440);

    drawPretzel(ctx, TEXTURE_WIDTH / 2, 740, 320);

    drawHeart(ctx, 190, 560, 26, "rgba(247, 223, 184, 0.85)");
    drawHeart(ctx, 716, 590, 20, "rgba(247, 223, 184, 0.7)");
    drawHeart(ctx, 244, 936, 18, "rgba(247, 223, 184, 0.65)");
    drawHeart(ctx, 680, 960, 26, "rgba(247, 223, 184, 0.85)");

    ctx.font = scriptFont(44);
    ctx.fillStyle = "rgba(255, 246, 230, 0.7)";
    ctx.fillText("(flip me open)", TEXTURE_WIDTH / 2, 1050);
  }
  ctx.textAlign = "left";
}

function drawStoryPage(ctx: CanvasRenderingContext2D, page: StoryPage) {
  drawPaper(ctx);

  // just the prose, written on the ruled lines like a real diary entry —
  // no borders, kickers, titles, or page furniture
  const marginLeft = 150;
  // right inset: the page curls toward the spine and eats the outer texture
  const maxWidth = TEXTURE_WIDTH - marginLeft - 160;
  const ruleHeight = 58; // matches drawPaper's rules (y = 150 + n * 58)

  ctx.fillStyle = "#3f3a33";
  ctx.font = scriptFont(52);

  const words = page.text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  words.forEach((word) => {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
      return;
    }
    line = test;
  });
  if (line) lines.push(line);

  // vertically settle the entry in the upper-middle of the page, snapped
  // to the rule grid so every baseline sits on a printed line
  const blockHeight = lines.length * ruleHeight;
  const idealTop = Math.max(266, (TEXTURE_HEIGHT - blockHeight) / 2 - 60);
  let ruleY = 150 + Math.round((idealTop - 150) / ruleHeight) * ruleHeight;

  lines.forEach((item, index) => {
    const seed = page.pageNumber * 31 + index;
    const dx = (seededJitter(seed) - 0.5) * 16;
    const tilt = (seededJitter(seed + 57) - 0.5) * 0.014;
    ctx.save();
    ctx.translate(marginLeft + dx, ruleY - 12);
    ctx.rotate(tilt);
    ctx.globalAlpha = 0.84 + seededJitter(seed + 91) * 0.16;
    ctx.fillText(item, 0, 0);
    ctx.restore();
    ruleY += ruleHeight;
  });
  ctx.globalAlpha = 1;
}

function createPageCanvasTexture(content: TexturePage) {
  const canvas = document.createElement("canvas");
  canvas.width = TEXTURE_WIDTH;
  canvas.height = TEXTURE_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not create page texture context");
  }

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

  // the covers show the pixel pretzel; redraw once its PNG arrives
  if (
    (content.kind === "cover" || content.kind === "back-cover") &&
    pretzelImage &&
    !pretzelImage.complete
  ) {
    pretzelImage.addEventListener(
      "load",
      () => refreshPageTexture(texture, content),
      { once: true }
    );
  }

  texture.needsUpdate = true;
  return texture;
}

function refreshPageTexture(texture: CanvasTexture, content: TexturePage) {
  const canvas = texture.image as HTMLCanvasElement;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  if (content.kind === "cover") {
    drawCover(ctx);
  } else if (content.kind === "back-cover") {
    drawCover(ctx, true);
  } else if (content.kind === "story") {
    drawStoryPage(ctx, content.page);
  } else {
    drawPaper(ctx);
  }
  texture.needsUpdate = true;
}

function usePageTexture(content: TexturePage) {
  const texture = useMemo(() => createPageCanvasTexture(content), [content]);

  useEffect(() => {
    let cancelled = false;
    if ("fonts" in document) {
      const script = cssFontFamily("--font-script", "'Caveat', 'Comic Sans MS', cursive");
      const fontLoads = [
        document.fonts.ready,
        document.fonts.load(`400 52px ${script}`),
        document.fonts.load(`600 52px ${script}`),
        document.fonts.load(`600 110px ${script}`),
      ];

      void Promise.allSettled(fontLoads).then(() => {
        if (cancelled) return;
        refreshPageTexture(texture, content);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [content, texture]);

  useEffect(() => {
    return () => {
      texture.dispose();
    };
  }, [texture]);

  return texture;
}

function createPageMaterials(frontTexture: Texture, backTexture: Texture) {
  const white = new Color("#fffdf7");
  const pageEdge = new Color("#d9cfbd");
  const hoverEmissive = new Color("#c98a5a");

  return [
    new MeshStandardMaterial({ color: white, roughness: 0.82 }),
    new MeshStandardMaterial({ color: pageEdge, roughness: 0.88 }),
    new MeshStandardMaterial({ color: white, roughness: 0.82 }),
    new MeshStandardMaterial({ color: pageEdge, roughness: 0.88 }),
    new MeshStandardMaterial({
      color: "#ffffff",
      map: frontTexture,
      roughness: 0.92,
      emissive: hoverEmissive,
      emissiveIntensity: 0,
    }),
    new MeshStandardMaterial({
      color: "#ffffff",
      map: backTexture,
      roughness: 0.92,
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
  page,
  opened,
  bookClosed,
  onTurnTo,
  onDraggingChange,
}: {
  sheet: BookSheet;
  number: number;
  page: number;
  opened: boolean;
  bookClosed: boolean;
  onTurnTo: (page: number) => void;
  onDraggingChange: (dragging: boolean) => void;
}) {
  const frontTexture = usePageTexture(sheet.front);
  const backTexture = usePageTexture(sheet.back);
  const groupRef = useRef<Group>(null);
  const skinnedMeshRef = useRef<SkinnedMesh>(null);
  const turnedAt = useRef(0);
  const lastOpened = useRef(opened);
  const drag = useRef<PageDrag | null>(null);
  const [highlighted, setHighlighted] = useState(false);
  useCursor(highlighted);

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
    const materials = createPageMaterials(frontTexture, backTexture);
    const mesh = new SkinnedMesh(pageGeometry, materials);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    mesh.add(skeleton.bones[0]);
    mesh.bind(skeleton);
    return mesh;
  }, [frontTexture, backTexture]);

  useFrame((_, delta) => {
    const mesh = skinnedMeshRef.current;
    const group = groupRef.current;
    if (!mesh || !group) return;

    const materials = mesh.material as MeshStandardMaterial[];
    const targetEmissive = highlighted && !drag.current ? 0.16 : 0;
    materials[4].emissiveIntensity = materials[5].emissiveIntensity =
      MathUtils.lerp(materials[4].emissiveIntensity, targetEmissive, 0.1);

    if (lastOpened.current !== opened) {
      turnedAt.current = Date.now();
      lastOpened.current = opened;
    }

    let turningTime = Math.min(420, Date.now() - turnedAt.current) / 420;
    turningTime = Math.sin(turningTime * Math.PI);

    let targetRotation = opened ? -Math.PI / 2 : Math.PI / 2;
    let turning = turningTime;

    if (drag.current) {
      // page follows the pointer between its resting pose and the flipped pose
      const from = opened ? -Math.PI / 2 : Math.PI / 2;
      const progress = drag.current.progress;
      targetRotation = from - Math.sign(from) * Math.PI * progress;
      turning = Math.sin(progress * Math.PI);
    }
    if (!bookClosed) {
      targetRotation += MathUtils.degToRad(number * 1.15);
    }

    const bones = mesh.skeleton.bones;
    for (let i = 0; i < bones.length; i++) {
      const target = i === 0 ? group : bones[i];

      const insideCurveIntensity = i < 8 ? Math.sin(i * 0.2 + 0.25) : 0;
      const outsideCurveIntensity = i >= 8 ? Math.cos(i * 0.3 + 0.09) : 0;
      const turningIntensity =
        Math.sin(i * Math.PI * (1 / bones.length)) * turning;
      let rotationAngle =
        insideCurveStrength * insideCurveIntensity * targetRotation -
        outsideCurveStrength * outsideCurveIntensity * targetRotation +
        turningCurveStrength * turningIntensity * targetRotation;
      let foldRotationAngle = MathUtils.degToRad(Math.sign(targetRotation) * 2);
      if (bookClosed) {
        if (i === 0) {
          rotationAngle = targetRotation;
          foldRotationAngle = 0;
        } else {
          rotationAngle = 0;
          foldRotationAngle = 0;
        }
      }
      easing.dampAngle(
        target.rotation,
        "y",
        rotationAngle,
        drag.current ? 0.14 : easingFactor,
        delta
      );

      const foldIntensity =
        i > 8
          ? Math.sin(i * Math.PI * (1 / bones.length) - 0.5) * turning
          : 0;
      easing.dampAngle(
        target.rotation,
        "x",
        foldRotationAngle * foldIntensity,
        easingFactorFold,
        delta
      );
    }
  });

  const beginDrag = useCallback(
    (clientX: number) => {
      drag.current = { startX: clientX, progress: 0, moved: false };
      onDraggingChange(true);

      const handleMove = (event: PointerEvent) => {
        const state = drag.current;
        if (!state) return;
        const dx = event.clientX - state.startX;
        // turning a right-hand page forward means dragging left; a turned
        // (left-hand) page flips back by dragging right
        const direction = opened ? 1 : -1;
        state.progress = MathUtils.clamp((dx * direction) / 240, 0, 1);
        if (Math.abs(dx) > 6) state.moved = true;
      };

      const handleUp = () => {
        window.removeEventListener("pointermove", handleMove);
        window.removeEventListener("pointerup", handleUp);
        const state = drag.current;
        drag.current = null;
        onDraggingChange(false);
        if (!state) return;
        if (!state.moved || state.progress > 0.35) {
          onTurnTo(opened ? number : number + 1);
        }
        // otherwise the frame loop eases the page back to its resting pose
      };

      window.addEventListener("pointermove", handleMove);
      window.addEventListener("pointerup", handleUp);
    },
    [number, onDraggingChange, onTurnTo, opened]
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
        position-z={-number * PAGE_DEPTH + page * PAGE_DEPTH}
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
  const { size } = useThree();
  const mobile = size.width < 620;
  const [delayedPage, setDelayedPage] = useState(page);

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
  const scale = mobile ? 0.86 : 1.08;

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;
    // the model anchors at the spine, so a closed book hangs to one side;
    // slide it over so the lone cover reads centered
    const shift = (PAGE_WIDTH / 2) * scale;
    const targetX =
      delayedPage === 0 ? -shift : delayedPage === sheets.length ? shift : 0;
    easing.damp(group.position, "x", targetX, 0.5, delta);
  });

  return (
    <group
      ref={groupRef}
      rotation-x={-Math.PI / 5.5}
      rotation-y={-Math.PI / 2}
      position-y={mobile ? 0.96 : 0.22}
      scale={scale}
    >
      {sheets.map((sheet, index) => (
        <AnimatedPage
          key={index}
          sheet={sheet}
          number={index}
          page={delayedPage}
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
  const mobile = size.width < 620;

  return (
    <PerspectiveCamera
      makeDefault
      position={[0, mobile ? 0.24 : 0.12, mobile ? 8.5 : 4.55]}
      fov={mobile ? 36 : 34}
    />
  );
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
      <ambientLight intensity={0.75} />
      <directionalLight
        position={[2, 5, 2]}
        intensity={1.15}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
      />
      <directionalLight position={[-3, 2, -4]} intensity={0.3} />
      <BookStack
        sheets={sheets}
        page={page}
        onPageChange={onPageChange}
        onDraggingChange={handleDraggingChange}
      />
      <ContactShadows
        position={[0, -1.25, 0]}
        scale={7}
        blur={2.6}
        far={2.4}
        opacity={0.38}
        frames={Infinity}
      />
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableZoom
        minDistance={2.4}
        maxDistance={9}
        minPolarAngle={0.35}
        maxPolarAngle={Math.PI - 0.55}
        rotateSpeed={0.7}
        enableDamping
        dampingFactor={0.08}
        target={[0, 0.05, 0]}
      />
    </>
  );
}

function BookCanvas({
  sheets,
  page,
  onPageChange,
}: {
  sheets: BookSheet[];
  page: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="book-three-frame">
      <Canvas
        className="book-three-canvas"
        shadows
        camera={{ position: [0, 0.12, 4.55], fov: 34 }}
        dpr={[1, 2]}
        gl={{ preserveDrawingBuffer: true, alpha: true, antialias: true }}
      >
        <BookScene sheets={sheets} page={page} onPageChange={onPageChange} />
      </Canvas>
    </div>
  );
}

function makeBookModel(chapters: BookChapter[]) {
  let pageNumber = 0;
  const pages: StoryPage[] = chapters.flatMap((chapter) =>
    chapter.pages.map((page) => {
      pageNumber += 1;
      return { text: page.text, pageNumber };
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

export default function StoryBook({ onExit }: { onExit?: () => void }) {
  const { sheets } = useMemo(() => makeBookModel(bookChapters), []);
  // page = sheets flipped: 0 is the closed front cover, sheets.length is
  // the closed back cover
  const [page, setPageState] = useState(0);
  const lastPage = sheets.length;
  const atBackCover = page === lastPage;

  function setPage(nextPage: number) {
    if (atBackCover) {
      // any click on the closed back cover leaves for the site
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
      <div className="storybook-canvas">
        <BookCanvas sheets={sheets} page={page} onPageChange={setPage} />
      </div>
    </div>
  );
}
