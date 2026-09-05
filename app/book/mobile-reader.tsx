"use client";

import { useEffect, useRef } from "react";
import { bookChapters } from "./chapters";

const pages = bookChapters.flatMap(chapter => chapter.pages.map(page => ({ ...page, chapter: chapter.title })));

export default function MobileReader({ page, onPageChange, onExplore }: {
  page: number;
  onPageChange: (page: number) => void;
  onExplore: () => void;
}) {
  const article = useRef<HTMLElement>(null);
  const current = pages[page];
  useEffect(() => { article.current?.scrollTo(0, 0); }, [page]);

  return <div className="mobile-book-reader">
    <article ref={article} className="mobile-book-page" aria-labelledby="mobile-page-title">
      <p className="mobile-book-chapter">{current.chapter}</p>
      <h2 id="mobile-page-title">{current.title}</h2>
      <p className="mobile-book-copy">{current.text}</p>
    </article>
    <div className="mobile-book-footer">
      <button type="button" className="mobile-book-explore" onClick={onExplore}>Explore the table</button>
      <nav className="mobile-book-pagination" aria-label="Book pages">
        <button type="button" aria-label="Previous page" disabled={page === 0} onClick={() => onPageChange(page - 1)}>Previous</button>
        <span aria-live="polite">{page + 1} / {pages.length}</span>
        <button type="button" aria-label="Next page" disabled={page === pages.length - 1} onClick={() => onPageChange(page + 1)}>Next</button>
      </nav>
    </div>
  </div>;
}
