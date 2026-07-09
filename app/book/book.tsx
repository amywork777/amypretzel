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
  chapter: BookChapter;
  title: string;
  text: string;
  pageNumber: number;
};

type BookSpread = {
  chapter: BookChapter;
  left?: StoryPage;
  right?: StoryPage;
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
const PAGE_DEPTH = 0.004;
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

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number
) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  words.forEach((word) => {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
      return;
    }
    line = testLine;
  });

  if (line) lines.push(line);

  lines.slice(0, maxLines).forEach((item, index) => {
    const suffix = index === maxLines - 1 && lines.length > maxLines ? "..." : "";
    ctx.fillText(`${item}${suffix}`, x, y + index * lineHeight);
  });

  return y + Math.min(lines.length, maxLines) * lineHeight;
}

function cssFontFamily(varName: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
  return value || fallback;
}

function handFont(size: number, weight: 300 | 400 | 700 = 400) {
  return `${weight} ${size}px ${cssFontFamily(
    "--font-hand",
    "'Gaegu', 'Comic Sans MS', cursive"
  )}`;
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

function drawCover(ctx: CanvasRenderingContext2D, back = false) {
  ctx.fillStyle = back ? "#35131e" : "#6b2438";
  ctx.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);

  ctx.fillStyle = "rgba(255, 250, 241, 0.08)";
  for (let y = 0; y < TEXTURE_HEIGHT; y += 12) {
    ctx.fillRect(0, y, TEXTURE_WIDTH, 1);
  }

  ctx.strokeStyle = "rgba(255, 250, 241, 0.28)";
  ctx.lineWidth = 3;
  ctx.strokeRect(70, 70, TEXTURE_WIDTH - 140, TEXTURE_HEIGHT - 140);

  ctx.fillStyle = "#fffaf1";
  ctx.font = handFont(76, 700);
  drawWrappedText(
    ctx,
    back ? "back to the website" : "Amy's making diary",
    104,
    430,
    TEXTURE_WIDTH - 208,
    86,
    4
  );

  ctx.font = "22px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillStyle = "rgba(255, 250, 241, 0.72)";
  ctx.fillText(
    back ? "AMYPRETZEL.COM" : "ROOTS / STANFORD / APPLE / BUILDING / NOW",
    104,
    780
  );
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
      const family = cssFontFamily("--font-hand", "'Gaegu', 'Comic Sans MS', cursive");
      const script = cssFontFamily("--font-script", "'Caveat', 'Comic Sans MS', cursive");
      const fontLoads = [
        document.fonts.ready,
        document.fonts.load(`400 38px ${family}`),
        document.fonts.load(`700 72px ${family}`),
        document.fonts.load(`400 52px ${script}`),
        document.fonts.load(`600 52px ${script}`),
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
      targetRotation += MathUtils.degToRad(number * 0.8);
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

  return (
    <group
      rotation-x={-Math.PI / 5.5}
      rotation-y={-Math.PI / 2}
      position-y={mobile ? 0.96 : 0.22}
      scale={mobile ? 0.86 : 1.08}
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
            // sheets.length (one past the last spread) means the reader
            // flipped the final page — StoryBook treats that as an exit
            const clamped = Math.min(Math.max(nextPage, 1), sheets.length);
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
      return { chapter, title: page.title, text: page.text, pageNumber };
    })
  );

  const spreads: BookSpread[] = [];
  chapters.forEach((chapter) => {
    const chapterPages = pages.filter((page) => page.chapter.id === chapter.id);
    for (let index = 0; index < chapterPages.length; index += 2) {
      spreads.push({
        chapter,
        left: chapterPages[index],
        right: chapterPages[index + 1],
      });
    }
  });

  const sheets: BookSheet[] = [
    {
      front: { kind: "cover" },
      back: spreads[0]?.left ? { kind: "story", page: spreads[0].left } : { kind: "blank" },
    },
  ];

  spreads.forEach((spread, index) => {
    const nextLeftPage = spreads[index + 1]?.left;
    sheets[index + 1] = {
      front: spread.right ? { kind: "story", page: spread.right } : { kind: "blank" },
      back:
        index === spreads.length - 1
          ? { kind: "back-cover" }
          : nextLeftPage
            ? { kind: "story", page: nextLeftPage }
            : { kind: "blank" },
    };
  });

  return { spreads, sheets, pages };
}

export default function StoryBook({ onExit }: { onExit?: () => void }) {
  const { spreads, sheets, pages } = useMemo(() => makeBookModel(bookChapters), []);
  const [spread, setSpread] = useState(0);
  const maxSpread = Math.max(0, spreads.length - 1);
  const currentSpread = spreads[Math.min(spread, maxSpread)];
  const activeChapter = currentSpread?.chapter ?? bookChapters[0];
  const left = currentSpread?.left;
  const right = currentSpread?.right;
  const atEnd = spread === maxSpread;

  function setPage(nextPage: number) {
    if (nextPage - 1 > maxSpread) {
      // turned past the back cover
      onExit?.();
      return;
    }
    setSpread(Math.min(Math.max(nextPage - 1, 0), maxSpread));
  }

  function goToSpread(nextSpread: number) {
    setSpread(Math.min(Math.max(nextSpread, 0), maxSpread));
  }

  function goToChapter(chapterId: string) {
    const firstSpread = spreads.findIndex((item) => item.chapter.id === chapterId);
    if (firstSpread >= 0) goToSpread(firstSpread);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowRight") {
        setSpread((current) => Math.min(current + 1, maxSpread));
      } else if (event.key === "ArrowLeft") {
        setSpread((current) => Math.max(current - 1, 0));
      } else if (event.key === "Escape") {
        onExit?.();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [maxSpread, onExit]);

  return (
    <div className="storybook">
      <div className="storybook-canvas">
        <BookCanvas sheets={sheets} page={spread + 1} onPageChange={setPage} />
      </div>

      <div className="book-controls">
        <button
          type="button"
          onClick={() => goToSpread(spread - 1)}
          disabled={spread === 0}
          className="book-control-button"
        >
          Previous
        </button>
        <p className="meta">
          Pages {left?.pageNumber ?? 1}
          {right ? `-${right.pageNumber}` : ""} of {pages.length}
        </p>
        <button
          type="button"
          onClick={() => (atEnd ? onExit?.() : goToSpread(spread + 1))}
          className="book-control-button"
        >
          {atEnd ? "Enter site" : "Next"}
        </button>
      </div>

      <div className="book-edge-tabs" aria-hidden="true">
        {bookChapters.map((chapter) => (
          <button
            key={chapter.id}
            type="button"
            onClick={() => goToChapter(chapter.id)}
            className={chapter.id === activeChapter.id ? "book-edge-tab-active" : ""}
            tabIndex={-1}
          >
            {chapter.kicker.replace("Chapter ", "")}
          </button>
        ))}
      </div>
    </div>
  );
}
