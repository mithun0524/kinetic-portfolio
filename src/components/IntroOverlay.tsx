import { useRef, useState } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '../lib/gsap'
import styles from './IntroOverlay.module.css'

/** A vertical strip of digits for one odometer column. */
function Column({
  refEl,
  count,
}: {
  refEl: React.RefObject<HTMLSpanElement>
  count: number
}) {
  return (
    <span className={styles.col}>
      <span ref={refEl} className={`chrome-text ${styles.strip}`}>
        {Array.from({ length: count + 1 }, (_, i) => (
          <span key={i} className={styles.digit}>
            {i % 10}
          </span>
        ))}
      </span>
    </span>
  )
}

/**
 * Page-load intro: an odometer rolls 0 -> 100 (each digit column slides
 * vertically), then the panel wipes up to reveal the site. onDone fires
 * when finished so the hero can animate in.
 */
export function IntroOverlay({ onDone }: { onDone: () => void }) {
  const root = useRef<HTMLDivElement>(null)
  const hund = useRef<HTMLSpanElement>(null)
  const tens = useRef<HTMLSpanElement>(null)
  const units = useRef<HTMLSpanElement>(null)
  const [gone, setGone] = useState(false)

  useGSAP(() => {
    if (prefersReducedMotion()) {
      setGone(true)
      onDone()
      return
    }

    const setY = (el: HTMLElement | null, em: number) => {
      if (el) el.style.transform = `translateY(${em}em)`
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
      duration: 2.4,
      ease: 'power2.out',
      onUpdate: () => {
        const v = counter.v
        // each column slides up by its running position; units spins fast,
        // tens rolls slowly, hundreds flips once at the end.
        setY(units.current, -v)
        setY(tens.current, -v / 10)
        setY(hund.current, -v / 100)
      },
    })
      .to(`.${styles.bar}`, { scaleX: 1, duration: 1.4, ease: 'power3.inOut' }, 0)
      .to(root.current, {
        yPercent: -100,
        duration: 1,
        ease: 'power4.inOut',
        delay: 0.15,
      })
  })

  if (gone) return null

  return (
    <div ref={root} className={styles.overlay}>
      <div className={styles.inner}>
        <span className={styles.label}>Loading portfolio</span>
        <div className={styles.num}>
          <Column refEl={hund} count={1} />
          <Column refEl={tens} count={10} />
          <Column refEl={units} count={100} />
          <span className={`chrome-text ${styles.pct}`}>%</span>
        </div>
        <div className={styles.track}>
          <div className={styles.bar} />
        </div>
      </div>
    </div>
  )
}
