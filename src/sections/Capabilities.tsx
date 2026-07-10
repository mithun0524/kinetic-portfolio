import { useRef } from 'react'
import { gsap, useGSAP, prefersReducedMotion, isMobile } from '../lib/gsap'
import { stats, capabilities } from '../data/capabilities'
import styles from './Capabilities.module.css'

/**
 * Capabilities: animated stat counters + a horizontally-scrolling,
 * pinned panel of capability keywords driven by vertical scroll.
 */
export function Capabilities() {
  const section = useRef<HTMLElement>(null)
  const panel = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    // count-up stats
    stats.forEach((s, i) => {
      const node = section.current!.querySelector<HTMLElement>(`[data-stat="${i}"]`)
      if (!node) return
      if (prefersReducedMotion()) {
        node.textContent = String(s.value)
        return
      }
      const obj = { v: 0 }
      gsap.to(obj, {
        v: s.value,
        duration: 1.6,
        ease: 'power2.out',
        scrollTrigger: { trigger: node, start: 'top 90%' },
        onUpdate: () => (node.textContent = String(Math.round(obj.v))),
      })
    })

    // horizontal pinned scroll (desktop, motion allowed)
    if (prefersReducedMotion() || isMobile() || !panel.current) return
    const el = panel.current
    const amount = el.scrollWidth - window.innerWidth
    if (amount <= 0) return

    gsap.to(el, {
      x: -amount,
      ease: 'none',
      scrollTrigger: {
        trigger: section.current,
        start: 'top top',
        end: () => `+=${amount}`,
        scrub: 1,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    })
  }, { scope: section })

  return (
    <section ref={section} className={styles.section} id="capabilities">
      <div className={styles.stats}>
        {stats.map((s, i) => (
          <div key={i} className={styles.stat}>
            <div className={`display ${styles.value}`}>
              <span className="chrome-text" data-stat={i}>
                0
              </span>
              <span className={styles.suffix}>{s.suffix}</span>
            </div>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      <div className={styles.strip}>
        <div ref={panel} className={styles.panel}>
          <span className="eyebrow">( Capabilities )</span>
          {capabilities.map((c) => (
            <span key={c} className={`display ${styles.cap}`}>
              {c}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
