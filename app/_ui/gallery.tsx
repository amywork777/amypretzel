"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

export type GalleryImage = { src: string; width: number; height: number; alt: string };

/* A project's photos after the text. A few stack at the column's width; four
   or more sit in two columns at their own shapes (Amy, 2026-11-16: "if there
   are too many pics put them in a grid"), so a long page of process boards
   becomes something to scan rather than scroll. Any photo opens full size,
   since a board's small text needs the room: arrows step through, Escape
   or a click outside closes. */
export function Gallery({ images, title }: { images: GalleryImage[]; title: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState<number | null>(null);
  const grid = images.length >= 4;

  const show = useCallback((i: number) => {
    setOpen(i);
    const d = dialog.current;
    if (d && !d.open) d.showModal();
  }, []);
  const close = useCallback(() => dialog.current?.close(), []);
  const step = useCallback((by: number) => setOpen(i => (i === null ? i : (i + by + images.length) % images.length)), [images.length]);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    const onClose = () => setOpen(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
    };
    d.addEventListener("close", onClose);
    d.addEventListener("keydown", onKey);
    return () => { d.removeEventListener("close", onClose); d.removeEventListener("keydown", onKey); };
  }, [step]);

  const current = open === null ? null : images[open];

  return (
    <section className={grid ? "ui-gallery ui-gallery--grid" : "ui-gallery"} aria-label={`${title}, photos`}>
      {images.map((img, i) => (
        <button key={img.src} type="button" className="ui-gallery-item" onClick={() => show(i)} aria-label={`Open ${img.alt} full size`}>
          <Image src={img.src} alt={img.alt} width={img.width} height={img.height} sizes={grid ? "(min-width: 860px) 380px, 50vw" : "(min-width: 860px) 764px, 100vw"} />
        </button>
      ))}
      <dialog
        ref={dialog}
        className="ui-lightbox"
        aria-label={current ? current.alt : `${title}, photo`}
        onClick={e => { if (e.target === e.currentTarget) close(); }}
      >
        {current && (
          <>
            <Image key={current.src} src={current.src} alt={current.alt} width={current.width} height={current.height} sizes="100vw" className="ui-lightbox-img" onClick={close} />
            <div className="ui-lightbox-bar">
              <span className="ui-lightbox-count" aria-live="polite">{(open ?? 0) + 1} / {images.length}</span>
              {images.length > 1 && (<>
                <button type="button" className="ui-try-pill" onClick={() => step(-1)}>Previous</button>
                <button type="button" className="ui-try-pill" onClick={() => step(1)}>Next</button>
              </>)}
              <button type="button" className="ui-try-pill" onClick={close} autoFocus>Close</button>
            </div>
          </>
        )}
      </dialog>
    </section>
  );
}
