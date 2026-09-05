"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";

const StoryBook = dynamic(() => import("./book"), { ssr: false, loading: () => <p className="book-loading" role="status">Opening the book…</p> });

const SEEN_KEY = "amypretzel:book-seen";
export const OPEN_BOOK_EVENT = "amypretzel:open-book";

// localStorage throws in some privacy modes; a visitor with blocked
// storage should just see the book each visit, never a crash
function readSeen() {
  try {
    return window.localStorage.getItem(SEEN_KEY);
  } catch {
    return null;
  }
}

function writeSeen() {
  try {
    window.localStorage.setItem(SEEN_KEY, "1");
  } catch {
    // ignore
  }
}

export default function BookOverlay() {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 620px)").matches;
    const hash = window.location.hash;
    // don't hijack deep links to other anchors (/#software etc.)
    const autoOpen = desktop && !readSeen() && (hash === "" || hash === "#book");
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
    writeSeen();
    if (window.location.hash === "#book") {
      history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search
      );
    }
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
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

  if (!open) return null;

  return (
    <div ref={dialogRef} className="book-overlay" role="dialog" aria-modal="true" aria-label="Amy's making diary">
      <div className="book-overlay-heading">Amy Zhou<span>A little book of making</span></div>
      <button type="button" className="book-overlay-enter" onClick={close}>
        Enter site ↗
      </button>
      <StoryBook onExit={close} />
    </div>
  );
}
