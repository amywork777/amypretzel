"use client";
// Copied from ~/code/taste/kit/motion.ts (Amy's taste kit).
import { useEffect, useState } from 'react'

export type Spring = { stiffness: number; damping: number; mass: number }

// Damping ratios ~0.7 (snappy), ~0.8 (soft) and ~0.46 (toy): UI settles without wobble, toys get a visible bounce.
export const springs = {
  snappy: { stiffness: 520, damping: 32, mass: 1 },
  soft: { stiffness: 260, damping: 26, mass: 1 },
  toy: { stiffness: 380, damping: 18, mass: 1 },
} satisfies Record<string, Spring>

export const durations = { tick: 120, ui: 220, reveal: 420, max: 600 } as const

/** Frame-rate independent lerp toward `target`; `lambda` is how fast, in 1/s. */
export function damp(current: number, target: number, lambda: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * dt))
}

/** Positions of a spring released from 0 toward 1, one sample per `step` ms. */
export function simulateSpring(s: Spring, ms: number, step = 1): number[] {
  let x = 0
  let v = 0
  const out: number[] = []
  const dt = step / 1000
  for (let t = 0; t < ms; t += step) {
    const a = (-s.stiffness * (x - 1) - s.damping * v) / s.mass
    v += a * dt
    x += v * dt
    out.push(x)
  }
  return out
}

const QUERY = '(prefers-reduced-motion: reduce)'

export function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia(QUERY).matches
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(prefersReducedMotion)
  useEffect(() => {
    if (typeof matchMedia !== 'function') return
    const mq = matchMedia(QUERY)
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}
