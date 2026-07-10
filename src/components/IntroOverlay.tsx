import { useRef, useState } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '../lib/gsap'
import styles from './IntroOverlay.module.css'

/**
 * Page-load intro: counter 0 -> 100, then the panel wipes up to reveal
 * the site. Calls onDone when finished (hero waits for this to animate).
 */
export function IntroOverlay({ onDone }: { onDone: () => void }) {
  const root = useRef<HTMLDivElement>(null)
  const count = useRef<HTMLSpanElement>(null)
  const [gone, setGone] = useState(false)

  useGSAP(() => {
    if (prefersReducedMotion()) {
      setGone(true)
      onDone()
      return
    }

    const counter = { v: 0 }
    const tl = gsap.timeline({
      onComplete: () => {
        setGone(true)
        onDone()
      },
    })

    tl.to(counter, {
      v: 100,
      duration: 2,
      ease: 'steps(7)',
      onUpdate: () => {
        if (count.current) count.current.textContent = String(Math.round(counter.v))
      },
    })
      .to(`.${styles.bar}`, { scaleX: 1, duration: 1.4, ease: 'power3.inOut' }, 0)
      .to(root.current, {
        yPercent: -100,
        duration: 1,
        ease: 'power4.inOut',
        delay: 0.1,
      })
  })

  if (gone) return null

  return (
    <div ref={root} className={styles.overlay}>
      <div className={styles.inner}>
        <span className={styles.label}>Loading portfolio</span>
        <div className={`chrome-text ${styles.num}`}>
          <span ref={count}>0</span>
          <span className={styles.pct}>%</span>
        </div>
        <div className={styles.track}>
          <div className={styles.bar} />
        </div>
      </div>
    </div>
  )
}
