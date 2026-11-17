"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "./lipflow.css";

/* What Lipflow sees. With the camera on, a face tracker runs in the page and
   the mouth is cut out the way Lipflow cuts it for its lip-reading model
   (lipflow/face.py and vsr.py):

   1. MediaPipe's FaceLandmarker finds 478 points on the face.
   2. Four anchors are averaged from them: the right eye, the left eye, the
      base of the nose and the mouth (the same landmark lists as face.py).
   3. A similarity transform (turn, scale, shift) lines those four up with a
      mean face in a 256 px square, the face the model was trained on.
   4. A 96 px square is cut around the mouth there, and the model reads its
      middle 88 px, in grey, 25 frames a second.

   Two differences from the app, both small: the transform is a plain
   least-squares fit where the app uses OpenCV's LMEDS, and the app smooths
   the anchors over a dozen frames after you stop talking, which a live view
   can't do. Nothing is recorded, and no frame leaves the page. */

const MP = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21"; // the version Lipflow pins
const MODEL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

// face.py: subject's right eye first (the image left in an unmirrored frame).
const RIGHT_EYE = [7, 33, 133, 144, 145, 153, 154, 155, 157, 158, 159, 160, 161, 163, 173, 246];
const LEFT_EYE = [249, 263, 362, 373, 374, 380, 381, 382, 384, 385, 386, 387, 388, 390, 398, 466];
const NOSE_BASE = [97, 98, 2, 326, 327];
const LIPS = [0, 13, 14, 17, 37, 39, 40, 61, 78, 80, 81, 82, 84, 87, 88, 91, 95, 146, 178, 181, 185, 191, 267, 269, 270, 291, 308, 310, 311, 312, 314, 317, 318, 321, 324, 375, 402, 405, 409, 415];
const OUTER_LIPS = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146];
const INNER_LIPS = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95];

/* The mean face from lipflow/mean_face.npy (dlib's 68 points in a 256 px
   square), and the four anchors face.py takes from it. */
const MEAN_FACE = [70.9, 97.1, 72.6, 114.9, 76.0, 131.1, 79.3, 146.2, 83.6, 163.3, 91.3, 177.4, 100.3, 187.1, 112.1, 196.0, 130.7, 200.5, 149.9, 195.3, 163.1, 186.4, 173.7, 176.6, 182.4, 162.3, 187.2, 145.1, 190.2, 129.7, 193.0, 113.5, 194.4, 95.6, 81.3, 80.8, 87.8, 75.3, 96.2, 73.8, 104.6, 74.7, 112.2, 77.0, 144.5, 76.4, 152.3, 73.8, 161.1, 72.6, 170.6, 73.8, 178.2, 79.4, 128.7, 95.4, 128.5, 106.9, 128.2, 118.3, 128.3, 127.7, 118.8, 135.2, 123.0, 136.1, 128.9, 137.3, 134.9, 136.0, 139.5, 134.9, 92.5, 94.4, 97.6, 91.0, 105.4, 90.9, 112.8, 94.9, 106.1, 97.1, 98.0, 97.4, 145.5, 94.5, 152.6, 90.2, 160.6, 90.2, 166.7, 93.6, 160.6, 96.5, 152.2, 96.5, 107.2, 157.2, 114.5, 152.1, 123.8, 148.5, 129.0, 149.4, 134.1, 148.4, 144.2, 151.8, 152.2, 157.0, 143.9, 164.0, 136.7, 167.9, 129.2, 168.8, 121.8, 168.0, 115.3, 164.2, 109.2, 157.0, 122.5, 154.4, 129.0, 154.1, 135.8, 154.3, 150.8, 156.8, 135.7, 160.6, 129.0, 161.3, 122.5, 160.5];
const REF: [number, number][] = [[102.07, 94.27], [156.36, 93.58], [129.0, 135.9], [129.31, 157.82]];

const CROP = 96; // cut from the aligned face
const SEEN = 88; // what the model reads, the middle of the 96
const FPS = 25;
const PINK = "rgb(250, 92, 115)"; // Lipflow's own lip colour (camera.py PINK, in BGR there)
const noop = () => {};

type Pt = { x: number; y: number };
type Landmarker = { detectForVideo(video: HTMLVideoElement, ts: number): { faceLandmarks: Pt[][] }; close(): void };
type Vision = {
  FilesetResolver: { forVisionTasks(base: string): Promise<unknown> };
  FaceLandmarker: { createFromOptions(fileset: unknown, options: object): Promise<Landmarker> };
};

// Loaded once, on the first "Turn on camera", and kept for the visit.
let tracker: Promise<Landmarker> | null = null;
function loadTracker() {
  tracker ??= (async () => {
    const vision = (await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ `${MP}/vision_bundle.mjs`)) as Vision;
    const fileset = await vision.FilesetResolver.forVisionTasks(`${MP}/wasm`);
    const make = (delegate: "GPU" | "CPU") => vision.FaceLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL, delegate },
      runningMode: "VIDEO",
      numFaces: 1,
      minFaceDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    return make("GPU").catch(() => make("CPU"));
  })();
  tracker.catch(() => { tracker = null; });
  return tracker;
}

const mean = (pts: Pt[], idx: number[]): [number, number] => {
  let x = 0, y = 0;
  for (const i of idx) { x += pts[i].x; y += pts[i].y; }
  return [x / idx.length, y / idx.length];
};

/** Least-squares similarity from src onto dst: x' = a x - b y + tx, y' = b x + a y + ty. */
function similarity(src: [number, number][], dst: [number, number][]) {
  const n = src.length;
  let sx = 0, sy = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) { sx += src[i][0]; sy += src[i][1]; dx += dst[i][0]; dy += dst[i][1]; }
  sx /= n; sy /= n; dx /= n; dy /= n;
  let p = 0, q = 0, s = 0;
  for (let i = 0; i < n; i++) {
    const ux = src[i][0] - sx, uy = src[i][1] - sy, vx = dst[i][0] - dx, vy = dst[i][1] - dy;
    p += ux * vx + uy * vy;
    q += ux * vy - uy * vx;
    s += ux * ux + uy * uy;
  }
  const a = p / s, b = q / s;
  return { a, b, tx: dx - (a * sx - b * sy), ty: dy - (b * sx + a * sy) };
}

type Status = { kind: "off" | "starting" | "live" | "error"; text: string };
const IDLE: Status = { kind: "off", text: "Your camera stays in this page. Nothing is recorded or sent anywhere." };

export default function Lipflow() {
  const figureRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const cropRef = useRef<HTMLCanvasElement>(null);
  const stopRef = useRef<() => void>(noop);
  const generation = useRef(0); // bumped by every stop, so a start still waiting on the camera gives up
  const [status, setStatus] = useState<Status>(IDLE);
  const [face, setFace] = useState(false);

  const stop = useCallback((next: Status = IDLE) => {
    generation.current++;
    stopRef.current();
    stopRef.current = noop;
    setFace(false);
    setStatus(next);
  }, []);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus({ kind: "error", text: "This browser can't open a camera here." });
      return;
    }
    const gen = ++generation.current;
    setStatus({ kind: "starting", text: "Starting the camera and the face tracker…" });
    const model = loadTracker();
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } }, audio: false });
    } catch (err) {
      const name = (err as DOMException)?.name;
      const text = name === "NotAllowedError" || name === "SecurityError"
        ? "Camera access is blocked. Allow it for this site in your browser, then try again."
        : name === "NotFoundError" || name === "OverconstrainedError"
          ? "No camera found."
          : name === "NotReadableError"
            ? "The camera is busy in another app."
            : "The camera didn't start.";
      if (gen === generation.current) setStatus({ kind: "error", text });
      return;
    }
    if (gen !== generation.current) { stream.getTracks().forEach(t => t.stop()); return; }

    let running = true, raf = 0, vfc = 0;
    const video = videoRef.current!;
    stopRef.current = () => {
      running = false;
      cancelAnimationFrame(raf);
      if (vfc && "cancelVideoFrameCallback" in video) video.cancelVideoFrameCallback(vfc);
      stream.getTracks().forEach(t => t.stop());
      video.srcObject = null;
      for (const c of [overlayRef.current, cropRef.current]) c?.getContext("2d")?.clearRect(0, 0, c.width, c.height);
    };

    let lm: Landmarker;
    try {
      video.srcObject = stream;
      await video.play();
      lm = await model;
    } catch {
      if (running) stop({ kind: "error", text: "The face tracker didn't load. Check your connection and try again." });
      return;
    }
    if (!running) return;
    setStatus({ kind: "live", text: "Camera on. Nothing is recorded or sent anywhere." });

    const overlay = overlayRef.current!, crop = cropRef.current!;
    const octx = overlay.getContext("2d")!;
    const cctx = crop.getContext("2d", { willReadFrequently: true })!;
    let last = -1, nextTick = 0, seen = false;
    let anchors: [number, number][] | null = null;

    const frame = () => {
      if (!running) return;
      const now = performance.now();
      if (video.readyState >= 2 && video.currentTime !== last) {
        last = video.currentTime;
        const vw = video.videoWidth, vh = video.videoHeight;
        if (overlay.width !== vw || overlay.height !== vh) { overlay.width = vw; overlay.height = vh; }
        let found: Pt[] | undefined;
        try { found = lm.detectForVideo(video, now).faceLandmarks[0]; } catch { /* a dropped frame */ }
        const pts = found?.map(p => ({ x: p.x * vw, y: p.y * vh }));
        if (!!pts !== seen) { seen = !!pts; setFace(seen); }
        if (pts) anchors = [mean(pts, RIGHT_EYE), mean(pts, LEFT_EYE), mean(pts, NOSE_BASE), mean(pts, LIPS)];

        // A hairline on screen, whatever the video's size.
        const px = 1 / Math.max(overlay.clientWidth / vw, overlay.clientHeight / vh);
        octx.clearRect(0, 0, vw, vh);
        if (pts && anchors) {
          const { a, b, tx, ty } = similarity(anchors, REF);
          const [cx, cy] = mouthCentre(anchors[3], a, b, tx, ty);
          // The crop's square, carried back from the aligned face to the frame.
          const k = a * a + b * b;
          const back = (x: number, y: number) => [(a * (x - tx) + b * (y - ty)) / k, (-b * (x - tx) + a * (y - ty)) / k];
          octx.lineWidth = px;
          octx.strokeStyle = "rgba(255, 255, 255, .85)";
          octx.beginPath();
          [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy], i) => {
            const [x, y] = back(cx + (sx * SEEN) / 2, cy + (sy * SEEN) / 2);
            if (i) octx.lineTo(x, y); else octx.moveTo(x, y);
          });
          octx.closePath();
          octx.stroke();
          octx.strokeStyle = PINK;
          for (const ring of [OUTER_LIPS, INNER_LIPS]) {
            octx.beginPath();
            ring.forEach((i, j) => (j ? octx.lineTo(pts[i].x, pts[i].y) : octx.moveTo(pts[i].x, pts[i].y)));
            octx.closePath();
            octx.stroke();
          }
          octx.fillStyle = "#fff";
          for (const [x, y] of anchors) { octx.beginPath(); octx.arc(x, y, 2.5 * px, 0, Math.PI * 2); octx.fill(); }
        }

        /* On a steady 25 fps clock, take the newest frame at or after each
           tick, as vsr.py resamples a recording, and cut the crop from it. */
        if (now >= nextTick && anchors) {
          nextTick = nextTick && now - nextTick < 200 ? nextTick + 1000 / FPS : now + 1000 / FPS;
          const { a, b, tx, ty } = similarity(anchors, REF);
          const [cx, cy] = mouthCentre(anchors[3], a, b, tx, ty);
          const o = (CROP - SEEN) / 2;
          cctx.setTransform(1, 0, 0, 1, 0, 0);
          cctx.fillStyle = "#000"; // warpAffine's border
          cctx.fillRect(0, 0, SEEN, SEEN);
          cctx.setTransform(a, b, -b, a, tx - (cx - CROP / 2) - o, ty - (cy - CROP / 2) - o);
          cctx.drawImage(video, 0, 0);
          const img = cctx.getImageData(0, 0, SEEN, SEEN), d = img.data;
          for (let i = 0; i < d.length; i += 4) {
            const g = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]); // cv2 BGR2GRAY
            d[i] = d[i + 1] = d[i + 2] = g;
          }
          cctx.putImageData(img, 0, 0);
        }
      }
      if ("requestVideoFrameCallback" in video) vfc = video.requestVideoFrameCallback(frame);
      else raf = requestAnimationFrame(frame);
    };
    frame();
  }, [stop]);

  // Turn the camera off when the demo scrolls away, the tab is hidden, or the page changes.
  useEffect(() => {
    const el = figureRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (!e.isIntersecting && stopRef.current !== noop) stop(); }, { threshold: 0 });
    io.observe(el);
    const onHide = () => { if (document.hidden && stopRef.current !== noop) stop(); };
    document.addEventListener("visibilitychange", onHide);
    return () => { io.disconnect(); document.removeEventListener("visibilitychange", onHide); stopRef.current(); };
  }, [stop]);

  const on = status.kind === "live" || status.kind === "starting";
  const live = status.kind === "live";

  return (
    <figure className="ui-try" ref={figureRef}>
      <div className="ui-media ui-try-stage lf-stage" data-live={live || undefined}>
        <div className="lf-frame">
          {/* Before the camera: the face every frame is lined up with. */}
          <svg className="lf-diagram" viewBox="44 52 168 164" role="img" aria-label="Lipflow's reference face. Each frame is lined up with it by the eyes, the base of the nose and the mouth, and the square around the mouth is cut out.">
            <Face />
          </svg>
          <video ref={videoRef} className="lf-video" muted playsInline aria-hidden="true" />
          <canvas ref={overlayRef} className="lf-overlay" aria-hidden="true" />
        </div>
        <div className="lf-side">
          <div className="lf-crop">
            <svg className="lf-diagram" viewBox={`${REF[3][0] - SEEN / 2} ${REF[3][1] - SEEN / 2} ${SEEN} ${SEEN}`} aria-hidden="true">
              <Face crop />
            </svg>
            <canvas
              ref={cropRef}
              width={SEEN}
              height={SEEN}
              role="img"
              aria-label="Your mouth as Lipflow's model gets it: 88 by 88 pixels, in grey."
            />
          </div>
          <p className="lf-label">What the model reads<br /><span>{SEEN} × {SEEN} px, grey, {FPS} fps</span></p>
        </div>
      </div>
      <div className="ui-try-controls">
        <div className="ui-try-row">
          <button
            type="button"
            className="ui-try-pill"
            disabled={status.kind === "starting"}
            onClick={() => (on ? stop() : start())}
          >
            {status.kind === "starting" ? "Starting…" : on ? "Turn off camera" : "Turn on camera"}
          </button>
          <p className="lf-status" role="status">{live && !face ? "Looking for a face…" : status.text}</p>
        </div>
      </div>
      <figcaption className="ui-try-caption">Try it: turn on your camera and mouth a few words. This is the crop Lipflow reads; the lip reading itself runs in the app on your own machine, not here.</figcaption>
    </figure>
  );
}

/** Where the crop is centred in the aligned face: the mouth anchor, kept 48 px from the edges (face.py). */
function mouthCentre(m: [number, number], a: number, b: number, tx: number, ty: number) {
  const x = a * m[0] - b * m[1] + tx, y = b * m[0] + a * m[1] + ty;
  const h = CROP / 2;
  return [Math.round(Math.min(256 - h, Math.max(h, x))), Math.round(Math.min(256 - h, Math.max(h, y)))];
}

/** The mean face drawn in hairlines, its four anchors as dots and the model's square. */
function Face({ crop = false }: { crop?: boolean }) {
  const pts = (from: number, to: number, close = false) => {
    const p: string[] = [];
    for (let i = from; i <= to; i++) p.push(`${MEAN_FACE[i * 2]},${MEAN_FACE[i * 2 + 1]}`);
    return { d: `M${p.join("L")}${close ? "Z" : ""}` };
  };
  const [mx, my] = REF[3];
  return (
    <g fill="none" strokeWidth="1">
      <g stroke="rgba(255, 255, 255, .5)">
        {[pts(0, 16), pts(17, 21), pts(22, 26), pts(27, 30), pts(31, 35), pts(36, 41, true), pts(42, 47, true)].map((p, i) => (
          <path key={i} {...p} vectorEffect="non-scaling-stroke" />
        ))}
      </g>
      <g stroke={PINK}>
        <path {...pts(48, 59, true)} vectorEffect="non-scaling-stroke" />
        <path {...pts(60, 67, true)} vectorEffect="non-scaling-stroke" />
      </g>
      {!crop && (
        <>
          <rect x={mx - SEEN / 2} y={my - SEEN / 2} width={SEEN} height={SEEN} stroke="rgba(255, 255, 255, .85)" vectorEffect="non-scaling-stroke" />
          <g fill="#fff">{REF.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.6" />)}</g>
        </>
      )}
    </g>
  );
}
