import { Vector3 } from "three";
import type { CanvasTexture, Object3D } from "three";

type Surface = {
  ctx: CanvasRenderingContext2D;
  texture: CanvasTexture;
  repaint: () => void;
};

// Shared state for the pencil: whether it is in hand, where the pointer is on
// the table, and the drawable pages. Module scope, not React state, because
// the frame loop and the pointer handlers read it every frame and the book's
// pages are rendered from a different subtree.
export const sketch = {
  held: false,
  drawing: false,
  hasPointer: false,
  pointer: new Vector3(),
  // One entry per blank page; the final spread has a left and a right.
  surfaces: new Map<string, Surface>(),
  meshes: [] as Object3D[],
  width: 900,
  height: 1200,
  last: null as { id: string; x: number; y: number } | null,
};

export function registerSurface(id: string, surface: Surface) {
  sketch.surfaces.set(id, surface);
}

export function releaseSurface(id: string, texture: CanvasTexture) {
  if (sketch.surfaces.get(id)?.texture === texture) sketch.surfaces.delete(id);
}

export function registerMesh(mesh: Object3D) {
  if (!sketch.meshes.includes(mesh)) sketch.meshes.push(mesh);
  return () => {
    const i = sketch.meshes.indexOf(mesh);
    if (i >= 0) sketch.meshes.splice(i, 1);
  };
}

// u, v are the page's texture coordinates (v = 1 at the top of the page).
export function sketchAt(id: string, u: number, v: number) {
  const surface = sketch.surfaces.get(id);
  if (!surface) return;
  const { ctx, texture } = surface;
  const x = u * sketch.width;
  const y = (1 - v) * sketch.height;
  // A stroke belongs to one page; crossing the gutter starts a new one.
  const last = sketch.last && sketch.last.id === id ? sketch.last : null;
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
  sketch.last = { id, x, y };
  texture.needsUpdate = true;
}

export function clearSketch() {
  for (const surface of sketch.surfaces.values()) {
    surface.repaint();
    surface.texture.needsUpdate = true;
  }
  sketch.last = null;
}
