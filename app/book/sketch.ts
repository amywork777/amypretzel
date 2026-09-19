import { Vector3 } from "three";
import type { CanvasTexture } from "three";

// Shared state for the pencil: whether it is in hand, where the pointer is on
// the table, and the one page texture that strokes are drawn onto. Module
// scope, not React state, because the frame loop and pointer handlers read it
// every frame and the book's pages are rendered from a different subtree.
export const sketch = {
  held: false,
  drawing: false,
  hasPointer: false,
  pointer: new Vector3(),
  texture: null as CanvasTexture | null,
  ctx: null as CanvasRenderingContext2D | null,
  width: 900,
  height: 1200,
  last: null as { x: number; y: number } | null,
  strokes: 0,
  repaint: null as (() => void) | null,
};

// u, v are the page's texture coordinates (v = 1 at the top of the page).
export function sketchAt(u: number, v: number) {
  const { ctx, texture } = sketch;
  if (!ctx || !texture) return;
  const x = u * sketch.width;
  const y = (1 - v) * sketch.height;
  const last = sketch.last;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(44,44,44,.86)";
  ctx.lineWidth = 3.4;
  ctx.beginPath();
  if (last) {
    const dx = x - last.x, dy = y - last.y;
    if (dx * dx + dy * dy < 1) { ctx.restore(); return; }
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(x, y);
  } else {
    ctx.moveTo(x, y);
    ctx.lineTo(x + .1, y + .1);
  }
  ctx.stroke();
  ctx.restore();
  sketch.last = { x, y };
  sketch.strokes += 1;
  texture.needsUpdate = true;
}

export function clearSketch() {
  sketch.repaint?.();
  sketch.strokes = 0;
  sketch.last = null;
  if (sketch.texture) sketch.texture.needsUpdate = true;
}
