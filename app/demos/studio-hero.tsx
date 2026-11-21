"use client";

import Image from "next/image";
import "./studio.css";

/* The Studio page's hero: the whole app at work, set on the media surface the
   way a product page shows an app. hero.webp is one real moment from an
   isolated Studio on 2026-11-21: its motor mount example's assembly (plate,
   NEMA 17, four M3 screws) beside the chat's fit check. The build film moves
   below the text; the anatomy and the rest follow it. */
export default function StudioHero() {
  return (
    <figure className="st st-wide st-hero">
      <div className="st-hero-stage">
        <Image
          src="/software/studio/hero.webp" width={2400} height={1500} priority
          sizes="(min-width: 1296px) 1100px, 92vw"
          alt="Studio: the chat beside a motor mount assembly, with its fit check. The plate fits the motor and its four screws with no interference."
        />
      </div>
    </figure>
  );
}
