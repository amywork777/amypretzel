"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "./lil-spider-maze.css";

/* Maman's dinner, to play with. The real piece (ME 318, Feb 2023) is a
   square aluminium block with a spider-web pocket milled into it as a
   staircase: six terraces stepping down to a flat middle with five holes
   made with the pilot drill. The steel balls are the bugs; the holes are
   their end, the spider's dinner. A clear acrylic lid engraved with a
   spider is screwed on at two corners. The photos show four balls.

   Read from the photos, not from drawings, so the sizes are estimates: a
   2 inch block, 1/8 inch balls, a twelve-spoke web 45 mm across with
   2.6 mm terraces and 0.6 mm steps, five holes in a cross 3.8 mm apart.

   The physics is plain and real at that scale (mm, s): gravity along the
   tilt for a rolling ball (5/7 g sin θ), rolling friction, steps that drop
   a ball easily and only let it climb with enough speed, walls and balls
   that bounce, and holes that hold a ball against a gentle tilt and let it
   go under a hard one, as the real ones do. */

/* physics:start */
type Vec = { x: number; y: number };
type Ball = { x: number; y: number; vx: number; vy: number; level: number };

const R_BALL = 1.5875;                  // a 1/8" steel ball
const HALF = 25.4;                      // half of the 2" block
const SPOKES = 12;
const SAG = 0.1;                        // how far a thread sags between spokes
const RINGS = [7, 9.6, 12.2, 14.8, 17.4, 20, 22.6]; // risers out to the pocket wall, at the spokes
const STEP = 0.6;                       // height of one step
const G = 9810;
const ROLL = 5 / 7;                     // a rolling solid ball takes 5/7 of g sin θ
const CLIMB = (10 / 7) * G * STEP;      // v² a rolling ball needs to get up a step
const DROP = 0.5 * CLIMB;               // v² it gains coming down one (half lost on landing)
const RISER_CONTACT = Math.sqrt(2 * R_BALL * STEP - STEP * STEP); // ball meets a step's edge this far out
const MU = 0.012;                       // rolling resistance, steel on aluminium plus a little give
const E_STEP = 0.3, E_WALL = 0.45, E_BALL = 0.85;
const HOLES: Vec[] = [{ x: 0, y: 0 }, { x: 0, y: -3.8 }, { x: 3.8, y: 0 }, { x: 0, y: 3.8 }, { x: -3.8, y: 0 }];
const HOLE_REACH = 1.2;                 // the drilled cone's rim, from the hole's centre
const HOLE_PULL = ROLL * G * (0.3 / HOLE_REACH); // 0.3 mm deep: holds against about 14°
const IN_HOLE = 0.5;
const DT = 1 / 480;

/** The web's outline at angle θ, as a fraction of its radius at the spokes. */
const shape = (t: number) => 1 - SAG * Math.abs(Math.sin((SPOKES / 2) * t));

/** How far out a point is in web terms (equal on every ring), and its outward gradient. */
function webRadius(x: number, y: number) {
  const r = Math.hypot(x, y) || 1e-9, t = Math.atan2(y, x), s = shape(t);
  const sn = Math.sin((SPOKES / 2) * t);
  const ds = -SAG * Math.sign(sn) * (SPOKES / 2) * Math.cos((SPOKES / 2) * t);
  const ur = 1 / s, ut = -ds / (s * s);         // d/dr and (1/r) d/dθ of r / s
  const cx = x / r, cy = y / r;
  return { rho: r / s, gx: ur * cx - ut * cy, gy: ur * cy + ut * cx };
}

const levelOf = (x: number, y: number) => {
  const { rho } = webRadius(x, y);
  const i = RINGS.findIndex(R => rho < R);
  return i < 0 ? RINGS.length - 1 : i;
};

// The bugs start out on the upper terraces, each resting mid-step, given as
// an angle (degrees, clockwise from the right) and a web radius.
const START: Ball[] = ([[205, 20.4], [292, 18.7], [22, 18.7], [118, 16.1]] as const).map(([a, rho]) => {
  const t = (a * Math.PI) / 180, r = rho * shape(t);
  const x = +(r * Math.cos(t)).toFixed(2), y = +(r * Math.sin(t)).toFixed(2);
  return { x, y, vx: 0, vy: 0, level: levelOf(x, y) };
});

const nearestHole =(b: { x: number; y: number }) => {
  let best = HOLES[0], d = Infinity;
  for (const h of HOLES) { const e = Math.hypot(b.x - h.x, b.y - h.y); if (e < d) { d = e; best = h; } }
  return { hole: best, d };
};

const isIn = (b: Ball) => b.level === 0 && nearestHole(b).d < IN_HOLE && Math.hypot(b.vx, b.vy) < 25;

function step(balls: Ball[], tilt: Vec, dt: number) {
  const ax = ROLL * G * Math.sin(tilt.x), ay = ROLL * G * Math.sin(tilt.y);
  for (const b of balls) {
    let fx = ax, fy = ay, damp = 0;
    if (b.level === 0) {
      const { hole, d } = nearestHole(b);
      if (d < HOLE_REACH && d > 1e-6) {
        const k = HOLE_PULL * Math.min(1, d / 0.25) / d;
        fx -= (b.x - hole.x) * k; fy -= (b.y - hole.y) * k;
        damp = 7; // it rattles in the cone and settles
      }
    }
    b.vx += fx * dt; b.vy += fy * dt;
    const v = Math.hypot(b.vx, b.vy), f = MU * G * dt;
    if (v <= f) {
      // Rolling resistance holds a ball still until the tilt beats it.
      if (Math.hypot(fx, fy) <= MU * G) { b.vx = 0; b.vy = 0; }
    } else { b.vx -= (b.vx / v) * f; b.vy -= (b.vy / v) * f; }
    if (damp) { const m = Math.exp(-damp * dt); b.vx *= m; b.vy *= m; }
    b.x += b.vx * dt; b.y += b.vy * dt;
    edges(b);
  }
  // Steel on steel: equal masses, a good bounce.
  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      const a = balls[i], c = balls[j];
      const dx = c.x - a.x, dy = c.y - a.y, d = Math.hypot(dx, dy);
      if (d >= 2 * R_BALL || d < 1e-9) continue;
      const nx = dx / d, ny = dy / d, push = (2 * R_BALL - d) / 2;
      a.x -= nx * push; a.y -= ny * push; c.x += nx * push; c.y += ny * push;
      const rel = (c.vx - a.vx) * nx + (c.vy - a.vy) * ny;
      if (rel < 0) {
        const j2 = (-(1 + E_BALL) * rel) / 2;
        a.vx -= j2 * nx; a.vy -= j2 * ny; c.vx += j2 * nx; c.vy += j2 * ny;
      }
      edges(a); edges(c);
    }
  }
}

/** Steps and the pocket wall: drop down a step, climb one with speed, bounce otherwise. */
function edges(b: Ball) {
  for (let guard = 0; guard < 3; guard++) {
    const { rho, gx, gy } = webRadius(b.x, b.y);
    const gl = Math.hypot(gx, gy), nx = gx / gl, ny = gy / gl;
    if (b.level > 0 && rho < RINGS[b.level - 1]) {
      // Off the edge and down a step: the drop turns into speed inward.
      b.level--;
      const vin = Math.max(0, -(b.vx * nx + b.vy * ny));
      const gain = Math.sqrt(vin * vin + DROP) - vin;
      b.vx -= nx * gain; b.vy -= ny * gain;
      continue;
    }
    const wall = b.level === RINGS.length - 1;
    const limit = RINGS[b.level] - (wall ? R_BALL : RISER_CONTACT) * gl;
    if (rho <= limit) return;
    const vn = b.vx * nx + b.vy * ny;
    if (!wall && vn * vn > CLIMB && vn > 0) {
      // Fast enough to roll up onto the next terrace, slower for it.
      const after = Math.sqrt(vn * vn - CLIMB) * 0.85;
      b.vx += nx * (after - vn); b.vy += ny * (after - vn);
      const over = (RINGS[b.level] + 0.05 - rho) / gl;
      b.x += nx * over; b.y += ny * over;
      b.level++;
      continue;
    }
    if (vn > 0) { b.vx -= (1 + (wall ? E_WALL : E_STEP)) * vn * nx; b.vy -= (1 + (wall ? E_WALL : E_STEP)) * vn * ny; }
    const back = (rho - limit) / gl;
    b.x -= nx * back; b.y -= ny * back;
    return;
  }
}
/* physics:end */

const MAX_TILT = (16 * Math.PI) / 180;   // dragging to the block's edge
const KEY_TILT = (10 * Math.PI) / 180;   // arrow keys: firm, but not enough to lift a bug out
const LOOK = 0.4;                        // the board leans this much of the real tilt on screen

/** The web's outline at web-radius R, as an SVG path in mm: the same shape
    the physics uses, sampled every half degree so each spoke's point lands. */
function ringPath(R: number) {
  let d = "";
  for (let i = 0; i < 720; i++) {
    const t = (i / 720) * Math.PI * 2, r = R * shape(t);
    d += `${i ? "L" : "M"}${(r * Math.cos(t)).toFixed(2)} ${(r * Math.sin(t)).toFixed(2)}`;
  }
  return d + "Z";
}

const RING_PATHS = RINGS.map(ringPath);
// One faint toolpath mark across the middle of each terrace.
const TOOL_PATHS = RINGS.map((R, i) => ringPath(i ? (R + RINGS[i - 1]) / 2 : R * 0.55));
// Drawn outside in, so each terrace sits inside the one above it.
const OUTSIDE_IN = RINGS.map((_, i) => RINGS.length - 1 - i);

// Fine brushing on the block's top, fixed so the server and browser agree.
const BRUSH = Array.from({ length: 90 }, (_, i) => {
  const n = Math.sin(i * 12.9898) * 43758.5453;
  const r = n - Math.floor(n);
  return { y: -HALF + (i + 0.5) * ((2 * HALF) / 90), o: 0.04 + r * 0.1, light: r > 0.5 };
});

// Maman, engraved in the lid: a small body and eight long arched legs
// (curved, so they don't read as spokes; the pocket has none).
const LEGS = [
  "M-1 -0.6 Q-8.5 -7.5 -7 -14.5", "M-1.5 0 Q-10.5 -3.5 -13.6 -1.8",
  "M-1.5 1 Q-10 3 -12.4 7.6", "M-1 1.8 Q-6.5 7 -4.8 13.4",
];
const FLOORS = ["#bdc1c4", "#c0c4c7", "#c3c7ca", "#c6cacc", "#c9cccf", "#cbcfd1", "#ced1d3"];

type Status = { inCount: number; seconds: number; started: boolean; wonAt: number | null };
const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export default function SpiderMaze() {
  const boardRef = useRef<HTMLDivElement>(null);
  const ballRefs = useRef<(SVGGElement | null)[]>([]);
  const sim = useRef({
    balls: START.map(b => ({ ...b })),
    tilt: { x: 0, y: 0 },
    keys: new Set<string>(),
    pointer: null as Vec | null,
    sensor: null as Vec | null,
    startedAt: 0,
    settledFor: 0,
    won: false,
    raf: 0,
    last: 0,
  });
  const [status, setStatus] = useState<Status>({ inCount: 0, seconds: 0, started: false, wonAt: null });
  const [sensing, setSensing] = useState(false);
  const [note, setNote] = useState("");
  const sensorOff = useRef<() => void>(() => {});

  const target = useCallback((): Vec => {
    const s = sim.current;
    if (s.pointer) return s.pointer;
    if (s.keys.size) {
      const k = s.keys;
      const x = (k.has("ArrowRight") ? 1 : 0) - (k.has("ArrowLeft") ? 1 : 0);
      const y = (k.has("ArrowDown") ? 1 : 0) - (k.has("ArrowUp") ? 1 : 0);
      const l = Math.hypot(x, y) || 1;
      return { x: (x / l) * KEY_TILT, y: (y / l) * KEY_TILT };
    }
    return s.sensor ?? { x: 0, y: 0 };
  }, []);

  const draw = useCallback(() => {
    const s = sim.current;
    s.balls.forEach((b, i) => ballRefs.current[i]?.setAttribute("transform", `translate(${b.x.toFixed(3)} ${b.y.toFixed(3)})`));
    const deg = 180 / Math.PI * LOOK;
    if (boardRef.current) boardRef.current.style.transform = `rotateX(${(-s.tilt.y * deg).toFixed(3)}deg) rotateY(${(s.tilt.x * deg).toFixed(3)}deg)`;
  }, []);

  // One frame of the loop. It runs only while the board leans or something
  // still moves, so a level board with resting balls costs nothing.
  const frame = useRef<(now: number) => void>(() => {});
  useEffect(() => {
    frame.current = (now: number) => {
      const s = sim.current;
      const dt = Math.min(0.05, (now - s.last) / 1000);
      s.last = now;
      const goal = target();
      // With reduced motion the board meets the tilt at once rather than easing.
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const ease = reduce ? 1 : 1 - Math.exp(-dt * 14);
      s.tilt.x += (goal.x - s.tilt.x) * ease;
      s.tilt.y += (goal.y - s.tilt.y) * ease;
      if (Math.hypot(goal.x - s.tilt.x, goal.y - s.tilt.y) < 1e-4) s.tilt = { ...goal };
      if (!s.startedAt && Math.hypot(goal.x, goal.y) > 0.01) {
        s.startedAt = now;
        setStatus(st => ({ ...st, started: true }));
      }
      for (let t = 0; t < dt; t += DT) step(s.balls, s.tilt, Math.min(DT, dt - t));
      draw();

      const inCount = s.balls.filter(isIn).length;
      if (!s.won && s.startedAt) {
        s.settledFor = inCount === s.balls.length ? s.settledFor + dt : 0;
        if (s.settledFor > 0.4) {
          s.won = true;
          const seconds = (now - s.startedAt) / 1000;
          setStatus(st => ({ ...st, inCount, wonAt: seconds, seconds }));
        }
      }
      setStatus(st => (st.inCount === inCount ? st : { ...st, inCount }));

      const moving = s.balls.some(b => b.vx || b.vy) || s.tilt.x !== goal.x || s.tilt.y !== goal.y;
      const leaning = Math.hypot(goal.x, goal.y) > 0;
      s.raf = moving || leaning ? requestAnimationFrame(t => frame.current(t)) : 0;
    };
  }, [draw, target]);

  const wake = useCallback(() => {
    const s = sim.current;
    if (s.raf) return;
    s.last = performance.now();
    s.raf = requestAnimationFrame(t => frame.current(t));
  }, []);

  // The clock ticks once a second while a game is on.
  useEffect(() => {
    if (!status.started || status.wonAt !== null) return;
    const id = window.setInterval(() => {
      const s = sim.current;
      if (s.startedAt) setStatus(st => ({ ...st, seconds: (performance.now() - s.startedAt) / 1000 }));
    }, 250);
    return () => window.clearInterval(id);
  }, [status.started, status.wonAt]);

  useEffect(() => {
    const s = sim.current;
    const off = sensorOff;
    return () => { cancelAnimationFrame(s.raf); off.current(); };
  }, []);

  const reset = () => {
    const s = sim.current;
    s.balls = START.map(b => ({ ...b }));
    s.tilt = { x: 0, y: 0 };
    s.startedAt = 0; s.settledFor = 0; s.won = false;
    s.sensor = s.sensor && { x: 0, y: 0 };
    cancelAnimationFrame(s.raf); s.raf = 0;
    draw();
    setStatus({ inCount: 0, seconds: 0, started: false, wonAt: null });
  };

  const fromPointer = (e: React.PointerEvent) => {
    const el = boardRef.current?.parentElement;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const half = r.height * 0.42;
    let x = (e.clientX - (r.left + r.width / 2)) / half, y = (e.clientY - (r.top + r.height / 2)) / half;
    const l = Math.hypot(x, y);
    if (l > 1) { x /= l; y /= l; }
    sim.current.pointer = { x: x * MAX_TILT, y: y * MAX_TILT };
    wake();
  };

  const toggleSensor = async () => {
    if (sensing) { sensorOff.current(); return; }
    type Permissioned = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<string> };
    const DOE = (typeof window !== "undefined" ? window.DeviceOrientationEvent : undefined) as Permissioned | undefined;
    if (!DOE) { setNote("No tilt sensor here, so drag instead."); return; }
    if (typeof DOE.requestPermission === "function") {
      try {
        if ((await DOE.requestPermission()) !== "granted") { setNote("Tilt wasn’t allowed, so drag instead."); return; }
      } catch { setNote("Tilt wasn’t allowed, so drag instead."); return; }
    }
    let base: { b: number; g: number } | null = null;
    const deg = Math.PI / 180;
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.beta === null || e.gamma === null) return;
      if (!base) { base = { b: e.beta, g: e.gamma }; setNote(""); }
      const db = e.beta - base.b, dg = e.gamma - base.g;
      const angle = (screen.orientation?.angle ?? 0) % 360;
      const [x, y] = angle === 90 ? [db, -dg] : angle === 270 ? [-db, dg] : angle === 180 ? [-dg, -db] : [dg, db];
      const clamp = (v: number) => Math.max(-MAX_TILT, Math.min(MAX_TILT, v * deg));
      sim.current.sensor = { x: clamp(x), y: clamp(y) };
      wake();
    };
    window.addEventListener("deviceorientation", onTilt);
    const timer = window.setTimeout(() => {
      if (!base) { sensorOff.current(); setNote("No tilt readings came through, so drag instead."); }
    }, 1500);
    sensorOff.current = () => {
      window.removeEventListener("deviceorientation", onTilt);
      window.clearTimeout(timer);
      sim.current.sensor = null;
      setSensing(false);
      sensorOff.current = () => {};
      wake();
    };
    setNote("Hold it how you like; that’s level.");
    setSensing(true);
  };

  const onKey = (e: React.KeyboardEvent, down: boolean) => {
    if (!e.key.startsWith("Arrow")) return;
    e.preventDefault();
    const k = sim.current.keys;
    if (down) k.add(e.key); else k.delete(e.key);
    wake();
  };

  const time = clock(status.seconds);
  const line = status.wonAt !== null
    ? `All four in, ${clock(status.wonAt)}. Dinner is served.`
    : status.started ? `${status.inCount} of 4 in · ${time}` : "0 of 4 in";

  return (
    <figure className="ui-try spider-try">
      <div className="ui-media ui-try-stage spider-stage">
        <div className="spider-shadow" aria-hidden="true" />
        <div
          ref={boardRef}
          className="spider-board"
          tabIndex={0}
          role="application"
          aria-label="Maman’s dinner, a spider web staircase with four steel balls. Arrow keys tilt it."
          aria-describedby="spider-status"
          onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); fromPointer(e); }}
          onPointerMove={e => { if (sim.current.pointer) fromPointer(e); }}
          onPointerUp={() => { sim.current.pointer = null; wake(); }}
          onPointerCancel={() => { sim.current.pointer = null; wake(); }}
          onKeyDown={e => onKey(e, true)}
          onKeyUp={e => onKey(e, false)}
          onBlur={() => { sim.current.keys.clear(); wake(); }}
        >
          <svg viewBox={`${-HALF} ${-HALF} ${2 * HALF} ${2 * HALF}`} aria-hidden="true">
            <defs>
              <radialGradient id="spider-steel" cx="38%" cy="34%" r="70%">
                <stop offset="0" stopColor="#ffffff" />
                <stop offset=".22" stopColor="#d9dde0" />
                <stop offset=".62" stopColor="#7d8389" />
                <stop offset="1" stopColor="#3b4045" />
              </radialGradient>
              <radialGradient id="spider-screw" cx="40%" cy="36%" r="72%">
                <stop offset="0" stopColor="#fbfcfc" />
                <stop offset=".55" stopColor="#c3c8cc" />
                <stop offset="1" stopColor="#868c92" />
              </radialGradient>
              <linearGradient id="spider-sheen" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#fff" stopOpacity=".26" />
                <stop offset=".28" stopColor="#fff" stopOpacity=".06" />
                <stop offset=".34" stopColor="#fff" stopOpacity=".2" />
                <stop offset=".42" stopColor="#fff" stopOpacity="0" />
                <stop offset="1" stopColor="#fff" stopOpacity="0" />
              </linearGradient>
              {RING_PATHS.map((d, i) => (
                <clipPath key={i} id={`spider-ring-${i}`}><path d={d} /></clipPath>
              ))}
              {RING_PATHS.map((d, i) => (
                <clipPath key={i} id={`spider-lit-${i}`}><path d={d} transform="translate(-.16 -.2)" /></clipPath>
              ))}
            </defs>

            {/* The block's brushed top. */}
            <rect x={-HALF} y={-HALF} width={2 * HALF} height={2 * HALF} rx=".6" fill="#d4d7d9" />
            {BRUSH.map((l, i) => (
              <line key={i} x1={-HALF} x2={HALF} y1={l.y.toFixed(2)} y2={l.y.toFixed(2)} stroke={l.light ? "#fff" : "#5d6368"} strokeOpacity={l.o.toFixed(3)} strokeWidth=".18" />
            ))}

            {/* The pocket, outside in: each terrace casts a shadow under its
                upper-left riser and catches light on its lower-right one. */}
            {OUTSIDE_IN.map(k => {
              const wall = k === RINGS.length - 1;
              return (
                <g key={k}>
                  <g clipPath={`url(#spider-ring-${k})`}>
                    <path d={RING_PATHS[k]} fill="#f2f4f5" />
                    <path d={RING_PATHS[k]} fill={wall ? "#8f959a" : "#a3a8ac"} clipPath={`url(#spider-lit-${k})`} />
                    <g clipPath={`url(#spider-lit-${k})`}>
                      <path d={RING_PATHS[k]} fill={FLOORS[k]} transform={wall ? "translate(.8 1)" : "translate(.3 .38)"} />
                    </g>
                  </g>
                  <path d={TOOL_PATHS[k]} fill="none" stroke="#fff" strokeOpacity=".32" strokeWidth=".12" />
                </g>
              );
            })}

            {/* The holes from the pilot drill. */}
            {HOLES.map((h, i) => (
              <g key={i} transform={`translate(${h.x} ${h.y})`}>
                <circle r={HOLE_REACH} fill="#a9aeb2" />
                <circle r=".95" fill="#3f4448" />
                <circle r=".95" fill="none" stroke="#e9ecee" strokeWidth=".14" transform="translate(.12 .15)" strokeOpacity=".7" />
              </g>
            ))}

            {/* The bugs. */}
            {START.map((b, i) => (
              <g key={i} ref={el => { ballRefs.current[i] = el; }} transform={`translate(${b.x} ${b.y})`}>
                <ellipse cx=".55" cy=".7" rx={R_BALL * 1.02} ry={R_BALL * 0.9} fill="#2b3035" fillOpacity=".22" />
                <circle r={R_BALL} fill="url(#spider-steel)" />
                <ellipse cx="-.5" cy="-.58" rx=".42" ry=".3" fill="#fff" transform="rotate(-35 -.5 -.58)" />
              </g>
            ))}

            {/* The acrylic lid: a faint tint, a sheen, the engraved spider and its edge. */}
            <rect x={-HALF} y={-HALF} width={2 * HALF} height={2 * HALF} rx=".6" fill="#e7f2f2" fillOpacity=".1" />
            <g fill="none" strokeLinecap="round" strokeLinejoin="round" transform="translate(.4 -1.2)">
              <g stroke="#3d4448" strokeOpacity=".08" strokeWidth=".3" transform="translate(.08 .1)">
                {LEGS.map(d => <path key={d} d={d} />)}
                {LEGS.map(d => <path key={`r${d}`} d={d} transform="scale(-1 1)" />)}
                <ellipse cy="-4.6" rx="2.9" ry="3.8" />
                <ellipse cy=".6" rx="1.7" ry="1.9" />
              </g>
              <g stroke="#fff" strokeOpacity=".55" strokeWidth=".22">
                {LEGS.map(d => <path key={d} d={d} />)}
                {LEGS.map(d => <path key={`r${d}`} d={d} transform="scale(-1 1)" />)}
                <ellipse cy="-4.6" rx="2.9" ry="3.8" />
                <ellipse cy=".6" rx="1.7" ry="1.9" />
              </g>
            </g>
            <rect x={-HALF} y={-HALF} width={2 * HALF} height={2 * HALF} rx=".6" fill="url(#spider-sheen)" />
            <rect x={-HALF + 0.3} y={-HALF + 0.3} width={2 * HALF - 0.6} height={2 * HALF - 0.6} rx=".45" fill="none" stroke="#9fc9c8" strokeOpacity=".4" strokeWidth=".45" />

            {/* Two pan-head screws hold the lid on, at opposite corners. */}
            {[[-21.3, -21.3], [21.3, 21.3]].map(([x, y]) => (
              <g key={x} transform={`translate(${x} ${y})`}>
                <circle r="2.5" fill="url(#spider-screw)" stroke="#7b8288" strokeWidth=".14" />
                <g transform="rotate(18)" fill="#5b6268">
                  <rect x="-1.2" y="-.24" width="2.4" height=".48" rx=".2" />
                  <rect x="-.24" y="-1.2" width=".48" height="2.4" rx=".2" />
                </g>
              </g>
            ))}
          </svg>
        </div>
      </div>
      <div className="ui-try-controls">
        <div className="ui-try-row" role="group" aria-label="Maze">
          <button type="button" className="ui-try-pill" onClick={reset}>Reset</button>
          <button type="button" className="ui-try-pill spider-sensor" aria-pressed={sensing} onClick={toggleSensor}>Use tilt</button>
        </div>
        <p className="spider-status" id="spider-status">
          {note || line}
        </p>
      </div>
      <p className="spider-live" aria-live="polite">{status.wonAt !== null ? "All four bugs are in. Dinner is served." : ""}</p>
      <figcaption className="ui-try-caption">Try it: press and drag toward a side to tilt the web, or use the arrow keys, and roll all four bugs into the holes in the middle.</figcaption>
    </figure>
  );
}
