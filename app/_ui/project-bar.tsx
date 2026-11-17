"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type Place = { href: string; title: string };

/* A slim bar that slides down once a project page's title has scrolled away,
   so a long page still says where you are: the pretzel home, the group the
   project sits in (a link back to it, opened) and the project's name, then
   Previous and Next. It steps aside again near the top, where the header is,
   and at the foot, where the bigger Previous and Next and the sign-off take over. */
export function ProjectBar({ group, title, prev, next }: { group?: Place; title: string; prev: Place; next: Place }) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const intro = document.querySelector(".ui-intro");
    if (!intro) return;
    const ends = [...document.querySelectorAll(".ui-prev-next, .ui-footer")];
    const visibleEnds = new Set<Element>();
    let pastTitle = false;
    const observer = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (e.target === intro) pastTitle = !e.isIntersecting && e.boundingClientRect.top < 0;
        else if (e.isIntersecting) visibleEnds.add(e.target);
        else visibleEnds.delete(e.target);
      }
      setShown(pastTitle && visibleEnds.size === 0);
    });
    observer.observe(intro);
    ends.forEach(el => observer.observe(el));
    return () => { observer.disconnect(); setShown(false); };
  }, [title]);

  return (
    <div className="ui-project-bar" data-shown={shown || undefined} inert={!shown}>
      <nav className="ui-column ui-column--narrow ui-project-bar-inner" aria-label="This project">
        <Link href="/" className="ui-project-bar-mark" aria-label="Amy Zhou, home"><Image src="/pretzel.png" alt="" width={192} height={192} sizes="28px" /></Link>
        <p className="ui-project-bar-place">
          {group && <><a href={group.href}>{group.title}</a><span aria-hidden="true">/</span></>}
          <span className="ui-project-bar-title">{title}</span>
        </p>
        <span className="ui-project-bar-steps">
          <Link href={prev.href} title={prev.title}>Previous</Link>
          <Link href={next.href} title={next.title}>Next</Link>
        </span>
      </nav>
    </div>
  );
}
