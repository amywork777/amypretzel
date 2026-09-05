"use client";

import { OPEN_BOOK_EVENT } from "./overlay";
import { preloadBook } from "./load-book";

export default function ReadTheBookLink({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={className ?? "link meta"}
      onPointerEnter={preloadBook}
      onFocus={preloadBook}
      onClick={() => window.dispatchEvent(new Event(OPEN_BOOK_EVENT))}
    >
      read the book
    </button>
  );
}
