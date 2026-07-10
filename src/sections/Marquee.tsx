import { useRef } from 'react'
import { gsap, useGSAP, ScrollTrigger, prefersReducedMotion } from '../lib/gsap'
import styles from './Marquee.module.css'

const WORDS = ['AI AGENTS', 'LLMs', 'FULL-STACK', 'DEV TOOLS', 'REACT', 'PYTHON', 'MACHINE LEARNING']

/**
 * Infinite ticker whose base speed is constant but gets a velocity boost
 * (and direction flip) from scroll — a classic award-site touch.
 */
export function Marquee() {
  const track = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const el = track.current!
    // seamless loop: content is duplicated, wrap over half width
    const half = el.scrollWidth / 2
    const wrap = gsap.utils.wrap(-half, 0)
    const xSet = gsap.quickSetter(el, 'x', 'px')
    let x = 0
    let direction = -1
    const baseSpeed = 0.6

    if (prefersReducedMotion()) return

    const tick = () => {
      x += baseSpeed * direction * boost.current
      xSet(wrap(x))
    }
    const boost = { current: 1 }
    gsap.ticker.add(tick)

    const st = ScrollTrigger.create({
      onUpdate: (self) => {
        direction = self.direction === 1 ? -1 : 1
        boost.current = 1 + Math.min(Math.abs(self.getVelocity() / 200), 6)
        gsap.to(boost, { current: 1, duration: 0.8, ease: 'power2.out', overwrite: true })
      },
    })

    return () => {
      gsap.ticker.remove(tick)
      st.kill()
    }
  }, { scope: track })

  const items = [...WORDS, ...WORDS]
  return (
    <div className={styles.wrap} aria-hidden>
      <div ref={track} className={styles.track}>
        {items.map((w, i) => (
          <span key={i} className={`display ${styles.item}`}>
            {w}
            <span className={styles.star}>✳</span>
          </span>
        ))}
      </div>
    </div>
  )
}
