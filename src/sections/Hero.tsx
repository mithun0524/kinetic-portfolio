import { useRef } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '../lib/gsap'
import { useSplitReveal } from '../hooks/useSplitReveal'
import { useMagnetic } from '../hooks/useMagnetic'
import styles from './Hero.module.css'

/**
 * Hero: giant name revealed char-by-char after intro, mask-wiped eyebrow,
 * cursor-follow highlight blob, and a magnetic scroll cue.
 */
export function Hero({ ready }: { ready: boolean }) {
  const line1 = useSplitReveal<HTMLHeadingElement>({ delay: 0.1, stagger: 0.03 })
  const line2 = useSplitReveal<HTMLHeadingElement>({ delay: 0.25, stagger: 0.03 })
  const blob = useRef<HTMLDivElement>(null)
  const meta = useRef<HTMLDivElement>(null)
  const cue = useMagnetic<HTMLAnchorElement>(0.6)

  useGSAP(() => {
    if (prefersReducedMotion() || !blob.current) return

    // cursor-follow highlight
    const xTo = gsap.quickTo(blob.current, 'x', { duration: 0.8, ease: 'power3' })
    const yTo = gsap.quickTo(blob.current, 'y', { duration: 0.8, ease: 'power3' })
    const move = (e: PointerEvent) => {
      xTo(e.clientX)
      yTo(e.clientY)
    }
    window.addEventListener('pointermove', move)

    // reveal meta row once intro is done
    if (ready) {
      gsap.from(meta.current, {
        y: 30,
        opacity: 0,
        duration: 1,
        delay: 0.6,
        ease: 'power4.out',
      })
    }
    return () => window.removeEventListener('pointermove', move)
  }, [ready])

  return (
    <header className={styles.hero}>
      <div ref={blob} className={styles.blob} aria-hidden />

      <span className={`eyebrow ${styles.eyebrow}`}>
        AI &amp; Full-Stack Developer
      </span>

      <h1 className={`display ${styles.title}`}>
        <span ref={line1} className={styles.line} style={{ opacity: 0 }}>
          Mithun
        </span>
        <span ref={line2} className={`chrome-text ${styles.line}`} style={{ opacity: 0 }}>
          Chavan
        </span>
      </h1>

      <div ref={meta} className={styles.meta}>
        <p>
          I build AI agents, developer tools and full-stack products — from an
          autonomous terminal coding agent to a browser-based AI code editor and
          adaptive learning platforms.
        </p>
        <a ref={cue} href="#work" className={styles.cue} data-cursor="grow">
          <span>Scroll</span>
          <svg width="14" height="30" viewBox="0 0 14 30" fill="none">
            <path d="M7 0v28M1 22l6 6 6-6" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </a>
      </div>
    </header>
  )
}
