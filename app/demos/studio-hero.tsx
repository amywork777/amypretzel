"use client";

import { Hero } from "./case-study";

/* The Studio page's hero: one real moment from an isolated Studio on
   2026-11-21, its motor mount assembly (plate, NEMA 17, four M3 screws)
   beside the chat's fit check. The build film moves below the text. */
export default function StudioHero() {
  return (
    <Hero
      src="/software/studio/hero.webp" width={2400} height={1500}
      alt="Studio: the chat beside a motor mount assembly, with its fit check. The plate fits the motor and its four screws with no interference."
    />
  );
}
