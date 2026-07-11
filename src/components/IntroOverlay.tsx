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
  const herby = useRef<HTMLDivElement>(null)
  const eyes = useRef<SVGGElement>(null)
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
      onComplete: () => setGone(true),
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
      // Herby peeks in from the right edge and bobs while it loads
      .fromTo(
        herby.current,
        { xPercent: 120, rotation: 8 },
        { xPercent: 0, rotation: 0, duration: 0.9, ease: 'back.out(1.6)' },
        0.3
      )
      .to(herby.current, { y: -8, duration: 0.7, yoyo: true, repeat: -1, ease: 'sine.inOut' }, 1.1)
      .to(root.current, {
        yPercent: -100,
        duration: 1,
        ease: 'power4.inOut',
        delay: 0.15,
        // hero starts revealing as the loader slides up, not after
        onStart: onDone,
      })

    // steady blink while he waits
    const blink = () => {
      gsap.to(eyes.current, { scaleY: 0.1, transformOrigin: '50% 50%', duration: 0.08, yoyo: true, repeat: 1 })
      gsap.delayedCall(1.8 + Math.random(), blink)
    }
    gsap.delayedCall(1.2, blink)
  })

  if (gone) return null

  return (
    <div ref={root} className={styles.overlay}>
      <div className={styles.inner}>
        <span className={styles.label}>Loading portfolio</span>
        <div ref={herby} className={styles.herby} aria-hidden>
          <svg viewBox="0 0 200 174" width="150" height="130">
            <g fill="#d97757">
              <rect x="8" y="82" width="22" height="34" rx="2" />
              <rect x="170" y="82" width="22" height="34" rx="2" />
              <rect x="62" y="138" width="22" height="30" rx="2" />
              <rect x="116" y="138" width="22" height="30" rx="2" />
              <rect x="28" y="52" width="144" height="90" rx="5" />
            </g>
            <g ref={eyes}>
              <ellipse cx="82" cy="97" rx="11" ry="13" fill="#20140f" />
              <ellipse cx="118" cy="97" rx="11" ry="13" fill="#20140f" />
              <circle cx="85" cy="94" r="3.2" fill="#fff" />
              <circle cx="121" cy="94" r="3.2" fill="#fff" />
            </g>
            <path d="M91 120 Q100 127 109 120" fill="none" stroke="#20140f" strokeWidth="4.5" strokeLinecap="round" />
          </svg>
        </div>
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
