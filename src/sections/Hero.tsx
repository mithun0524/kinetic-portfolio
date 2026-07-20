import { useRef, useState } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '../lib/gsap'
import { useMagnetic } from '../hooks/useMagnetic'
import { Mascot, type MascotHandle } from '../components/Mascot'
import { MobileHerby } from '../components/MobileHerby'
import styles from './Hero.module.css'

/**
 * Hero: everything stays hidden until the loader finishes (`ready`), then a
 * single timeline reveals eyebrow -> name (char roll) -> paragraph (word
 * reveal) -> scroll cue, so it flows straight out of the loader wipe.
 */
export function Hero({ ready }: { ready: boolean }) {
  const eyebrow = useRef<HTMLDivElement>(null)
  const line1 = useRef<HTMLSpanElement>(null)
  const line2 = useRef<HTMLSpanElement>(null)
  const intro = useRef<HTMLParagraphElement>(null)
  const blob = useRef<HTMLDivElement>(null)
  const heroLine = useRef<HTMLSpanElement>(null)
  const cue = useMagnetic<HTMLAnchorElement>(0.6)
  const herby = useRef<MascotHandle>(null)
  const chat = useRef<HTMLDivElement>(null)
  const [msgs, setMsgs] = useState<{ t: string; tx: boolean }[]>([])
  const [typing, setTyping] = useState<boolean | null>(null)

  // a persistent iMessage-style thread at the home base; Herby peeks at his name.
  // No manual run-once guard: useGSAP reverts on cleanup, so under StrictMode the
  // first (discarded) mount's timeline is killed and the persistent mount's one
  // runs — keeping it paired with the Mascot's own arrive() call.
  useGSAP(
    () => {
      if (!ready || prefersReducedMotion()) return
      setMsgs([])
      setTyping(null)
      const push = (t: string, tx: boolean) => setMsgs((p) => [...p, { t, tx }])
      const clear = () => gsap.to(chat.current, { autoAlpha: 0, y: -12, duration: 0.35, onComplete: () => setMsgs([]) })
      const m = () => herby.current
      const tl = gsap.timeline({ delay: 1.4 })
      // show the typing bubble on `tx`'s side, then land the message + optional hook
      const line = (t: string, tx: boolean, after?: () => void) => {
        tl.call(() => setTyping(tx))
          .to({}, { duration: 1.1 })
          .call(() => { setTyping(null); push(t, tx); after?.() })
          .to({}, { duration: 1.3 })
      }
      line('home?', false)
      line('whose home?', true)
      line("Herby's home.", false, () => m()?.peek())
      // as soon as "who's Herby?" lands, Herby ducks back and drops onto home
      line("who's Herby?", true, () => { m()?.duck(); gsap.delayedCall(0.9, () => { clear(); m()?.arrive() }) })
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
          .from(intro.current, { y: 35, opacity: 0, duration: 0.8 }, '-=0.55')
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
        <div ref={chat} className={styles.homeChat} aria-hidden>
          {msgs.map((mm, i) => (
            <span key={i} className={`${styles.msg} ${mm.tx ? styles.tx : styles.rx}`}>{mm.t}</span>
          ))}
          {typing !== null && (
            <span className={`${styles.msg} ${styles.typing} ${typing ? styles.tx : styles.rx}`}>
              <i /><i /><i />
            </span>
          )}
        </div>
        <span className={styles.homeLabel}>HOME</span>
        <span ref={heroLine} className={styles.homeLine} data-solid />
      </div>

      <Mascot ref={herby} homeRef={heroLine} intro />

      <div ref={eyebrow} className={`eyebrow ${styles.eyebrowRow}`} style={{ opacity: 0 }}>
        <span>Full-Stack AI Engineer</span>
        <span className={styles.tagInline}>[ BLR · USUALLY ONLINE ]</span>
      </div>

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

      {/* touch devices get a static, tappable Herby (physics mascot is desktop-only) */}
      <MobileHerby />
    </header>
  )
}
