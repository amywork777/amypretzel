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
const PAGE_DEPTH = 0.022; // slight chunk per sheet; thickness comes from the fan
const PAGE_SEGMENTS = 30;

const SEGMENT_WIDTH = PAGE_WIDTH / PAGE_SEGMENTS;
const reducedMotion = typeof window === "undefined" ? null : window.matchMedia("(prefers-reduced-motion: reduce)");

// page-turn animation feel (after Wawa Sensei's book-slider technique)
const easingFactor = 0.5;
const easingFactorFold = 0.3;
const insideCurveStrength = 0.11;
const outsideCurveStrength = 0.035;
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

function seededJitter(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function printFont(size: number, family = "--font-body") {
  return `400 ${size}px ${cssFontFamily(family, "Georgia, serif")}`;
}

function drawPaper(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#f5f1e7";
  ctx.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);
  for (let i = 0; i < 24000; i++) {
    ctx.fillStyle = `rgba(85,70,45,${seededJitter(i + 2) * .035})`;
    ctx.fillRect(seededJitter(i) * TEXTURE_WIDTH, seededJitter(i + 1) * TEXTURE_HEIGHT, 1, 1);
  }
  const gutter = ctx.createLinearGradient(0, 0, TEXTURE_WIDTH, 0);
  gutter.addColorStop(0, "rgba(58,45,25,.16)");
  gutter.addColorStop(.08, "rgba(58,45,25,.02)");
  gutter.addColorStop(.85, "rgba(58,45,25,0)");
  gutter.addColorStop(1, "rgba(58,45,25,.06)");
  ctx.fillStyle = gutter;
  ctx.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);
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
  const hinge = ctx.createLinearGradient(0, 0, 95, 0);
  hinge.addColorStop(0, "rgba(0,0,0,.3)");
  hinge.addColorStop(.45, "rgba(0,0,0,.05)");
  hinge.addColorStop(.6, "rgba(0,0,0,.24)");
  hinge.addColorStop(.7, "rgba(255,240,210,.08)");
  hinge.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = hinge;
  ctx.fillRect(0, 0, 95, TEXTURE_HEIGHT);
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
      const display = cssFontFamily("--font-display", "Georgia, serif");
      const body = cssFontFamily("--font-body", "sans-serif");
      const fontLoads = [
        document.fonts.ready,
        document.fonts.load(`400 120px ${display}`),
        document.fonts.load(`400 32px ${body}`),
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

function createPageMaterials(frontTexture: Texture, backTexture: Texture, frontCover: boolean, backCover: boolean) {
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
      bumpMap: frontCover ? frontTexture : null,
      bumpScale: frontCover ? 0.012 : 0,
      roughness: 0.94,
      emissive: hoverEmissive,
      emissiveIntensity: 0,
    }),
    new MeshStandardMaterial({
      color: "#ffffff",
      map: backTexture,
      bumpMap: backCover ? backTexture : null,
      bumpScale: backCover ? 0.012 : 0,
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
    const materials = createPageMaterials(frontTexture, backTexture, sheet.front.kind === "cover", sheet.back.kind === "back-cover");
    const mesh = new SkinnedMesh(pageGeometry, materials);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    mesh.add(skeleton.bones[0]);
    mesh.bind(skeleton);
    return mesh;
  }, [frontTexture, backTexture, sheet]);

  useEffect(() => () => {
    (manualSkinnedMesh.material as MeshStandardMaterial[]).forEach(material => material.dispose());
    manualSkinnedMesh.skeleton.dispose();
  }, [manualSkinnedMesh]);

  useFrame((_, delta) => {
    const mesh = skinnedMeshRef.current;
    const group = groupRef.current;
    if (!mesh || !group) return;

    const materials = mesh.material as MeshStandardMaterial[];
    const targetEmissive = highlighted && !drag.current ? 0.035 : 0;
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
      if (bookClosed || sheet.front.kind === "cover" || sheet.back.kind === "back-cover") {
        if (i === 0) {
          rotationAngle = targetRotation;
          foldRotationAngle = 0;
        } else {
          rotationAngle = 0;
          foldRotationAngle = 0;
        }
      }
      if (reducedMotion?.matches) {
        target.rotation.y = rotationAngle;
        target.rotation.x = 0;
        continue;
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
  const scale = mobile ? 0.92 : 1.08;

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;
    // the model anchors at the spine, so a closed book hangs to one side;
    // slide it over so the lone cover reads centered
    const shift = (PAGE_WIDTH / 2) * scale;
    const targetX =
      delayedPage === 0 ? -shift : delayedPage === sheets.length ? shift : 0;
    if (reducedMotion?.matches) group.position.x = targetX;
    else easing.damp(group.position, "x", targetX, 0.5, delta);
  });

  return (
    <group
      ref={groupRef}
      rotation-x={-Math.PI / 9}
      rotation-z={-0.055}
      rotation-y={-Math.PI / 2 - 0.2}
      position-y={0.05}
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
      position={[0, 0.12, mobile ? Math.max(5.5, 4.9 / (size.width / size.height)) : 4.55]}
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
      <ambientLight intensity={1.6} />
      <directionalLight
        position={[2, 5, 2]}
        intensity={2.3}
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
        opacity={0.24}
        frames={Infinity}
      />
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableZoom={false}
        minDistance={2.4}
        maxDistance={9}
        minPolarAngle={1.05}
        maxPolarAngle={1.9}
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
        gl={{ alpha: true, antialias: true }}
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

export default function StoryBook({ onExit }: { onExit?: () => void }) {
  const { sheets } = useMemo(() => makeBookModel(bookChapters), []);
  // page = sheets flipped: 0 is the closed front cover, sheets.length is
  // the closed back cover
  const [page, setPageState] = useState(0);
  const lastPage = sheets.length;
  const atBackCover = page === lastPage;

  function setPage(nextPage: number) {
    if (atBackCover && nextPage > lastPage) {
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
      <div className="storybook-canvas" aria-hidden="true">
        <BookCanvas sheets={sheets} page={page} onPageChange={setPage} />
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
