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
/** boot steps, each unlocking past its % threshold */
const STEPS = [
  { at: 0, label: 'reading repository' },
  { at: 20, label: 'indexing with tree-sitter' },
  { at: 40, label: 'warming up GSAP' },
  { at: 60, label: 'loading projects' },
  { at: 80, label: 'compiling shaders' },
  { at: 95, label: 'waking the site' },
]

export function IntroOverlay({ onDone }: { onDone: () => void }) {
  const root = useRef<HTMLDivElement>(null)
  const hund = useRef<HTMLSpanElement>(null)
  const tens = useRef<HTMLSpanElement>(null)
  const units = useRef<HTMLSpanElement>(null)
  const log = useRef<HTMLUListElement>(null)
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
        // only the units column rolls continuously (fast = reads as motion);
        // tens & hundreds snap to whole digits so they stay crisp mid-spin
        // instead of parking between two glyphs.
        setY(units.current, -v)
        setY(tens.current, -Math.floor(v / 10))
        setY(hund.current, -Math.floor(v / 100))
        // tick the boot log: the last passed step is "running", earlier ones done
        const items = log.current?.children
        if (items) {
          let active = 0
          for (let i = 0; i < STEPS.length; i++) if (v >= STEPS[i].at) active = i
          for (let i = 0; i < items.length; i++) {
            const el = items[i] as HTMLElement
            el.dataset.state = i < active ? 'done' : i === active ? 'run' : 'wait'
          }
        }
      },
    })
      .to(`.${styles.bar}`, { scaleX: 1, duration: 1.4, ease: 'power3.inOut' }, 0)
      .to(root.current, {
        yPercent: -100,
        duration: 1,
        ease: 'power4.inOut',
        delay: 0.15,
        // hero starts revealing as the loader slides up, not after
        onStart: onDone,
      })
  })

  if (gone) return null

  return (
    <div ref={root} className={styles.overlay}>
      <div className={styles.inner}>
        <ul ref={log} className={styles.log} aria-hidden>
          {STEPS.map((s) => (
            <li key={s.label} data-state="wait">
              <span className={styles.tick} />
              {s.label}
            </li>
          ))}
        </ul>
        <span className={styles.label}>Loading experience</span>
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
