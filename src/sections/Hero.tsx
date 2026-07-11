import { useRef } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '../lib/gsap'
import { useMagnetic } from '../hooks/useMagnetic'
import { Mascot, type MascotHandle } from '../components/Mascot'
import styles from './Hero.module.css'

/**
 * Hero: everything stays hidden until the loader finishes (`ready`), then a
 * single timeline reveals eyebrow -> name (char roll) -> paragraph (word
 * reveal) -> scroll cue, so it flows straight out of the loader wipe.
 */
export function Hero({ ready }: { ready: boolean }) {
  const eyebrow = useRef<HTMLSpanElement>(null)
  const line1 = useRef<HTMLSpanElement>(null)
  const line2 = useRef<HTMLSpanElement>(null)
  const intro = useRef<HTMLParagraphElement>(null)
  const blob = useRef<HTMLDivElement>(null)
  const heroLine = useRef<HTMLSpanElement>(null)
  const cue = useMagnetic<HTMLAnchorElement>(0.6)
  const herby = useRef<MascotHandle>(null)
  const chat = useRef<HTMLDivElement>(null)
  const introRan = useRef(false)

  // a little chat at the home base — each line slides up; Herby peeks at his name
  useGSAP(
    () => {
      if (!ready || prefersReducedMotion() || introRan.current) return
      introRan.current = true
      let first = true
      const msg = (text: string) => {
        const el = chat.current
        if (!el) return
        const s = el.querySelector('span')
        const enter = () => {
          if (s) s.textContent = text
          gsap.fromTo(el, { autoAlpha: 0, y: 18, scale: 0.9, xPercent: -50 }, { autoAlpha: 1, y: 0, scale: 1, xPercent: -50, duration: 0.35, ease: 'back.out(2)' })
        }
        if (first) { first = false; enter() }
        else gsap.to(el, { autoAlpha: 0, y: -18, xPercent: -50, duration: 0.25, ease: 'power2.in', onComplete: enter })
      }
      const hide = () => gsap.to(chat.current, { autoAlpha: 0, y: -18, xPercent: -50, duration: 0.3 })
      const m = () => herby.current
      gsap
        .timeline({ delay: 1.4 })
        .call(() => msg('home?'))
        .to({}, { duration: 2.4 })
        .call(() => msg('whose home?'))
        .to({}, { duration: 2.6 })
        .call(() => { msg("Herby's home."); m()?.peek() })
        .to({}, { duration: 2.8 })
        .call(() => msg("who's Herby?"))
        .to({}, { duration: 2.6 })
        .call(() => { hide(); m()?.duck() })
        .to({}, { duration: 1.2 })
        .call(() => m()?.arrive())
    },
    { dependencies: [ready] }
  )

  useGSAP(
    () => {
      let removeMove: (() => void) | undefined

      // cursor-follow highlight (runs regardless of ready)
      if (blob.current && !prefersReducedMotion()) {
        const xTo = gsap.quickTo(blob.current, 'x', { duration: 0.4, ease: 'power3' })
        const yTo = gsap.quickTo(blob.current, 'y', { duration: 0.4, ease: 'power3' })
        const move = (e: PointerEvent) => {
          xTo(e.clientX)
          yTo(e.clientY)
        }
        window.addEventListener('pointermove', move)
        removeMove = () => window.removeEventListener('pointermove', move)
      }

      const targets = [eyebrow.current, line1.current, line2.current, intro.current, cue.current]

      if (prefersReducedMotion()) {
        gsap.set(targets, { opacity: 1 })
        return removeMove
      }

      // stay hidden until the loader is done
      if (!ready) {
        gsap.set(targets, { opacity: 0 })
        return removeMove
      }

      document.fonts.ready.then(() => {
        gsap.set(targets, { opacity: 1 })

        const tl = gsap.timeline({ defaults: { ease: 'power4.out' } })
        tl.from(eyebrow.current, { y: 20, opacity: 0, duration: 0.6 })
          // each name line slides up from behind its mask
          .from(
            [line1.current, line2.current],
            { yPercent: 115, duration: 1, stagger: 0.12 },
            '-=0.2'
          )
          .from(intro.current, { y: 40, opacity: 0, duration: 0.8 }, '-=0.55')
          .from(cue.current, { opacity: 0, duration: 0.6 }, '-=0.3')
      })

      return removeMove
    },
    { dependencies: [ready] }
  )

  return (
    <header className={styles.hero}>
      <div ref={blob} className={styles.blob} aria-hidden />

      <div className={styles.homeWrap}>
        <div ref={chat} className={styles.homeChat} aria-hidden><span /></div>
        <span className={styles.homeLabel}>HOME</span>
        <span ref={heroLine} className={styles.homeLine} data-solid />
      </div>

      <Mascot ref={herby} homeRef={heroLine} intro />

      <span ref={eyebrow} className={`eyebrow ${styles.eyebrow}`} style={{ opacity: 0 }}>
        Full-Stack AI Engineer
      </span>

      <h1 className={`display ${styles.title}`} data-solid>
        <span className={styles.lineMask}>
          <span ref={line1} className={styles.line} style={{ opacity: 0 }}>
            Mithun
          </span>
        </span>
        <span className={styles.lineMask}>
          <span ref={line2} className={`chrome-text ${styles.line}`} style={{ opacity: 0 }}>
            Chavan
          </span>
        </span>
      </h1>

      <div className={styles.meta}>
        <p ref={intro} style={{ opacity: 0 }}>
          I build AI agents, dev tools and full-stack apps. Lately I&apos;ve
          been deep in a terminal coding agent and an AI code editor that runs
          right in the browser.
        </p>
        <a ref={cue} href="#work" className={styles.cue} data-cursor="grow" style={{ opacity: 0 }}>
          <span>Scroll</span>
          <svg width="14" height="30" viewBox="0 0 14 30" fill="none">
            <path d="M7 0v28M1 22l6 6 6-6" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </a>
      </div>
    </header>
  )
}
