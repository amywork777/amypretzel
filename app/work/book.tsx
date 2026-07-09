"use client";

import { OrbitControls, PerspectiveCamera, useCursor } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { easing } from "maath";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
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
import type { WorkChapter, WorkProject } from "./projects";

type DiarySection = {
  id: string;
  title: string;
  kicker: string;
  summary: string;
};

type DiaryPage = {
  section: DiarySection;
  title: string;
  sentence: string;
  pageNumber: number;
  image?: string;
  href?: string;
  links?: { label: string; href: string }[];
};

type BookSpread = {
  section: DiarySection;
  left?: DiaryPage;
  right?: DiaryPage;
};

type TexturePage =
  | { kind: "cover" }
  | { kind: "back-cover" }
  | { kind: "blank" }
  | { kind: "diary"; page: DiaryPage };

type BookSheet = {
  front: TexturePage;
  back: TexturePage;
};

type BookMode = "story" | "sections";

const TEXTURE_WIDTH = 900;
const TEXTURE_HEIGHT = 1200;
const PAGE_WIDTH = 1.34;
const PAGE_HEIGHT = 1.9;
const PAGE_DEPTH = 0.004;
const PAGE_SEGMENTS = 30;

const diarySections: DiarySection[] = [
  {
    id: "digital",
    title: "Digital",
    kicker: "Chapter 01",
    summary: "Software, AI systems, CAD tools, datasets, and digital workflows for making things.",
  },
  {
    id: "physical",
    title: "Physical",
    kicker: "Chapter 02",
    summary: "Hardware, jewelry, softgoods, instruments, mechanisms, and manufactured objects.",
  },
  {
    id: "hobbies",
    title: "Hobbies",
    kicker: "Chapter 03",
    summary: "Community maps, terminal cuteness, crochet, food objects, and personal motifs.",
  },
  {
    id: "articles",
    title: "Articles",
    kicker: "Chapter 04",
    summary: "Longer notes and engineering writeups live on X, separate from the project catalog.",
  },
];

const storySections: DiarySection[] = [
  {
    id: "roots",
    title: "Roots",
    kicker: "Chapter 01",
    summary: "Arts, crafts, curiosity, and the first instinct to make things by hand.",
  },
  {
    id: "objects",
    title: "Objects",
    kicker: "Chapter 02",
    summary: "Physical things, materials, mechanisms, manufacturing, and product design.",
  },
  {
    id: "cad",
    title: "CAD + Manufacturing",
    kicker: "Chapter 03",
    summary: "Geometry, AI CAD, manufacturing specs, datasets, and tools for making production easier.",
  },
  {
    id: "tools",
    title: "Tools",
    kicker: "Chapter 04",
    summary: "Software interfaces and product features that help people move faster.",
  },
  {
    id: "play",
    title: "Play",
    kicker: "Chapter 05",
    summary: "Tiny utilities, public experiments, maps, terminals, notes, and craft side quests.",
  },
];

const pageGeometry = new BoxGeometry(
  PAGE_WIDTH,
  PAGE_HEIGHT,
  PAGE_DEPTH,
  PAGE_SEGMENTS,
  2
);

pageGeometry.translate(PAGE_WIDTH / 2, 0, 0);

const pageImageCache = new Map<string, HTMLImageElement>();

function isExternal(href: string) {
  return href.startsWith("http");
}

function getPrimaryHref(page?: DiaryPage) {
  return page?.href ?? page?.links?.[0]?.href ?? "/work";
}

function ProjectAction({
  href,
  children,
  primary = false,
}: {
  href: string;
  children: ReactNode;
  primary?: boolean;
}) {
  const className = primary
    ? "book-action book-action-primary"
    : "book-action";

  if (isExternal(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

function firstSentence(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();
  const match = normalized.match(/^(.+?[.!?])(?:\s|$)/);
  return match?.[1] ?? normalized;
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

function drawContainedImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const frameRatio = width / height;
  const drawWidth = imageRatio > frameRatio ? width : height * imageRatio;
  const drawHeight = imageRatio > frameRatio ? width / imageRatio : height;
  const drawX = x + (width - drawWidth) / 2;
  const drawY = y + (height - drawHeight) / 2;
  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
}

function getPageImage(src: string) {
  const cached = pageImageCache.get(src);
  if (cached) return cached;

  const image = new window.Image();
  image.decoding = "async";
  image.src = src;
  pageImageCache.set(src, image);
  return image;
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

function paletteForSection(sectionId: string) {
  if (sectionId === "physical") {
    return { accent: "#8b6f47", secondary: "#d8c7a1", wash: "#fff7ed" };
  }
  if (sectionId === "digital") {
    return { accent: "#6b2438", secondary: "#ba8da0", wash: "#fff6f8" };
  }
  if (sectionId === "hobbies") {
    return { accent: "#6d7c65", secondary: "#b8c7a6", wash: "#f7fbef" };
  }
  return { accent: "#364f63", secondary: "#9a7f63", wash: "#f2f5f6" };
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

function drawTape(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = "rgba(237, 216, 163, 0.54)";
  ctx.fillRect(-58, -18, 116, 36);
  ctx.strokeStyle = "rgba(128, 98, 60, 0.16)";
  ctx.strokeRect(-58, -18, 116, 36);
  ctx.restore();
}

function drawDoodles(
  ctx: CanvasRenderingContext2D,
  sectionId: string,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const palette = paletteForSection(sectionId);
  const root = sectionId === "roots";

  ctx.fillStyle = palette.wash;
  ctx.fillRect(x, y, width, height);

  ctx.strokeStyle = palette.accent;
  ctx.lineWidth = root ? 4 : 5;
  ctx.lineCap = "round";
  ctx.globalAlpha = 0.82;
  ctx.beginPath();
  if (root) {
    ctx.moveTo(x + width * 0.18, y + height * 0.66);
    ctx.bezierCurveTo(
      x + width * 0.22,
      y + height * 0.3,
      x + width * 0.44,
      y + height * 0.32,
      x + width * 0.5,
      y + height * 0.62
    );
    ctx.bezierCurveTo(
      x + width * 0.58,
      y + height * 0.22,
      x + width * 0.82,
      y + height * 0.32,
      x + width * 0.78,
      y + height * 0.66
    );
  } else {
    ctx.moveTo(x + width * 0.18, y + height * 0.58);
    ctx.bezierCurveTo(
      x + width * 0.34,
      y + height * 0.28,
      x + width * 0.48,
      y + height * 0.78,
      x + width * 0.75,
      y + height * 0.42
    );
  }
  ctx.stroke();

  ctx.strokeStyle = palette.secondary;
  ctx.lineWidth = 3;
  for (let index = 0; index < 4; index += 1) {
    const centerX = x + width * (0.24 + index * 0.16);
    const centerY = y + height * (0.28 + (index % 2) * 0.38);
    ctx.beginPath();
    ctx.rect(centerX - 18, centerY - 18, 36, 36);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
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
    back ? "OBJECTS / SOFTWARE / ARTICLES" : "ROOTS / OBJECTS / TOOLS / PLAY",
    104,
    780
  );
}

function drawDiaryPage(ctx: CanvasRenderingContext2D, page: DiaryPage, texture: CanvasTexture) {
  drawPaper(ctx);

  const palette = paletteForSection(page.section.id);
  const margin = 92;
  const imageX = 158;
  const imageY = 150;
  const imageWidth = TEXTURE_WIDTH - 252;
  const imageHeight = 470;

  ctx.fillStyle = "#8a8278";
  ctx.font = "20px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillText(page.section.kicker.toUpperCase(), margin, 82);
  ctx.textAlign = "right";
  ctx.fillText(String(page.pageNumber).padStart(2, "0"), TEXTURE_WIDTH - margin, 82);
  ctx.textAlign = "left";

  drawTape(ctx, imageX + 58, imageY + 14, -0.11);
  drawTape(ctx, imageX + imageWidth - 62, imageY + 8, 0.13);

  ctx.save();
  ctx.translate(imageX, imageY);
  ctx.rotate(-0.012);
  ctx.fillStyle = "#fffaf1";
  ctx.fillRect(0, 0, imageWidth, imageHeight);
  ctx.strokeStyle = "rgba(80, 65, 42, 0.18)";
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, imageWidth, imageHeight);

  drawDoodles(ctx, page.section.id, 28, 28, imageWidth - 56, imageHeight - 56);
  ctx.restore();

  if (page.image) {
    const image = getPageImage(page.image);
    const drawLoadedImage = () => {
      ctx.save();
      ctx.translate(imageX, imageY);
      ctx.rotate(-0.012);
      ctx.fillStyle = "#fffaf1";
      ctx.fillRect(28, 28, imageWidth - 56, imageHeight - 56);
      drawContainedImage(ctx, image, 28, 28, imageWidth - 56, imageHeight - 56);
      ctx.restore();
      texture.needsUpdate = true;
    };

    if (image.complete && image.naturalWidth > 0) {
      drawLoadedImage();
    } else {
      image.addEventListener("load", drawLoadedImage, { once: true });
    }
  }

  ctx.fillStyle = palette.accent;
  ctx.font = handFont(72, 700);
  const titleEnd = drawWrappedText(
    ctx,
    page.title,
    margin,
    735,
    TEXTURE_WIDTH - margin * 2,
    82,
    3
  );

  ctx.fillStyle = "#4a4640";
  ctx.font = handFont(38, 400);
  drawWrappedText(
    ctx,
    page.sentence,
    margin + 12,
    Math.min(titleEnd + 42, 1010),
    TEXTURE_WIDTH - margin * 2 - 24,
    48,
    3
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
  } else if (content.kind === "diary") {
    drawDiaryPage(ctx, content.page, texture);
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
  } else if (content.kind === "diary") {
    drawDiaryPage(ctx, content.page, texture);
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

function WorkBookCanvas({
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

function diaryTitle(project: WorkProject) {
  const titleMap: Record<string, string> = {
    Crocheting: "loops, knots, patience",
    Extract: "pulling treasure from images",
    "Smart Dropper": "borrowing a feeling",
    "Voice input and language": "talking to the canvas",
    "Taiyaki 3D": "sketches becoming geometry",
    "Taiyaki Jewelry": "tiny things made precious",
    "Tech Pack": "turning ideas into factory notes",
    Kerf: "the math under the object",
    "CAD-Steps": "teaching models the steps",
    Screenie: "little tools for explaining",
    "SF Rats": "maps for free city joy",
    "Cute Ghostty": "making terminals cute",
    "Taya pendant": "a journal you can wear",
  };

  return titleMap[project.title] ?? project.title;
}

function sectionForStoryProject(project: WorkProject) {
  if (project.type === "Article") return storySections[4];
  if (
    [
      "Taiyaki 3D",
      "Taiyaki Jewelry",
      "Tech Pack",
      "Kerf",
      "CAD-Steps",
    ].includes(project.title)
  ) {
    return storySections[2];
  }
  if (
    [
      "Extract",
      "Smart Dropper",
      "Voice input and language",
      "Screenie",
    ].includes(project.title)
  ) {
    return storySections[3];
  }
  if (
    [
      "SF Rats",
      "Cute Ghostty",
      "Crocheting",
      "Pretzels favorite food",
      "Lil spider maze",
      "Sushi accessory",
      "Dough roller",
    ].includes(project.title)
  ) {
    return storySections[4];
  }
  return storySections[1];
}

function makeDiaryPages(chapters: WorkChapter[], mode: BookMode) {
  const activeSections = mode === "story" ? storySections : diarySections;
  const sectionById = new Map(activeSections.map((section) => [section.id, section]));
  const rootsSection = storySections[0];
  const rootPages: DiaryPage[] =
    mode === "story"
      ? [
          {
            section: rootsSection,
            title: "hardware, software, and the in-between",
            sentence:
              "I make things across materials, interfaces, systems, and whatever sits between them.",
            pageNumber: 1,
            image: "/amy-portrait.jpg",
          },
          {
            section: rootsSection,
            title: "product design, mechanics, and music",
            sentence:
              "Stanford gave me a way to move between form, engineering, and feeling.",
            pageNumber: 2,
          },
          {
            section: rootsSection,
            title: "useful, durable, personal",
            sentence:
              "At Apple, I worked on hardware with materials, longevity, and everyday use in mind.",
            pageNumber: 3,
          },
          {
            section: rootsSection,
            title: "san francisco sketchbook",
            sentence:
              "Now I build AI tools, jewelry, maps, notes, and small useful things from San Francisco.",
            pageNumber: 4,
          },
        ]
      : [];
  const titleOrder = [
    "Taya pendant",
    "Crocheting",
    "Pretzels favorite food",
    "Lil spider maze",
    "Sushi accessory",
    "Dough roller",
    "iPhone FineWoven",
    "iPad accessories",
    "Injection-molded fabric",
    "Harp",
    "Membrane whistle",
    "Clarinet barrel",
    "Quarter press",
    "Grasper analysis",
    "Tampon case",
    "Raccoon poker chip",
    "Taiyaki 3D",
    "Taiyaki Jewelry",
    "Tech Pack",
    "Kerf",
    "CAD-Steps",
    "Extract",
    "Smart Dropper",
    "Voice input and language",
    "Screenie",
    "SF Rats",
    "Cute Ghostty",
    "Articles on X",
  ];
  const sectionOrder = new Map(activeSections.map((section, index) => [section.id, index]));
  const order = new Map(titleOrder.map((title, index) => [title, index]));
  const orderedProjects = chapters.flatMap((chapter) =>
    chapter.projects.map((project) => ({ chapter, project }))
  ).sort(
    (a, b) => {
      const sectionA =
        mode === "story"
          ? sectionForStoryProject(a.project)
          : sectionById.get(a.chapter.id) ?? activeSections[0];
      const sectionB =
        mode === "story"
          ? sectionForStoryProject(b.project)
          : sectionById.get(b.chapter.id) ?? activeSections[0];
      const sectionDelta =
        (sectionOrder.get(sectionA.id) ?? 999) - (sectionOrder.get(sectionB.id) ?? 999);
      if (sectionDelta !== 0) return sectionDelta;
      return (order.get(a.project.title) ?? 999) - (order.get(b.project.title) ?? 999);
    }
  );

  const projectPages = orderedProjects.map(({ chapter, project }, index): DiaryPage => ({
    section:
      mode === "story"
        ? sectionForStoryProject(project)
        : sectionById.get(chapter.id) ?? activeSections[0],
    title: diaryTitle(project),
    sentence: firstSentence(project.summary),
    pageNumber: rootPages.length + index + 1,
    image: project.image,
    href: project.href,
    links: project.links,
  }));

  return [...rootPages, ...projectPages];
}

function makeBookModel(chapters: WorkChapter[], mode: BookMode) {
  const activeSections = mode === "story" ? storySections : diarySections;
  const pages = makeDiaryPages(chapters, mode);
  const spreads: BookSpread[] = [];

  activeSections.forEach((section) => {
    const sectionPages = pages.filter((page) => page.section.id === section.id);
    for (let index = 0; index < sectionPages.length; index += 2) {
      spreads.push({
        section,
        left: sectionPages[index],
        right: sectionPages[index + 1],
      });
    }
  });

  const sheets: BookSheet[] = [
    {
      front: { kind: "cover" },
      back: spreads[0]?.left ? { kind: "diary", page: spreads[0].left } : { kind: "blank" },
    },
  ];

  spreads.forEach((spread, index) => {
    const nextLeftPage = spreads[index + 1]?.left;
    sheets[index + 1] = {
      front: spread.right ? { kind: "diary", page: spread.right } : { kind: "blank" },
      back:
        index === spreads.length - 1
          ? { kind: "back-cover" }
          : nextLeftPage
            ? { kind: "diary", page: nextLeftPage }
            : { kind: "blank" },
    };
  });

  return { spreads, sheets, pages };
}

export default function WorkBook({ chapters }: { chapters: WorkChapter[] }) {
  const [mode, setMode] = useState<BookMode>("story");
  const activeSections = mode === "story" ? storySections : diarySections;
  const { spreads, sheets, pages } = useMemo(() => makeBookModel(chapters, mode), [chapters, mode]);
  const [spread, setSpread] = useState(0);
  const maxSpread = Math.max(0, spreads.length - 1);
  const currentSpread = spreads[Math.min(spread, maxSpread)];
  const activeSection = currentSpread?.section ?? activeSections[0];
  const left = currentSpread?.left;
  const right = currentSpread?.right;
  const hasOpenLinks = Boolean(
    left?.href ||
      left?.links?.length ||
      right?.href ||
      right?.links?.length
  );

  function setPage(nextPage: number) {
    const clamped = Math.min(Math.max(nextPage - 1, 0), maxSpread);
    setSpread(clamped);
  }

  function goToSpread(nextSpread: number) {
    const clamped = Math.min(Math.max(nextSpread, 0), maxSpread);
    setSpread(clamped);
  }

  function goToSection(sectionId: string) {
    const firstSpread = spreads.findIndex(
      (item) => item.left?.section.id === sectionId || item.right?.section.id === sectionId
    );
    if (firstSpread < 0) return;
    goToSpread(firstSpread);
  }

  return (
    <div className="book-shell book-shell-diary">
      <aside className="book-contents" aria-label="Chapters">
        <p className="meta mb-4">Diary</p>
        <div className="book-mode-switch mb-5" aria-label="Book mode">
          {(["story", "sections"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setMode(item);
                setSpread(0);
              }}
              className={mode === item ? "book-mode-active" : ""}
            >
              {item === "story" ? "Story" : "Sections"}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {activeSections.map((section) => {
            const active = section.id === activeSection.id;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => goToSection(section.id)}
                className={`book-chapter-link ${active ? "book-chapter-link-active" : ""}`}
              >
                <span>{section.kicker.replace("Chapter ", "")}</span>
                <span>{section.title}</span>
              </button>
            );
          })}
        </div>
      </aside>

      <section className="book-stage" aria-live="polite">
        <div className="book-mobile-modes" aria-label="Book mode">
          {(["story", "sections"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setMode(item);
                setSpread(0);
              }}
              className={mode === item ? "book-mode-active" : ""}
            >
              {item === "story" ? "Story" : "Sections"}
            </button>
          ))}
        </div>

        <div className="book-mobile-tabs" aria-label="Chapters">
          {activeSections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => goToSection(section.id)}
              className={section.id === activeSection.id ? "text-accent" : ""}
            >
              {section.kicker.replace("Chapter ", "")}
            </button>
          ))}
        </div>

        <div className="book-object book-object-diary">
          <WorkBookCanvas sheets={sheets} page={spread + 1} onPageChange={setPage} />
        </div>

        {hasOpenLinks ? (
          <div className="book-open-strip">
            {[left, right].map((page, index) => (
              <div key={page?.pageNumber ?? `blank-${index}`} className="book-open-item">
                {page ? (
                  <>
                    <span>{page.title}</span>
                    {page.href || page.links?.length ? (
                      <ProjectAction href={getPrimaryHref(page)} primary>
                        Enter site
                      </ProjectAction>
                    ) : null}
                  </>
                ) : (
                  <span />
                )}
              </div>
            ))}
          </div>
        ) : null}

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
            onClick={() => goToSpread(spread + 1)}
            disabled={spread === maxSpread}
            className="book-control-button"
          >
            Next
          </button>
        </div>

        <div className="book-edge-tabs" aria-hidden="true">
          {activeSections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => goToSection(section.id)}
              className={section.id === activeSection.id ? "book-edge-tab-active" : ""}
              tabIndex={-1}
            >
              {section.kicker.replace("Chapter ", "")}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
