"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { clearSketch, sketch } from "./sketch";

export const PRETZEL_COUNT = 9;

type TableValues = {
  coffeeTipped: boolean;
  coffeeSpilled: boolean;
  cookiesTaken: boolean[];
  pencilHeld: boolean;
  resetVersion: number;
};

export function useTableState() {
  const [values, setValues] = useState<TableValues>({ coffeeTipped: false, coffeeSpilled: false, cookiesTaken: Array<boolean>(PRETZEL_COUNT).fill(false), pencilHeld: false, resetVersion: 0 });
  const setCoffee = useCallback((coffeeTipped: boolean) => setValues(v => ({ ...v, coffeeTipped })), []);
  const spillCoffee = useCallback(() => setValues(v => v.coffeeSpilled ? v : { ...v, coffeeSpilled: true }), []);
  const setCookie = useCallback((index: number, taken: boolean) => setValues(v => ({ ...v, cookiesTaken: v.cookiesTaken.map((value, i) => i === index ? taken : value) })), []);
  const setPencil = useCallback((pencilHeld: boolean) => setValues(v => ({ ...v, pencilHeld })), []);
  const reset = useCallback(() => { clearSketch(); setValues(v => ({ coffeeTipped: false, coffeeSpilled: false, cookiesTaken: Array<boolean>(PRETZEL_COUNT).fill(false), pencilHeld: false, resetVersion: v.resetVersion + 1 })); }, []);
  return { ...values, setCoffee, spillCoffee, setCookie, setPencil, reset };
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
    if (sketch.held) return;
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

export function TableActions({ table }: { table: TableState }) {
  const count = table.cookiesTaken.filter(Boolean).length;
  return <details className="table-actions">
    <summary>Table</summary>
    <div className="table-actions-panel">
      <p>Tap the cup to tip it. Tap a pretzel to take it off the pile; tap it again to put it back. Pick up the pencil and draw on the last page.</p>
      <button type="button" onClick={() => table.setPencil(!table.pencilHeld)}>{table.pencilHeld ? "Put the pencil down" : "Pick up the pencil"}</button>
      <button type="button" onClick={() => table.setCoffee(!table.coffeeTipped)}>{table.coffeeTipped ? "Stand cup up" : "Tip coffee"}</button>
      <div className="flower-actions">
        <button type="button" disabled={count === PRETZEL_COUNT} onClick={() => table.setCookie(table.cookiesTaken.lastIndexOf(false), true)}>Take a pretzel</button>
        <button type="button" disabled={count === 0} onClick={() => table.setCookie(table.cookiesTaken.indexOf(true), false)}>Put one back</button>
      </div>
      <p className="table-status" role="status">{table.coffeeSpilled ? "Coffee spilled" : "Coffee full"} · {count} of {PRETZEL_COUNT} pretzels taken</p>
      <button type="button" className="table-reset" onClick={table.reset}>Reset table</button>
    </div>
  </details>;
}
