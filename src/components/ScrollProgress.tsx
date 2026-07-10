import { useRef } from 'react'
import { gsap, useGSAP, ScrollTrigger } from '../lib/gsap'
import styles from './ScrollProgress.module.css'

/** Thin top progress bar tied to overall document scroll. */
export function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    gsap.fromTo(
      bar.current,
      { scaleX: 0 },
      {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: document.documentElement,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
        },
      }
    )
    return () => ScrollTrigger.getAll().forEach((t) => t.kill())
  })

  return <div ref={bar} className={`chrome-bar ${styles.bar}`} aria-hidden />
}
