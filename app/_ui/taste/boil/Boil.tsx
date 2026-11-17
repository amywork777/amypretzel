"use client";
// Copied from ~/code/taste/kit/boil/Boil.tsx (Amy's taste kit).
// The boil: a line that redraws itself a few times a second, like a hand-drawn animation loop.
// Idea credited to Miguel de la Garza's vizcom-ideas head and marks.
import { useEffect, useState, type SVGProps } from 'react'
import { useReducedMotion } from '../motion'
import { boilPoints, toPath, type Pt } from './boilPath'

// Cycling a few fixed frames reads as hand-drawn; continuous noise reads as broken video.
export function useBoilFrame(fps = 8, frames = 3): number {
  const reduced = useReducedMotion()
  const [frame, setFrame] = useState(0)
  useEffect(() => {
    if (reduced) return
    const id = setInterval(() => setFrame((n) => (n + 1) % frames), 1000 / fps)
    return () => clearInterval(id)
  }, [fps, frames, reduced])
  // Reduced motion holds the first frame (derived here, not set in the effect, for this repo's lint).
  return reduced ? 0 : frame
}

/**
 * Mount once per page. Small marks opt in with `boil` (or `filter: url(#taste-boil)`).
 * Keep it off large areas: a full-viewport turbulence filter ran at ~4 fps in Safari, so long lines use `BoilLine`.
 */
export function BoilDefs({ id = 'taste-boil', scale = 2.2 }: { id?: string; scale?: number }) {
  const frame = useBoilFrame()
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <filter id={id}>
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={2} seed={frame + 1} />
        <feDisplacementMap in="SourceGraphic" scale={scale} />
      </filter>
    </svg>
  )
}

/** A long hand-drawn line whose geometry boils, which stays cheap at any length. */
export function BoilLine({
  points,
  amp = 1.2,
  fps = 8,
  closed,
  ...rest
}: { points: Pt[]; amp?: number; fps?: number; closed?: boolean } & Omit<SVGProps<SVGPathElement>, 'points'>) {
  const frame = useBoilFrame(fps)
  return (
    <path
      d={toPath(boilPoints(points, amp, frame + 1), closed)}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    />
  )
}
