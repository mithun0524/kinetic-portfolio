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
  const leaving = useRef(false)
  const tapped = useRef(false)
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
      // keep nudging "tap me!" until they actually tap him
      const invite = () => {
        if (tapped.current) return
        showBubble('tap me!')
        gsap.delayedCall(3.4, invite)
      }
      gsap.delayedCall(1.6, invite)
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

  const leave = () => {
    leaving.current = true
    lastMood.current = 'angry'
    setMood('angry')
    revert.current?.kill()
    const off = (typeof window !== 'undefined' ? window.innerWidth : 800) * 0.85
    // he loses it — stomps, shakes, rants, then storms off
    showBubble('okay, that’s IT. 😤')
    rage()
    gsap.delayedCall(1.2, () => showBubble('i’m done — stop poking me!'))
    gsap.delayedCall(2.4, () => showBubble('bye. 🙄'))
    gsap.killTweensOf(wrap.current)
    gsap.to(wrap.current, { x: off, rotation: 14, duration: 0.9, ease: 'power2.in', delay: 3.1 })
    // ...then sheepishly return later
    gsap.delayedCall(9, () => {
      taps.current = []
      lastMood.current = 'normal'
      setMood('normal')
      gsap.fromTo(
        wrap.current,
        { x: off, rotation: 14 },
        { x: 0, rotation: 0, duration: 0.9, ease: 'power3.out' }
      )
      gsap.to(wrap.current, { y: -6, duration: 1.4, yoyo: true, repeat: -1, ease: 'sine.inOut' })
      showBubble('…okay, i’m back')
      leaving.current = false
    })
  }

  // light angry tremble — mostly idle, the 💢 marks carry it
  const angryTremble = () => {
    gsap.killTweensOf(jump.current)
    gsap.fromTo(jump.current, { x: -2.5 }, { x: 2.5, duration: 0.06, yoyo: true, repeat: 5, onComplete: () => gsap.set(jump.current, { x: 0 }) })
  }

  // rage-quit meltdown: hard stomps + shake the WHOLE screen
  const rage = () => {
    gsap.killTweensOf([jump.current, body.current])
    gsap.set(jump.current, { x: 0, y: 0 })
    gsap.fromTo(jump.current, { x: -6 }, { x: 6, duration: 0.05, yoyo: true, repeat: 46, ease: 'none', onComplete: () => gsap.set(jump.current, { x: 0 }) })
    const tl = gsap.timeline({ repeat: 5 })
    tl.to(jump.current, { y: -16, duration: 0.12, ease: 'power2.out' })
      .to(body.current, { scaleX: 1.18, scaleY: 0.84, transformOrigin: '50% 100%', duration: 0.12 }, '<')
      .to(jump.current, { y: 0, duration: 0.13, ease: 'power2.in' })
      .to(body.current, { scaleX: 1, scaleY: 1, duration: 0.16, ease: 'back.out(2)' }, '<')
      .to({}, { duration: 0.1 })
    screenShake(3)
  }

  // jolt the whole page, decaying over `dur` seconds
  const screenShake = (dur: number) => {
    const el = document.body
    const steps = Math.floor(dur / 0.05)
    const tl = gsap.timeline({ onComplete: () => gsap.set(el, { x: 0, y: 0 }) })
    for (let i = 0; i < steps; i++) {
      const decay = 1 - i / steps
      const amp = 9 * decay + 1
      tl.to(el, { x: (i % 2 ? 1 : -1) * amp, y: (i % 3 ? -1 : 1) * amp * 0.6, duration: 0.05, ease: 'none' })
    }
    tl.to(el, { x: 0, y: 0, duration: 0.12 })
  }

  const poke = () => {
    if (prefersReducedMotion() || leaving.current) return
    tapped.current = true // stop the "tap me!" nudges
    const now = Date.now()
    taps.current.push(now)
    taps.current = taps.current.filter((t) => now - t < 2600)
    const rapid = taps.current.length

    if (rapid >= 8) return leave() // 8th poke — he loses it and leaves

    let m: Mood = 'happy'
    if (rapid >= 7) m = 'sad' // 7 → hurt
    else if (rapid >= 5) m = 'angry' // 5–6 → angry
    else if (rapid === 3) m = 'blush' // 3 → blush

    setMoodFor(m, m === 'sad' ? 2.6 : m === 'angry' ? 2 : 2.2)
    showBubble(rand(LINES[m]))

    // motion per mood
    if (m === 'angry') {
      angryTremble()
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
        {mood === 'sad' && (
          <div className={`${styles.hearts} ${styles.heartsSad}`} aria-hidden>
            <span>💔</span><span>💧</span><span>💔</span>
          </div>
        )}
        {mood === 'angry' && (
          <div className={`${styles.hearts} ${styles.heartsAngry}`} aria-hidden>
            <span>💢</span><span>💢</span>
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
