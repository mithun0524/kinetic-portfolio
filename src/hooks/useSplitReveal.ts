import { useRef, type RefObject } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '../lib/gsap'
import { splitText, type SplitType } from '../lib/splitText'

interface Options {
  type?: SplitType
  stagger?: number
  duration?: number
  y?: number
  /** ScrollTrigger start position, e.g. "top 80%". */
  start?: string
  /** Delay before the reveal fires (used for hero on load). */
  delay?: number
  /** Scrub the reveal to scroll instead of playing once. */
  scrub?: boolean
}

/**
 * Split an element's text and reveal it (char or word) on scroll.
 * Waits for fonts so split positions are correct, guards reduced-motion,
 * and reverts the split on cleanup.
 */
export function useSplitReveal<T extends HTMLElement>(options: Options = {}) {
  const ref = useRef<T>(null)
  const {
    type = 'chars',
    stagger = 0.02,
    duration = 0.9,
    y = 110,
    start = 'top 85%',
    delay = 0,
    scrub = false,
  } = options

  useGSAP(
    () => {
      const el = ref.current
      if (!el) return

      if (prefersReducedMotion()) {
        gsap.set(el, { opacity: 1 })
        return
      }

      let cleanup = () => {}

      document.fonts.ready.then(() => {
        const split = splitText(el, type)
        const targets = type === 'chars' ? split.chars : split.words
        gsap.set(el, { opacity: 1 })

        gsap.from(targets, {
          yPercent: y,
          opacity: 0,
          rotateX: -40,
          transformOrigin: '50% 100%',
          duration,
          delay,
          ease: scrub ? 'none' : 'power4.out',
          stagger,
          scrollTrigger: {
            trigger: el,
            start,
            ...(scrub
              ? { end: 'top 40%', scrub: 1 as const }
              : { toggleActions: 'play none none reverse' }),
          },
        })

        cleanup = split.revert
      })

      return () => cleanup()
    },
    { scope: ref }
  )

  return ref as RefObject<T>
}
