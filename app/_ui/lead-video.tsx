"use client";

import { useEffect, useRef } from "react";

/* A short demo at the top of a project page: muted, looping and playing on
   its own, like a moving screenshot. With reduced motion it waits, showing
   its poster and controls instead. One with sound always has controls, so
   it can be unmuted. A tall (phone) video is held to the height of the
   screen and centred. */
export function LeadVideo({ src, poster, width, height, label, sound, className }: { src: string; poster: string; width: number; height: number; label: string; sound?: boolean; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const wait = () => { video.controls = true; };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) wait();
    else video.play().catch(wait);
  }, []);
  return (
    <div className={className ?? (height > width ? "ui-media ui-lead-video ui-lead-video--tall" : "ui-media ui-lead-video")}>
      <video ref={ref} src={src} poster={poster} width={width} height={height} muted loop playsInline preload="metadata" controls={sound} aria-label={label} />
    </div>
  );
}
