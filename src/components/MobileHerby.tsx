import { useRef, useState } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '../lib/gsap'
import styles from './MobileHerby.module.css'

type Mood = 'normal' | 'happy' | 'blush' | 'angry' | 'sad'

const LINES: Record<Mood, string[]> = {
  normal: ['hi!', 'boop?'],
  happy: ['hehe~', 'boop!', 'yay!', 'hi friend!', '^-^'],
  blush: ['*blush*', 'aw, stop~', 'teehee'],
  angry: ['hey!', 'stop poking!', 'grr!'],
  sad: ['ow…', 'be gentle 🥺', 'that hurt…'],
}
const rand = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]

/**
 * Static, tap-reactive Herby for touch devices. Taps make him happy; poke fast
 * and he gets angry (turns red + shakes); keep poking and he goes sad; gentle
 * repeat taps make him blush. Body colour shifts with the mood.
 */
export function MobileHerby() {
  const wrap = useRef<HTMLDivElement>(null)
  const jump = useRef<HTMLDivElement>(null)
  const body = useRef<SVGGElement>(null)
  const eyes = useRef<SVGGElement>(null)
  const bubble = useRef<HTMLDivElement>(null)
  const taps = useRef<number[]>([])
  const lastMood = useRef<Mood>('normal')
  const revert = useRef<ReturnType<typeof gsap.delayedCall>>()
  const [mood, setMood] = useState<Mood>('normal')
  const [line, setLine] = useState('')

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.to(wrap.current, { y: -6, duration: 1.4, yoyo: true, repeat: -1, ease: 'sine.inOut' })
      const blink = () => {
        if (lastMood.current === 'normal')
          gsap.to(eyes.current, { scaleY: 0.1, transformOrigin: '50% 50%', duration: 0.08, yoyo: true, repeat: 1 })
        gsap.delayedCall(2.2 + Math.random() * 1.5, blink)
      }
      gsap.delayedCall(2, blink)
      // one-time invite
      gsap.delayedCall(1.6, () => showBubble('tap me!'))
    },
    { scope: wrap }
  )

  const showBubble = (t: string) => {
    setLine(t)
    gsap.killTweensOf(bubble.current)
    gsap.fromTo(
      bubble.current,
      { autoAlpha: 0, scale: 0.6, y: 8 },
      { autoAlpha: 1, scale: 1, y: 0, duration: 0.25, ease: 'back.out(2.5)' }
    )
    gsap.to(bubble.current, { autoAlpha: 0, scale: 0.7, duration: 0.3, delay: 1.7 })
  }

  const setMoodFor = (m: Mood, hold: number) => {
    lastMood.current = m
    setMood(m)
    gsap.set(eyes.current, { scaleY: 1 }) // clear any mid-blink squash
    revert.current?.kill()
    if (m !== 'normal') {
      revert.current = gsap.delayedCall(hold, () => {
        lastMood.current = 'normal'
        setMood('normal')
      })
    }
  }

  const poke = () => {
    if (prefersReducedMotion()) return
    const now = Date.now()
    taps.current.push(now)
    taps.current = taps.current.filter((t) => now - t < 1600)
    const rapid = taps.current.length

    let m: Mood = 'happy'
    if (rapid >= 5) m = 'sad' // kept poking after getting mad → he's hurt
    else if (rapid >= 4) m = 'angry'
    else if (rapid === 3) m = 'blush'

    setMoodFor(m, m === 'sad' ? 2.6 : m === 'angry' ? 2 : 2.2)
    showBubble(rand(LINES[m]))

    // motion per mood
    if (m === 'angry') {
      gsap.fromTo(jump.current, { x: -4 }, { x: 4, duration: 0.05, yoyo: true, repeat: 9, onComplete: () => gsap.set(jump.current, { x: 0 }) })
    } else if (m === 'sad') {
      gsap.to(jump.current, { y: 5, duration: 0.4, yoyo: true, repeat: 1, ease: 'power2.out' })
    } else {
      // happy / blush: squash + hop
      gsap
        .timeline()
        .to(body.current, { scaleY: 0.78, scaleX: 1.18, transformOrigin: '50% 100%', duration: 0.1 })
        .to(jump.current, { y: m === 'blush' ? -16 : -34, duration: 0.28, ease: 'power2.out' }, '<')
        .to(body.current, { scaleY: 1.1, scaleX: 0.92, duration: 0.2 }, '<')
        .to(jump.current, { y: 0, duration: 0.4, ease: 'bounce.out' })
        .to(body.current, { scaleY: 1, scaleX: 1, duration: 0.3, ease: 'elastic.out(1, 0.4)' }, '-=0.14')
    }
  }

  return (
    <div className={styles.root} aria-hidden>
      <div ref={wrap} className={`${styles.wrap} ${mood !== 'normal' ? styles['mood_' + mood] : ''}`} onPointerDown={poke} role="button">
        <div ref={bubble} className={styles.bubble}>{line}</div>
        {mood === 'blush' && (
          <div className={styles.hearts} aria-hidden>
            <span>💗</span><span>💕</span><span>💗</span>
          </div>
        )}
        <div className={styles.line} />
        <div ref={jump} className={styles.jump}>
          <svg viewBox="0 0 200 174" className={styles.svg}>
            <g ref={body} fill="#d97757">
              <rect x="8" y="82" width="22" height="34" rx="2" />
              <rect x="170" y="82" width="22" height="34" rx="2" />
              <rect x="62" y="138" width="22" height="30" rx="2" />
              <rect x="116" y="138" width="22" height="30" rx="2" />
              <rect x="28" y="52" width="144" height="90" rx="5" />

              {/* cheeks for blush */}
              {mood === 'blush' && (
                <g>
                  <ellipse cx="64" cy="114" rx="11" ry="6" fill="#ff8f8f" opacity="0.8" />
                  <ellipse cx="136" cy="114" rx="11" ry="6" fill="#ff8f8f" opacity="0.8" />
                </g>
              )}

              {mood === 'happy' ? (
                <g stroke="#20140f" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none">
                  <path d="M72 86 L92 99 L72 112" />
                  <path d="M128 86 L108 99 L128 112" />
                  <path d="M86 118 Q100 132 114 118" strokeWidth="5" />
                </g>
              ) : mood === 'blush' ? (
                <g stroke="#20140f" strokeWidth="7" strokeLinecap="round" fill="none">
                  <path d="M72 100 Q82 90 92 100" />
                  <path d="M108 100 Q118 90 128 100" />
                  <path d="M93 120 Q100 126 107 120" strokeWidth="4.5" />
                </g>
              ) : mood === 'angry' ? (
                <g>
                  <g stroke="#20140f" strokeWidth="7" strokeLinecap="round">
                    <path d="M70 86 L94 96" />
                    <path d="M130 86 L106 96" />
                  </g>
                  <ellipse cx="84" cy="105" rx="7" ry="8" fill="#20140f" />
                  <ellipse cx="116" cy="105" rx="7" ry="8" fill="#20140f" />
                  <path d="M90 124 Q100 116 110 124" fill="none" stroke="#20140f" strokeWidth="4.5" strokeLinecap="round" />
                </g>
              ) : mood === 'sad' ? (
                <g>
                  <g stroke="#20140f" strokeWidth="7" strokeLinecap="round" fill="none">
                    <path d="M72 96 Q82 108 92 100" />
                    <path d="M108 100 Q118 108 128 96" />
                  </g>
                  <ellipse cx="86" cy="116" rx="3.5" ry="6" fill="#bfe3ff" />
                  <path d="M90 126 Q100 116 110 126" fill="none" stroke="#20140f" strokeWidth="4.5" strokeLinecap="round" />
                </g>
              ) : (
                <g ref={eyes}>
                  <ellipse cx="82" cy="97" rx="11" ry="13" fill="#20140f" />
                  <ellipse cx="118" cy="97" rx="11" ry="13" fill="#20140f" />
                  <circle cx="85" cy="94" r="3.2" fill="#fff" />
                  <circle cx="121" cy="94" r="3.2" fill="#fff" />
                  <path d="M91 120 Q100 127 109 120" fill="none" stroke="#20140f" strokeWidth="4.5" strokeLinecap="round" />
                </g>
              )}
            </g>
          </svg>
        </div>
      </div>
    </div>
  )
}
