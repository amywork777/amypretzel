"use client";

import { useEffect, useRef } from "react";

/* A short demo at the top of a project page: muted, looping and playing on
   its own, like a moving screenshot. With reduced motion it waits, showing
   its poster and controls instead. One with sound always has controls, so
   it can be unmuted. A tall (phone) video is held to the height of the
   screen and centred. It plays only while on screen. A rate above 1 plays it faster (Amy found Smart
   Dropper's launch film slow); browsers keep the voice at its pitch. */
export function LeadVideo({ src, poster, width, height, label, sound, rate, className }: { src: string; poster: string; width: number; height: number; label: string; sound?: boolean; rate?: number; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (rate) { video.defaultPlaybackRate = rate; video.playbackRate = rate; }
    const wait = () => { video.controls = true; };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { wait(); return; }
    // Plays while on screen and pauses off it, so a page of videos doesn't
    // download and run them all at once. One the visitor unmuted is theirs:
    // it keeps going until they pause it.
    const seen = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { if (video.paused && video.muted) video.play().catch(wait); }
      else if (video.muted && !video.paused) video.pause();
    }, { threshold: 0.25 });
    seen.observe(video);
    return () => seen.disconnect();
  }, [rate]);
  return (
    <div className={className ?? (height > width ? "ui-media ui-lead-video ui-lead-video--tall" : "ui-media ui-lead-video")}>
      <video ref={ref} src={src} poster={poster} width={width} height={height} muted loop playsInline preload="metadata" controls={sound} aria-label={label} />
    </div>
  );
}
