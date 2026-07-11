import { useRef } from 'react'
import { gsap, useGSAP, prefersReducedMotion, isMobile } from '../lib/gsap'
import { stats, capabilities } from '../data/capabilities'
import styles from './Capabilities.module.css'

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

  // hover-preview refs
  const words = useRef<(HTMLSpanElement | null)[]>([])
  const card = useRef<HTMLDivElement>(null)
  const cardImg = useRef<HTMLImageElement>(null)
  const cardLabel = useRef<HTMLSpanElement>(null)
  const line = useRef<SVGLineElement>(null)
  const active = useRef(-1)
  const xTo = useRef<((v: number) => void) | null>(null)
  const yTo = useRef<((v: number) => void) | null>(null)

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

    if (prefersReducedMotion() || isMobile() || !rowA.current || !rowB.current) return
    const a = rowA.current
    const b = rowB.current
    const amount = a.scrollWidth - window.innerWidth
    if (amount > 0) {
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
    }

    // ---- hover preview: cursor-following card + tether line ----
    xTo.current = gsap.quickTo(card.current, 'x', { duration: 0.35, ease: 'power3' })
    yTo.current = gsap.quickTo(card.current, 'y', { duration: 0.35, ease: 'power3' })

    const onMove = (e: PointerEvent) => {
      if (active.current < 0) return
      xTo.current?.(e.clientX + 26)
      yTo.current?.(e.clientY + 26)
    }
    window.addEventListener('pointermove', onMove)

    const draw = () => {
      if (active.current < 0) return
      const w = words.current[active.current]
      if (!w || !line.current || !card.current) return
      const wr = w.getBoundingClientRect()
      const cr = card.current.getBoundingClientRect()
      line.current.setAttribute('x1', String(wr.left + wr.width / 2))
      line.current.setAttribute('y1', String(wr.top + wr.height / 2))
      line.current.setAttribute('x2', String(cr.left + cr.width / 2))
      line.current.setAttribute('y2', String(cr.top + cr.height / 2))
    }
    gsap.ticker.add(draw)

    return () => {
      window.removeEventListener('pointermove', onMove)
      gsap.ticker.remove(draw)
    }
  }, { scope: section })

  const enter = (i: number, e: React.PointerEvent) => {
    if (prefersReducedMotion() || isMobile()) return
    active.current = i
    if (cardImg.current) cardImg.current.src = capabilities[i].logo
    if (cardLabel.current) cardLabel.current.textContent = capabilities[i].label
    gsap.set(card.current, { x: e.clientX + 26, y: e.clientY + 26 })
    gsap.to([card.current, line.current], { autoAlpha: 1, duration: 0.25 })
    gsap.fromTo(
      cardImg.current,
      { scale: 0.6, rotate: -12, opacity: 0 },
      { scale: 1, rotate: 0, opacity: 1, duration: 0.5, ease: 'back.out(2)' }
    )
  }
  const leave = () => {
    active.current = -1
    gsap.to([card.current, line.current], { autoAlpha: 0, duration: 0.2 })
  }

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

      <div className={styles.strip} data-nofloor>
        <span className={`eyebrow ${styles.stripLabel}`}>( Capabilities )</span>

        <div ref={rowA} className={styles.panel}>
          {capabilities.map((c, i) => (
            <span
              key={c.label}
              ref={(el) => (words.current[i] = el)}
              className={`display ${styles.cap}`}
              onPointerEnter={(e) => enter(i, e)}
              onPointerLeave={leave}
            >
              <sup className={styles.capNum}>{String(i + 1).padStart(2, '0')}</sup>
              {c.label}
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

      {/* cursor-following preview + tether */}
      <svg className={styles.tether}>
        <line ref={line} />
      </svg>
      <div ref={card} className={styles.preview} aria-hidden>
        <img ref={cardImg} className={styles.previewImg} alt="" />
        <span ref={cardLabel} className={styles.previewLabel} />
      </div>
    </section>
  )
}
