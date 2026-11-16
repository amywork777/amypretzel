"use client";

import { useId, useState, type ReactNode } from "react";

/* A thumbnail grid that shows its first row or two and folds the rest away
   behind one pill. CSS decides how many stay visible at each width, so a
   folded grid always ends on a full row. */
export function FoldGrid({ label, total, children }: { label: string; total: number; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="ui-fold" data-open={open || undefined}>
      <div id={id} className="ui-thumb-grid" role="group" aria-label={label}>{children}</div>
      <button type="button" className="ui-button ui-button--pill ui-fold-toggle" aria-expanded={open} aria-controls={id} onClick={() => setOpen(o => !o)}>
        {open ? "Show fewer" : `Show all ${total}`}
      </button>
    </div>
  );
}
