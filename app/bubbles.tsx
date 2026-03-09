"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface Bubble {
  id: number;
  x: number;
  y: number;
  size: number;
  baseX: number;
  baseY: number;
  speedY: number;
  wobbleSpeed: number;
  wobbleAmp: number;
  opacity: number;
  popped: boolean;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

const BUBBLE_COUNT = 20;

function randomBubble(id: number, viewW: number, viewH: number): Bubble {
  const size = 12 + Math.random() * 38;
  const x = Math.random() * viewW;
  const y = viewH * 0.4 + Math.random() * viewH * 0.6;
  return {
    id,
    x,
    y,
    size,
    baseX: x,
    baseY: y,
    speedY: 0.1 + Math.random() * 0.3,
    wobbleSpeed: 0.5 + Math.random() * 1.5,
    wobbleAmp: 5 + Math.random() * 15,
    opacity: 0.3 + Math.random() * 0.45,
    popped: false,
  };
}

export default function Bubbles() {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [popCount, setPopCount] = useState(0);
  const frameRef = useRef<number>(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    setBubbles(
      Array.from({ length: BUBBLE_COUNT }, (_, i) => randomBubble(i, w, h))
    );
  }, []);

  const animate = useCallback(() => {
    timeRef.current += 1 / 60;
    const t = timeRef.current;
    const w = window.innerWidth;
    const h = window.innerHeight;

    setBubbles((prev) =>
      prev.map((b) => {
        if (b.popped) return b;
        let newY = b.y - b.speedY;
        const wobble = Math.sin(t * b.wobbleSpeed + b.id * 1.7) * b.wobbleAmp;
        const newX = b.baseX + wobble;

        if (newY < -b.size * 2) {
          const fresh = randomBubble(b.id, w, h);
          fresh.y = h + fresh.size;
          fresh.baseX = fresh.x;
          return fresh;
        }

        return { ...b, x: newX, y: newY };
      })
    );

    // Animate particles
    setParticles((prev) =>
      prev
        .map((p) => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.15,
          life: p.life - 0.03,
        }))
        .filter((p) => p.life > 0)
    );

    frameRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [animate]);

  const playPop = useCallback(() => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
    } catch {}
  }, []);

  const popBubble = (id: number, bx: number, by: number) => {
    playPop();
    setPopCount((c) => c + 1);

    // Spawn burst particles
    const newParticles: Particle[] = Array.from({ length: 6 }, (_, i) => {
      const angle = (Math.PI * 2 * i) / 6 + Math.random() * 0.5;
      return {
        id: Date.now() + Math.random(),
        x: bx,
        y: by,
        vx: Math.cos(angle) * (2 + Math.random() * 2),
        vy: Math.sin(angle) * (2 + Math.random() * 2) - 1,
        life: 1,
      };
    });
    setParticles((prev) => [...prev, ...newParticles]);

    setBubbles((prev) =>
      prev.map((b) => (b.id === id ? { ...b, popped: true } : b))
    );
    setTimeout(() => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setBubbles((prev) =>
        prev.map((b) => {
          if (b.id !== id) return b;
          const fresh = randomBubble(id, w, h);
          fresh.y = h + fresh.size;
          fresh.baseX = fresh.x;
          return fresh;
        })
      );
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-20 pointer-events-none">
      {bubbles.map((b) => (
        <div
          key={b.id}
          onClick={(e) => {
            e.stopPropagation();
            popBubble(b.id, b.x, b.y);
          }}
          className="absolute pointer-events-auto"
          style={{
            left: b.x - b.size / 2,
            top: b.y - b.size / 2,
            width: b.size,
            height: b.size,
            opacity: b.popped ? 0 : b.opacity,
            transform: b.popped ? "scale(1.8)" : "scale(1)",
            transition: b.popped
              ? "opacity 0.25s, transform 0.25s"
              : "none",
            cursor: "pointer",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/graphics/bubble-large.png"
            alt=""
            width={b.size}
            height={b.size}
            className="w-full h-full"
            draggable={false}
          />
        </div>
      ))}

      {/* Pop particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: p.x - 3,
            top: p.y - 3,
            width: 6,
            height: 6,
            background: "#e0c0d8",
            opacity: p.life,
            transform: `scale(${p.life})`,
            pointerEvents: "none",
          }}
        />
      ))}

      {/* Pop counter */}
      {popCount > 0 && (
        <div className="fixed bottom-3 right-3 pointer-events-none">
          <div className="font-pixel text-[10px] text-[#c0a0b8] bg-white/60 backdrop-blur-sm px-2.5 py-1 rounded-full border border-[#e8d0e0]">
            {popCount} bubble{popCount !== 1 ? "s" : ""} popped
          </div>
        </div>
      )}
    </div>
  );
}
