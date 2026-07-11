import { useRef, useState } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '../lib/gsap'
import styles from './MobileHerby.module.css'

const LINES = ['hi! i’m Herby ^-^', 'boop!', 'hehe~', 'tap tap!', 'hi friend!', '*wiggle*', 'you found me!']

/**
 * A static, tap-reactive Herby for touch devices. The full physics mascot is
 * desktop-only (hidden < 1024px), so phones get this lightweight buddy instead:
 * he blinks, bobs, and bounces + says something when tapped. No drag, no ground.
 */
export function MobileHerby() {
  const wrap = useRef<HTMLDivElement>(null)
  const jump = useRef<HTMLDivElement>(null)
  const body = useRef<SVGGElement>(null)
  const eyes = useRef<SVGGElement>(null)
  const bubble = useRef<HTMLDivElement>(null)
  const [line, setLine] = useState(LINES[0])

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      // gentle idle bob
      gsap.to(wrap.current, { y: -6, duration: 1.4, yoyo: true, repeat: -1, ease: 'sine.inOut' })
      // blink loop
      const blink = () => {
        gsap.to(eyes.current, { scaleY: 0.1, transformOrigin: '50% 50%', duration: 0.08, yoyo: true, repeat: 1 })
        gsap.delayedCall(2.2 + Math.random() * 1.5, blink)
      }
      gsap.delayedCall(2, blink)

      // one-time invite so touch users know he's interactive
      gsap.delayedCall(1.6, () => {
        setLine('tap me!')
        gsap.fromTo(
          bubble.current,
          { autoAlpha: 0, scale: 0.6, y: 8 },
          { autoAlpha: 1, scale: 1, y: 0, duration: 0.3, ease: 'back.out(2.5)' }
        )
        gsap.to(bubble.current, { autoAlpha: 0, scale: 0.7, duration: 0.3, delay: 2.2 })
      })
    },
    { scope: wrap }
  )

  const poke = () => {
    if (prefersReducedMotion()) return
    setLine(LINES[Math.floor(Math.random() * LINES.length)])
    // pop the bubble
    gsap.killTweensOf(bubble.current)
    gsap.fromTo(
      bubble.current,
      { autoAlpha: 0, scale: 0.6, y: 8 },
      { autoAlpha: 1, scale: 1, y: 0, duration: 0.25, ease: 'back.out(2.5)' }
    )
    gsap.to(bubble.current, { autoAlpha: 0, scale: 0.7, duration: 0.3, delay: 1.6 })
    // squash + hop
    gsap
      .timeline()
      .to(body.current, { scaleY: 0.78, scaleX: 1.18, transformOrigin: '50% 100%', duration: 0.1 })
      .to(jump.current, { y: -34, duration: 0.28, ease: 'power2.out' }, '<')
      .to(body.current, { scaleY: 1.1, scaleX: 0.92, duration: 0.2 }, '<')
      .to(jump.current, { y: 0, duration: 0.4, ease: 'bounce.out' })
      .to(body.current, { scaleY: 1, scaleX: 1, duration: 0.3, ease: 'elastic.out(1, 0.4)' }, '-=0.14')
  }

  return (
    <div className={styles.root} aria-hidden>
      <div ref={wrap} className={styles.wrap} onPointerDown={poke} role="button">
        <div ref={bubble} className={styles.bubble}>{line}</div>
        <div className={styles.line} />
        <div ref={jump} className={styles.jump}>
          <svg viewBox="0 0 200 174" className={styles.svg}>
            <g ref={body}>
              <g fill="#d97757">
                <rect x="8" y="82" width="22" height="34" rx="2" />
                <rect x="170" y="82" width="22" height="34" rx="2" />
                <rect x="62" y="138" width="22" height="30" rx="2" />
                <rect x="116" y="138" width="22" height="30" rx="2" />
                <rect x="28" y="52" width="144" height="90" rx="5" />
              </g>
              <g ref={eyes}>
                <ellipse cx="82" cy="97" rx="11" ry="13" fill="#20140f" />
                <ellipse cx="118" cy="97" rx="11" ry="13" fill="#20140f" />
                <circle cx="85" cy="94" r="3.2" fill="#fff" />
                <circle cx="121" cy="94" r="3.2" fill="#fff" />
              </g>
              <path d="M91 120 Q100 127 109 120" fill="none" stroke="#20140f" strokeWidth="4.5" strokeLinecap="round" />
            </g>
          </svg>
        </div>
      </div>
    </div>
  )
}
