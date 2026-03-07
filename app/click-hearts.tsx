"use client";

import { useEffect, useState, useCallback } from "react";

interface Heart {
  id: number;
  x: number;
  y: number;
  emoji: string;
}

const hearts = ["♥", "♡", "✿", "⋆"];

export default function ClickHearts() {
  const [floats, setFloats] = useState<Heart[]>([]);

  const spawn = useCallback((e: MouseEvent) => {
    const id = Date.now() + Math.random();
    const emoji = hearts[Math.floor(Math.random() * hearts.length)];
    setFloats((prev) => [...prev, { id, x: e.clientX, y: e.clientY, emoji }]);
    setTimeout(() => {
      setFloats((prev) => prev.filter((h) => h.id !== id));
    }, 1000);
  }, []);

  useEffect(() => {
    window.addEventListener("click", spawn);
    return () => window.removeEventListener("click", spawn);
  }, [spawn]);

  return (
    <>
      {floats.map((h) => (
        <div
          key={h.id}
          className="heart-float"
          style={{ left: h.x - 8, top: h.y - 8, color: "#e0a0c0" }}
        >
          {h.emoji}
        </div>
      ))}
    </>
  );
}
