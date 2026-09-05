"use client";

import { preloadBook } from "./load-book";

export default function BookNavLink() {
  // A native fragment also works from project detail routes.
  // eslint-disable-next-line @next/next/no-html-link-for-pages
  return <a href="/#book" onPointerEnter={preloadBook} onFocus={preloadBook}>Book</a>;
}
