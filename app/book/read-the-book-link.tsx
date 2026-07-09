"use client";

import { OPEN_BOOK_EVENT } from "./overlay";

export default function ReadTheBookLink({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={className ?? "link meta"}
      onClick={() => window.dispatchEvent(new Event(OPEN_BOOK_EVENT))}
    >
      read the book
    </button>
  );
}
