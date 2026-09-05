"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { loadBook } from "./load-book";
import BookPoster from "./poster";

const StoryBook = dynamic(loadBook, { ssr: false, loading: () => <p className="book-loading" role="status">Opening the book…</p> });

export const OPEN_BOOK_EVENT = "amypretzel:open-book";

export default function BookOverlay() {
  const [open, setOpen] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const handleReady = useCallback(() => setSceneReady(true), []);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 701px)").matches;
    const hash = window.location.hash;
    // don't hijack deep links to other anchors (/#software etc.)
    const autoOpen = desktop && hash === "";
    if (hash === "#book" || autoOpen) {
      // the open decision must run after hydration; the server renders null
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(true);
    }

    const handleOpen = () => setOpen(true);
    const handleHash = () => {
      if (window.location.hash === "#book") setOpen(true);
    };
    window.addEventListener(OPEN_BOOK_EVENT, handleOpen);
    window.addEventListener("hashchange", handleHash);
    return () => {
      window.removeEventListener(OPEN_BOOK_EVENT, handleOpen);
      window.removeEventListener("hashchange", handleHash);
    };
  }, []);

  const close = useCallback(() => {
    if (window.location.hash === "#book") {
      history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search
      );
    }
    setOpen(false);
    setSceneReady(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function trapFocus(event: KeyboardEvent) {
      if (event.key === "Escape") { close(); return; }
      if (event.key !== "Tab") return;
      const elements = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], summary, [tabindex="0"]') ?? []).filter(element => element.getClientRects().length > 0);
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    document.addEventListener("keydown", trapFocus);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", trapFocus);
      previousFocus?.focus();
    };
  }, [open, close]);

  // Focus the dialog on opening; the trap restores the page trigger on closing.
  useEffect(() => {
    if (open) dialogRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div ref={dialogRef} className="book-overlay" data-ready={sceneReady} data-view="table" role="dialog" aria-modal="true" aria-label="Amy's making diary">
      <BookPoster hidden={sceneReady} />
      <div className="book-overlay-heading">Amy Zhou<span>A little book of making</span></div>
      <button type="button" className="book-overlay-enter" onClick={close}>
        Enter site
      </button>
      <StoryBook onExit={close} onReady={handleReady} />
    </div>
  );
}
