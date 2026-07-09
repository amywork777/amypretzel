"use client";

import { OrbitControls, PerspectiveCamera, useCursor } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { easing } from "maath";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BoxGeometry,
  CanvasTexture,
  Color,
  MeshBasicMaterial,
  MathUtils,
  MeshStandardMaterial,
  SRGBColorSpace,
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

const pageGeometry = new BoxGeometry(
  PAGE_WIDTH,
  PAGE_HEIGHT,
  PAGE_DEPTH,
  PAGE_SEGMENTS,
  2
);

pageGeometry.translate(PAGE_WIDTH / 2, 0, 0);

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

  ctx.strokeStyle = "rgba(74, 58, 38, 0.24)";
  ctx.lineWidth = 4;
  ctx.strokeRect(26, 26, TEXTURE_WIDTH - 52, TEXTURE_HEIGHT - 52);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.58)";
  ctx.lineWidth = 8;
  ctx.strokeRect(38, 38, TEXTURE_WIDTH - 76, TEXTURE_HEIGHT - 76);
}

const chapterAccents: Record<string, string> = {
  roots: "#8b6f47",
  stanford: "#7a1f2b",
  apple: "#364f63",
  building: "#6b2438",
  now: "#6d7c65",
};

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

  const accent = chapterAccents[page.chapter.id] ?? "#4a4640";
  const margin = 92;

  ctx.fillStyle = "#8a8278";
  ctx.font = "20px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillText(page.chapter.kicker.toUpperCase(), margin, 82);
  ctx.textAlign = "right";
  ctx.fillText(String(page.pageNumber).padStart(2, "0"), TEXTURE_WIDTH - margin, 82);
  ctx.textAlign = "left";

  ctx.fillStyle = accent;
  ctx.font = handFont(84, 700);
  const titleEnd = drawWrappedText(
    ctx,
    page.title,
    margin,
    320,
    TEXTURE_WIDTH - margin * 2,
    96,
    4
  );

  ctx.fillStyle = "#4a4640";
  ctx.font = handFont(44, 400);
  drawWrappedText(
    ctx,
    page.text,
    margin + 12,
    titleEnd + 70,
    TEXTURE_WIDTH - margin * 2 - 24,
    62,
    9
  );

  ctx.strokeStyle = "rgba(126, 72, 97, 0.24)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(TEXTURE_WIDTH - 190, TEXTURE_HEIGHT - 116);
  ctx.bezierCurveTo(
    TEXTURE_WIDTH - 140,
    TEXTURE_HEIGHT - 138,
    TEXTURE_WIDTH - 96,
    TEXTURE_HEIGHT - 94,
    TEXTURE_WIDTH - 70,
    TEXTURE_HEIGHT - 126
  );
  ctx.stroke();
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
      const fontLoads = [
        document.fonts.ready,
        document.fonts.load(`300 38px ${family}`),
        document.fonts.load(`400 38px ${family}`),
        document.fonts.load(`700 72px ${family}`),
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

  return texture;
}

function createPageMaterials(frontTexture: Texture, backTexture: Texture) {
  const white = new Color("#fffdf7");
  const pageEdge = new Color("#d9cfbd");

  return [
    new MeshStandardMaterial({ color: white, roughness: 0.82 }),
    new MeshStandardMaterial({ color: pageEdge, roughness: 0.88 }),
    new MeshStandardMaterial({ color: white, roughness: 0.82 }),
    new MeshStandardMaterial({ color: pageEdge, roughness: 0.88 }),
    new MeshBasicMaterial({
      color: "#ffffff",
      map: frontTexture,
      toneMapped: false,
    }),
    new MeshBasicMaterial({
      color: "#ffffff",
      map: backTexture,
      toneMapped: false,
    }),
  ];
}

function AnimatedPage({
  sheet,
  number,
  page,
  opened,
  bookClosed,
  onTurnTo,
}: {
  sheet: BookSheet;
  number: number;
  page: number;
  opened: boolean;
  bookClosed: boolean;
  onTurnTo: (page: number) => void;
}) {
  const frontTexture = usePageTexture(sheet.front);
  const backTexture = usePageTexture(sheet.back);
  const materials = useMemo(
    () => createPageMaterials(frontTexture, backTexture),
    [frontTexture, backTexture]
  );
  const groupRef = useRef<Group>(null);
  const turnedAt = useRef(0);
  const lastOpened = useRef(opened);
  const [highlighted, setHighlighted] = useState(false);
  useCursor(highlighted);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    if (lastOpened.current !== opened) {
      turnedAt.current = Date.now();
      lastOpened.current = opened;
    }

    let turningTime = Math.min(480, Date.now() - turnedAt.current) / 480;
    turningTime = Math.sin(turningTime * Math.PI);

    let targetRotation = opened ? -Math.PI / 2 : Math.PI / 2;
    if (!bookClosed) {
      targetRotation += MathUtils.degToRad(number * 0.72);
    }

    const foldRotation = MathUtils.degToRad(Math.sign(targetRotation) * 3.2) * turningTime;
    easing.dampAngle(group.rotation, "y", targetRotation, 0.44, delta);
    easing.dampAngle(group.rotation, "x", foldRotation, 0.32, delta);
  });

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
      onClick={(event) => {
        event.stopPropagation();
        onTurnTo(opened ? number : number + 1);
      }}
    >
      <mesh
        geometry={pageGeometry}
        material={materials}
        position-z={-number * PAGE_DEPTH + page * PAGE_DEPTH}
        castShadow
        receiveShadow
        frustumCulled={false}
      />
    </group>
  );
}

function BookStack({
  sheets,
  page,
  onPageChange,
}: {
  sheets: BookSheet[];
  page: number;
  onPageChange: (page: number) => void;
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
            const clamped = Math.min(Math.max(nextPage, 1), sheets.length - 1);
            onPageChange(clamped);
          }}
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
  return (
    <>
      <CanvasSizer />
      <ResponsiveCamera />
      <ambientLight intensity={0.82} />
      <directionalLight
        position={[2, 5, 2]}
        intensity={1.65}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
      />
      <BookStack sheets={sheets} page={page} onPageChange={onPageChange} />
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minAzimuthAngle={-0.72}
        maxAzimuthAngle={0.72}
        minPolarAngle={Math.PI / 3.3}
        maxPolarAngle={Math.PI / 2.04}
        rotateSpeed={0.55}
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
