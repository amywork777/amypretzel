"use client";

import { useEffect, useRef } from "react";

/* A short demo at the top of a project page: muted, looping and playing on
   its own, like a moving screenshot. With reduced motion it waits, showing
   its poster and controls instead. One with sound always has controls, so
   it can be unmuted. A tall (phone) video is held to the height of the
   screen and centred. A rate above 1 plays it faster (Amy found Smart
   Dropper's launch film slow); browsers keep the voice at its pitch. */
export function LeadVideo({ src, poster, width, height, label, sound, rate, className }: { src: string; poster: string; width: number; height: number; label: string; sound?: boolean; rate?: number; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (rate) { video.defaultPlaybackRate = rate; video.playbackRate = rate; }
    const wait = () => { video.controls = true; };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) wait();
    else video.play().catch(wait);
  }, [rate]);
  return (
    <div className={className ?? (height > width ? "ui-media ui-lead-video ui-lead-video--tall" : "ui-media ui-lead-video")}>
      <video ref={ref} src={src} poster={poster} width={width} height={height} muted loop playsInline preload="metadata" controls={sound} aria-label={label} />
    </div>
  );
}
