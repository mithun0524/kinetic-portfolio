import { useRef, useState } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '../lib/gsap'
import { useMagnetic } from '../hooks/useMagnetic'
import { ContactForm } from '../components/ContactForm'
import { Mascot } from '../components/Mascot'
import styles from './Contact.module.css'

/** Contact: masked outro headline + magnetic link + footer meta. */
export function Contact({ onPlay }: { onPlay: () => void }) {
  const root = useRef<HTMLElement>(null)
  const l1 = useRef<HTMLSpanElement>(null)
  const l2 = useRef<HTMLSpanElement>(null)
  const l3 = useRef<HTMLSpanElement>(null)
  const btn = useMagnetic<HTMLButtonElement>(0.5)
  const lineRef = useRef<HTMLSpanElement>(null)
  const labelRef = useRef<HTMLSpanElement>(null)
  const playRef = useRef<HTMLButtonElement>(null)
  const [formOpen, setFormOpen] = useState(false)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return

      // place the home ground-line + label just to the right of "should move?".
      // measured on the mask (its box doesn't move during the reveal), so the
      // line lands correctly even before the text has animated in.
      const place = () => {
        const line = lineRef.current
        const label = labelRef.current
        const el = l3.current
        const mask = el?.parentElement // overflow mask — its bottom is the static baseline
        const box = root.current
        if (!line || !el || !mask || !box) return
        const cr = box.getBoundingClientRect()
        // text extent is horizontally correct even mid-reveal (reveal is vertical)
        const range = document.createRange()
        range.selectNodeContents(el)
        const tr = range.getBoundingClientRect()
        range.detach?.()
        const mr = mask.getBoundingClientRect()
        if (tr.width < 10) return
        const x = tr.right - cr.left + 48
        const y = mr.bottom - cr.top - 6
        line.style.left = `${x}px`
        line.style.top = `${y}px`
        if (label) {
          label.style.left = `${x + 95}px`
          label.style.top = `${y - 26}px`
        }
        if (playRef.current) {
          // right-align to the home line so the big button grows leftward (stays on screen)
          const lineRightRel = tr.right - cr.left
          playRef.current.style.left = 'auto'
          playRef.current.style.right = `${cr.width - lineRightRel}px`
          playRef.current.style.top = `${y + 40}px`
        }
      }

      gsap.from([l1.current, l2.current, l3.current], {
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

      gsap.delayedCall(0.5, place)
      window.addEventListener('resize', place)
      const onScroll = () => place()
      window.addEventListener('scroll', onScroll, { passive: true })
      return () => {
        window.removeEventListener('resize', place)
        window.removeEventListener('scroll', onScroll)
      }
    },
    { scope: root }
  )

  return (
    <footer ref={root} className={`section ${styles.contact}`} id="contact">
      <span className="eyebrow">( Let&apos;s build )</span>

      <h2 className={`display ${styles.line}`}>
        <span className={styles.lineMask}>
          <span ref={l1} className={styles.lineInner}>
            Have something
          </span>
        </span>
        <span className={styles.lineMask}>
          <span ref={l2} className={styles.lineInner}>
            that
          </span>
        </span>
        <span className={styles.lineMask}>
          <span ref={l3} className={styles.lineInner}>
            should <span className="chrome-text">move?</span>
          </span>
        </span>
      </h2>

      {/* home base beside "should move?" — label + ground line + the buddy */}
      <span ref={labelRef} className={styles.homeLabel}>HOME</span>
      <span ref={lineRef} className={styles.homeLine} data-solid />
      <Mascot ground homeRef={lineRef} />
      <button ref={playRef} className={`${styles.cta} ${styles.playHere}`} onClick={onPlay} data-cursor="grow">
        <span>Play with Herby</span>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M7 5l8 5-8 5V5z" fill="currentColor" />
        </svg>
      </button>

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

      <button className={styles.playMobile} onClick={onPlay} data-cursor="grow">
        Play with Herby
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
