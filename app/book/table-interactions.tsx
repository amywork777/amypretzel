"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ThreeEvent } from "@react-three/fiber";

type TableValues = {
  coffeeTipped: boolean;
  coffeeSpilled: boolean;
  resetVersion: number;
};

export function useTableState() {
  const [values, setValues] = useState<TableValues>({ coffeeTipped: false, coffeeSpilled: false, resetVersion: 0 });
  const setCoffee = useCallback((coffeeTipped: boolean) => setValues(v => ({ ...v, coffeeTipped })), []);
  const spillCoffee = useCallback(() => setValues(v => v.coffeeSpilled ? v : { ...v, coffeeSpilled: true }), []);
  const reset = useCallback(() => setValues(v => ({ coffeeTipped: false, coffeeSpilled: false, resetVersion: v.resetVersion + 1 })), []);
  return { ...values, setCoffee, spillCoffee, reset };
}

export type TableState = ReturnType<typeof useTableState>;
export type DraggingChange = (dragging: boolean) => void;

// Window listeners keep a grabbed prop attached to the gesture outside its mesh.
// A single primary pointer owns it; cancellation and unmount always free orbit.
export function usePropGesture({ onDraggingChange, onStart, onMove, onEnd, onCancel, resetVersion }: {
  onDraggingChange: DraggingChange;
  onStart: () => void;
  onMove: (dx: number, dy: number) => void;
  onEnd: (moved: boolean, dx: number, dy: number) => void;
  onCancel: () => void;
  resetVersion: number;
}) {
  const cancel = useRef<(() => void) | null>(null);
  useEffect(() => () => cancel.current?.(), [resetVersion]);

  return (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    if (!event.nativeEvent.isPrimary || event.button !== 0) return;
    // The canvas uses touch-action: none; R3F pointer listeners are passive.
    cancel.current?.();
    const { clientX, clientY, pointerId } = event.nativeEvent;
    let dx = 0, dy = 0, moved = false;
    onDraggingChange(true);
    onStart();
    const move = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      dx = e.clientX - clientX;
      dy = e.clientY - clientY;
      moved ||= Math.hypot(dx, dy) > 7;
      onMove(dx, dy);
    };
    const clean = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", pointerCancel);
      window.removeEventListener("blur", abort);
      cancel.current = null;
      onDraggingChange(false);
    };
    const up = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      clean();
      onEnd(moved, dx, dy);
    };
    const abort = () => { clean(); onCancel(); };
    const pointerCancel = (e: PointerEvent) => { if (e.pointerId === pointerId) abort(); };
    cancel.current = abort;
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", pointerCancel);
    window.addEventListener("blur", abort);
  };
}
