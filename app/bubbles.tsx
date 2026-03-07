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

const BUBBLE_COUNT = 20;

function randomBubble(id: number, viewW: number, viewH: number): Bubble {
  const size = 12 + Math.random() * 38;
  const x = Math.random() * viewW;
  // Mostly bottom half, some in middle
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
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const frameRef = useRef<number>(0);
  const timeRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize bubbles
  useEffect(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    setBubbles(
      Array.from({ length: BUBBLE_COUNT }, (_, i) => randomBubble(i, w, h))
    );
  }, []);

  // Track mouse position
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  // Animation loop
  const animate = useCallback(() => {
    timeRef.current += 1 / 60;
    const t = timeRef.current;
    const mouse = mouseRef.current;
    const w = window.innerWidth;
    const h = window.innerHeight;

    setBubbles((prev) =>
      prev.map((b) => {
        if (b.popped) return b;

        // Rise slowly
        let newY = b.y - b.speedY;

        // Wobble side to side
        const wobble = Math.sin(t * b.wobbleSpeed + b.id * 1.7) * b.wobbleAmp;
        let newX = b.baseX + wobble;

        // React to mouse — push away if close
        const dx = newX - mouse.x;
        const dy = newY - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const repelRadius = 120 + b.size;
        if (dist < repelRadius && dist > 0) {
          const force = (1 - dist / repelRadius) * 3;
          newX += (dx / dist) * force * 15;
          newY += (dy / dist) * force * 10;
        }

        // Reset if floated off top
        if (newY < -b.size * 2) {
          const fresh = randomBubble(b.id, w, h);
          fresh.y = h + fresh.size;
          fresh.baseX = fresh.x;
          return fresh;
        }

        return { ...b, x: newX, y: newY };
      })
    );

    frameRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [animate]);

  // Pop bubble on click
  const popBubble = (id: number) => {
    setBubbles((prev) =>
      prev.map((b) => (b.id === id ? { ...b, popped: true } : b))
    );
    // Respawn after a short delay
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
    <div ref={containerRef} className="absolute inset-0 pointer-events-none">
      {bubbles.map((b) => (
        <div
          key={b.id}
          onClick={() => popBubble(b.id)}
          className="absolute cursor-pointer pointer-events-auto transition-transform duration-100"
          style={{
            left: b.x - b.size / 2,
            top: b.y - b.size / 2,
            width: b.size,
            height: b.size,
            opacity: b.popped ? 0 : b.opacity,
            transform: b.popped ? "scale(1.5)" : "scale(1)",
            transition: b.popped
              ? "opacity 0.3s, transform 0.3s"
              : "opacity 0.1s",
            willChange: "left, top",
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
    </div>
  );
}
