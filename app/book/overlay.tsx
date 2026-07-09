"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";

const StoryBook = dynamic(() => import("./book"), { ssr: false });

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
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="book-overlay" role="dialog" aria-label="Amy's making diary">
      <button type="button" className="book-overlay-enter" onClick={close}>
        enter site →
      </button>
      <StoryBook onExit={close} />
    </div>
  );
}
