import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, useGSAP)

export { gsap, ScrollTrigger, useGSAP }

/** Respect user's reduced-motion preference. */
export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Coarse pointer / small screen — used to dial back heavy effects. */
export const isMobile = () =>
  typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches
