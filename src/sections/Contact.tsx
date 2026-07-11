import { useRef, useState } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '../lib/gsap'
import { useMagnetic } from '../hooks/useMagnetic'
import { ContactForm } from '../components/ContactForm'
import { Mascot } from '../components/Mascot'
import styles from './Contact.module.css'

/** Contact: masked outro headline + magnetic link + footer meta. */
export function Contact() {
  const root = useRef<HTMLElement>(null)
  const l1 = useRef<HTMLSpanElement>(null)
  const l2 = useRef<HTMLSpanElement>(null)
  const btn = useMagnetic<HTMLButtonElement>(0.5)
  const lineRef = useRef<HTMLSpanElement>(null)
  const [formOpen, setFormOpen] = useState(false)

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
      // draw the ground line in
      gsap.from(lineRef.current, {
        scaleX: 0,
        duration: 1.1,
        ease: 'power3.inOut',
        scrollTrigger: {
          trigger: lineRef.current,
          start: 'top 90%',
          toggleActions: 'play none none reverse',
        },
      })
    },
    { scope: root }
  )

  return (
    <footer ref={root} className={`section ${styles.contact}`} id="contact">
      <span className="eyebrow">( Let&apos;s build )</span>

      <div className={styles.row}>
        <h2 className={`display ${styles.line}`} data-solid>

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

        {/* ground line the mascot patrols on — beside the headline */}
        <div className={styles.groundWrap}>
          <span ref={lineRef} className={styles.groundLine} data-solid />
          <Mascot ground range={80} />
        </div>
      </div>

      <button
        ref={btn}
        type="button"
        onClick={() => setFormOpen(true)}
        className={styles.cta}
        data-cursor="grow"
        data-solid
      >
        <span>Get in touch</span>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M4 16L16 4M16 4H6M16 4v10" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>

      <ContactForm open={formOpen} onClose={() => setFormOpen(false)} />

      <div className={styles.meta}>
        <span>© 2026 Mithun Chavan A — Bangalore, India</span>
        <div className={styles.socials}>
          <a href="https://github.com/mithun0524" target="_blank" rel="noreferrer" data-cursor="grow">
            GitHub
          </a>
          <a
            href="https://www.linkedin.com/in/mithun-chavan-8b9198254"
            target="_blank"
            rel="noreferrer"
            data-cursor="grow"
          >
            LinkedIn
          </a>
          <a href="https://x.com/Mithun_Chavan_" target="_blank" rel="noreferrer" data-cursor="grow">
            X
          </a>
          <a href="https://leetcode.com/mithun0524/" target="_blank" rel="noreferrer" data-cursor="grow">
            LeetCode
          </a>
          <a
            href="https://www.codewars.com/users/mithun0524"
            target="_blank"
            rel="noreferrer"
            data-cursor="grow"
          >
            Codewars
          </a>
        </div>
      </div>
    </footer>
  )
}
