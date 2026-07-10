import { useRef } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '../lib/gsap'
import { useMagnetic } from '../hooks/useMagnetic'
import styles from './Contact.module.css'

/** Contact: masked outro headline + magnetic link + footer meta. */
export function Contact() {
  const root = useRef<HTMLElement>(null)
  const l1 = useRef<HTMLSpanElement>(null)
  const l2 = useRef<HTMLSpanElement>(null)
  const btn = useMagnetic<HTMLAnchorElement>(0.5)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.from([l1.current, l2.current], {
        yPercent: 115,
        duration: 1,
        ease: 'power4.out',
        stagger: 0.12,
        scrollTrigger: {
          trigger: root.current,
          start: 'top 75%',
          toggleActions: 'play none none reverse',
        },
      })
    },
    { scope: root }
  )

  return (
    <footer ref={root} className={`section ${styles.contact}`} id="contact">
      <span className="eyebrow">( Let&apos;s build )</span>

      <h2 className={`display ${styles.line}`}>
        <span className={styles.lineMask}>
          <span ref={l1} className={styles.lineInner}>
            Have something that
          </span>
        </span>
        <span className={styles.lineMask}>
          <span ref={l2} className={styles.lineInner}>
            should <span className="chrome-text">move?</span>
          </span>
        </span>
      </h2>

      <a
        ref={btn}
        href="https://github.com/mithun0524"
        target="_blank"
        rel="noreferrer"
        className={styles.cta}
        data-cursor="grow"
      >
        <span>github.com/mithun0524</span>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M4 16L16 4M16 4H6M16 4v10" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </a>

      <div className={styles.meta}>
        <span>© 2026 Mithun Chavan A — Bangalore, India</span>
        <div className={styles.socials}>
          <a href="https://github.com/mithun0524" target="_blank" rel="noreferrer" data-cursor="grow">
            GitHub
          </a>
          <a href="https://mithundotdev.vercel.app" target="_blank" rel="noreferrer" data-cursor="grow">
            mithun.dev
          </a>
          <a href="https://crayon-umber.vercel.app" target="_blank" rel="noreferrer" data-cursor="grow">
            Crayon
          </a>
        </div>
      </div>
    </footer>
  )
}
