import { useRef } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '../lib/gsap'
import styles from './Cursor.module.css'

/**
 * Custom cursor: a lagging ring that follows the pointer and grows
 * when hovering interactive elements ([data-cursor="grow"]).
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (prefersReducedMotion()) return
    const dotEl = dot.current!
    const ringEl = ring.current!

    const dotX = gsap.quickTo(dotEl, 'x', { duration: 0.15, ease: 'power3' })
    const dotY = gsap.quickTo(dotEl, 'y', { duration: 0.15, ease: 'power3' })
    const ringX = gsap.quickTo(ringEl, 'x', { duration: 0.5, ease: 'power3' })
    const ringY = gsap.quickTo(ringEl, 'y', { duration: 0.5, ease: 'power3' })

    const move = (e: PointerEvent) => {
      dotX(e.clientX)
      dotY(e.clientY)
      ringX(e.clientX)
      ringY(e.clientY)
    }

    const grow = (e: Event) => {
      const t = e.target as HTMLElement
      if (t.closest('[data-cursor="grow"]')) {
        gsap.to(ringEl, { scale: 2.6, duration: 0.4, ease: 'power3' })
      }
    }
    const shrink = () =>
      gsap.to(ringEl, { scale: 1, duration: 0.4, ease: 'power3' })

    window.addEventListener('pointermove', move)
    document.addEventListener('pointerover', grow)
    document.addEventListener('pointerout', shrink)
    return () => {
      window.removeEventListener('pointermove', move)
      document.removeEventListener('pointerover', grow)
      document.removeEventListener('pointerout', shrink)
    }
  })

  return (
    <>
      <div ref={ring} className={`custom-cursor ${styles.ring}`} aria-hidden />
      <div ref={dot} className={`custom-cursor ${styles.dot}`} aria-hidden />
    </>
  )
}
