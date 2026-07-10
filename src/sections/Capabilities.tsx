import { useRef } from 'react'
import { gsap, useGSAP, prefersReducedMotion, isMobile } from '../lib/gsap'
import { stats, capabilities } from '../data/capabilities'
import styles from './Capabilities.module.css'

/**
 * Capabilities: animated stat counters + a horizontally-scrolling,
 * pinned panel of capability keywords driven by vertical scroll.
 */
// Second row keywords — the supporting toolkit under the headline skills.
const toolkit = [
  'OpenRouter',
  'Ollama',
  'Tree-sitter',
  'SQLite',
  'Tailwind',
  'Firebase',
  'WebSockets',
  'Vite',
  'Node.js',
  'REST APIs',
]

export function Capabilities() {
  const section = useRef<HTMLElement>(null)
  const rowA = useRef<HTMLDivElement>(null)
  const rowB = useRef<HTMLDivElement>(null)

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

    // horizontal pinned scroll (desktop, motion allowed): two rows, opposite ways
    if (prefersReducedMotion() || isMobile() || !rowA.current || !rowB.current) return
    const a = rowA.current
    const b = rowB.current
    const amount = a.scrollWidth - window.innerWidth
    if (amount <= 0) return

    // row B is wider than the viewport and pre-shifted left so it can travel right
    const amountB = Math.max(b.scrollWidth - window.innerWidth, amount)
    gsap.set(b, { x: -amountB })

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section.current,
        start: 'top top',
        end: () => `+=${amount * 1.2}`,
        scrub: 1,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    })
    tl.to(a, { x: -amount, ease: 'none' }, 0)
    tl.to(b, { x: 0, ease: 'none' }, 0)
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
        <span className={`eyebrow ${styles.stripLabel}`}>( Capabilities )</span>

        <div ref={rowA} className={styles.panel}>
          {capabilities.map((c, i) => (
            <span key={c} className={`display ${styles.cap}`}>
              <sup className={styles.capNum}>{String(i + 1).padStart(2, '0')}</sup>
              {c}
            </span>
          ))}
        </div>

        <div ref={rowB} className={`${styles.panel} ${styles.panelB}`}>
          {toolkit.map((c) => (
            <span key={c} className={styles.tool}>
              {c}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
