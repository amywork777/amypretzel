"use client";

import { useEffect, useState } from "react";

type Kind = "objects" | "software";

/* The two pills in the opening sentence. They used to jump to groups that sit
   right under them, so pressing one did nothing you could see (Amy,
   2026-11-16). Now each is a filter: "objects" shows only the physical
   things, across every group and the earlier studies; "software" only the
   software. Pressing it again, or the other one, changes or clears it. The
   rows are filtered in CSS from their links (/portfolio/ is an object,
   /software/ is software), so the list itself never changes; filtering
   opens every group so the matches show, and clearing puts each group back
   the way it was. */
export function KindFilter({ kind, children }: { kind: Kind; children: string }) {
  const [shown, setShown] = useState<Kind | null>(null);

  // Both pills share one state through the work list's data attribute.
  useEffect(() => {
    const work = document.getElementById("work");
    if (!work) return;
    const sync = () => setShown((work.dataset.show as Kind | undefined) ?? null);
    const watch = new MutationObserver(sync);
    watch.observe(work, { attributes: true, attributeFilter: ["data-show"] });
    return () => watch.disconnect();
  }, []);

  return (
    <button type="button" className="ui-link home-kind" aria-pressed={shown === kind} aria-controls="work" title={shown === kind ? "Show everything" : `Show only ${children}`} onClick={() => toggle(kind)}>
      {children}
    </button>
  );
}

const before = new WeakMap<HTMLDetailsElement, boolean>();

function toggle(kind: Kind) {
  const work = document.getElementById("work");
  if (!work) return;
  const next = work.dataset.show === kind ? null : kind;
  const folds = [...work.querySelectorAll<HTMLDetailsElement>("details")];
  if (next) {
    // Remember how each group was before the first filter, then open them all.
    if (!work.dataset.show) folds.forEach(d => before.set(d, d.open));
    folds.forEach(d => { d.open = true; });
    work.dataset.show = next;
    // Bring the list up into view if it starts below the screen.
    const top = work.getBoundingClientRect().top;
    if (top > window.innerHeight * 0.7) work.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  } else {
    delete work.dataset.show;
    folds.forEach(d => { d.open = before.get(d) ?? false; });
  }
}
