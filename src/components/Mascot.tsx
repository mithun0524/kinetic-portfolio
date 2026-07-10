import { useRef } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '../lib/gsap'
import styles from './Mascot.module.css'

/**
 * A blocky little buddy (Claude-Code-ish) in the hero's empty space.
 * - Idle: strolls left/right with stepping legs + a waddle, eyes follow cursor, blinks.
 * - Hover: stops, happy `><` squint + lean.
 * - Click: happy hop with squash/stretch + a sparkle pop.
 * - Drag: pick it up and drop it anywhere — it waddles back home.
 * Pure SVG + GSAP, no 3D deps.
 */
export function Mascot() {
  const root = useRef<HTMLDivElement>(null)
  const drag = useRef<HTMLDivElement>(null)
  const walker = useRef<HTMLDivElement>(null)
  const jump = useRef<HTMLDivElement>(null)
  const facer = useRef<HTMLDivElement>(null)
  const body = useRef<SVGGElement>(null)
  const eyesOpen = useRef<SVGGElement>(null)
  const eyesHappy = useRef<SVGGElement>(null)
  const pupilL = useRef<SVGGElement>(null)
  const pupilR = useRef<SVGGElement>(null)
  const legL = useRef<SVGRectElement>(null)
  const legR = useRef<SVGRectElement>(null)
  const spark = useRef<SVGGElement>(null)
  const walkTl = useRef<gsap.core.Timeline | null>(null)

  const busy = useRef(false)
  const drag_ = useRef({ active: false, moved: false, sx: 0, sy: 0, ox: 0, oy: 0 })

  const face = (dir: number) => gsap.to(facer.current, { scaleX: dir, duration: 0.25, overwrite: 'auto' })

  useGSAP(
    () => {
      gsap.set(eyesHappy.current, { autoAlpha: 0 })
      gsap.set(spark.current, { autoAlpha: 0 })
      if (prefersReducedMotion()) return

      walkTl.current = gsap
        .timeline({ repeat: -1 })
        .add(() => face(1))
        .to(walker.current, { x: 80, duration: 4.5, ease: 'none' })
        .add(() => face(-1))
        .to(walker.current, { x: -80, duration: 4.5, ease: 'none' })

      // stepping legs + waddle
      gsap.to(legL.current, { y: -7, duration: 0.28, repeat: -1, yoyo: true, ease: 'sine.inOut' })
      gsap.to(legR.current, { y: -7, duration: 0.28, repeat: -1, yoyo: true, ease: 'sine.inOut' }).progress(0.5)
      gsap.to(facer.current, { rotation: 2.5, duration: 0.28, repeat: -1, yoyo: true, ease: 'sine.inOut' })

      // blink
      const blink = () => {
        gsap.to(eyesOpen.current, { scaleY: 0.1, transformOrigin: '50% 50%', duration: 0.08, yoyo: true, repeat: 1 })
        gsap.delayedCall(2.6, blink)
      }
      gsap.delayedCall(2.6, blink)

      // pupils follow cursor
      const track = (p: SVGGElement | null, e: PointerEvent, max: number) => {
        if (!p) return
        const r = p.getBoundingClientRect()
        const dx = e.clientX - (r.left + r.width / 2)
        const dy = e.clientY - (r.top + r.height / 2)
        const ang = Math.atan2(dy, dx)
        const d = Math.min(Math.hypot(dx, dy) / 40, 1) * max
        gsap.to(p, { x: Math.cos(ang) * d, y: Math.sin(ang) * d, duration: 0.5, ease: 'power3.out' })
      }
      const onMove = (e: PointerEvent) => {
        if (drag_.current.active) return
        track(pupilL.current, e, 4)
        track(pupilR.current, e, 4)
      }
      window.addEventListener('pointermove', onMove)
      return () => window.removeEventListener('pointermove', onMove)
    },
    { scope: root }
  )

  const showHappy = (on: boolean) => {
    gsap.to(eyesOpen.current, { autoAlpha: on ? 0 : 1, duration: 0.1 })
    gsap.to(eyesHappy.current, { autoAlpha: on ? 1 : 0, duration: 0.1 })
  }

  const hover = (on: boolean) => {
    if (prefersReducedMotion() || drag_.current.active) return
    if (on) walkTl.current?.pause()
    else if (!busy.current) walkTl.current?.resume()
    if (busy.current) return
    showHappy(on)
    gsap.to(body.current, {
      scaleX: on ? 1.06 : 1,
      scaleY: on ? 0.94 : 1,
      rotation: on ? 3 : 0,
      transformOrigin: '50% 100%',
      duration: 0.5,
      ease: 'elastic.out(1, 0.4)',
    })
  }

  const hop = () => {
    if (prefersReducedMotion() || busy.current) return
    busy.current = true
    walkTl.current?.pause()
    showHappy(true)
    gsap
      .timeline({
        onComplete: () => {
          busy.current = false
          showHappy(false)
          gsap.set(body.current, { rotation: 0 })
          walkTl.current?.resume()
        },
      })
      .to(body.current, { scaleY: 0.78, scaleX: 1.18, transformOrigin: '50% 100%', duration: 0.1 })
      .to(jump.current, { y: -46, duration: 0.32, ease: 'power2.out' }, '<')
      .to(body.current, { scaleY: 1.12, scaleX: 0.9, rotation: 8, duration: 0.22 }, '<')
      .to(jump.current, { y: 0, duration: 0.4, ease: 'bounce.out' })
      .to(body.current, { scaleY: 1, scaleX: 1, rotation: 0, duration: 0.3, ease: 'elastic.out(1, 0.4)' }, '-=0.15')

    gsap.set(spark.current, { autoAlpha: 1, scale: 0.3, y: 0, transformOrigin: '50% 50%' })
    gsap
      .timeline()
      .to(spark.current, { scale: 1, y: -34, duration: 0.5, ease: 'power2.out' })
      .to(spark.current, { autoAlpha: 0, y: -50, duration: 0.3 }, '-=0.15')
  }

  // ---- drag & drop ----
  const onDown = (e: React.PointerEvent) => {
    if (prefersReducedMotion() || busy.current) return
    const s = drag_.current
    s.active = true
    s.moved = false
    s.sx = e.clientX
    s.sy = e.clientY
    s.ox = (gsap.getProperty(drag.current, 'x') as number) || 0
    s.oy = (gsap.getProperty(drag.current, 'y') as number) || 0
    walkTl.current?.pause()
    root.current?.setPointerCapture(e.pointerId)
  }

  const onMoveDrag = (e: React.PointerEvent) => {
    const s = drag_.current
    if (!s.active) return
    const dx = e.clientX - s.sx
    const dy = e.clientY - s.sy
    if (!s.moved && Math.hypot(dx, dy) > 4) {
      s.moved = true
      // "picked up" pose
      showHappy(false)
      gsap.to(body.current, { scale: 1.12, duration: 0.2, ease: 'back.out(2)', transformOrigin: '50% 50%' })
    }
    if (s.moved) {
      face(dx < 0 ? -1 : 1)
      gsap.set(drag.current, { x: s.ox + dx, y: s.oy + dy })
    }
  }

  const onUp = (e: React.PointerEvent) => {
    const s = drag_.current
    root.current?.releasePointerCapture?.(e.pointerId)
    if (!s.active) return
    s.active = false

    if (!s.moved) {
      hop()
      return
    }

    // walk back home
    const x = (gsap.getProperty(drag.current, 'x') as number) || 0
    const y = (gsap.getProperty(drag.current, 'y') as number) || 0
    face(x > 0 ? -1 : 1)
    const dur = gsap.utils.clamp(0.5, 1.8, Math.hypot(x, y) / 180)
    gsap.to(body.current, { scale: 1, duration: 0.25 })
    gsap.to(drag.current, {
      x: 0,
      y: 0,
      duration: dur,
      ease: 'power1.inOut',
      onComplete: () => walkTl.current?.resume(),
    })
  }

  return (
    <div
      ref={root}
      className={styles.mascot}
      aria-hidden
      onPointerEnter={() => hover(true)}
      onPointerLeave={() => hover(false)}
      onPointerDown={onDown}
      onPointerMove={onMoveDrag}
      onPointerUp={onUp}
    >
      <div ref={drag}>
        <div ref={walker}>
          <div ref={jump}>
            <div ref={facer}>
              <svg viewBox="0 0 200 200" className={styles.svg}>
                <g ref={spark} fill="var(--m)">
                  <path d="M100 12 L104 26 L118 30 L104 34 L100 48 L96 34 L82 30 L96 26 Z" />
                </g>

                <g ref={body}>
                  <rect x="24" y="82" width="20" height="36" rx="7" fill="var(--m)" />
                  <rect x="156" y="82" width="20" height="36" rx="7" fill="var(--m)" />
                  <rect ref={legL} x="64" y="146" width="20" height="32" rx="6" fill="var(--m)" />
                  <rect ref={legR} x="116" y="146" width="20" height="32" rx="6" fill="var(--m)" />
                  <rect x="42" y="44" width="116" height="112" rx="18" fill="var(--m)" />

                  <g ref={eyesOpen}>
                    <ellipse cx="80" cy="96" rx="11" ry="13" fill="#20140f" />
                    <ellipse cx="120" cy="96" rx="11" ry="13" fill="#20140f" />
                    <g ref={pupilL}>
                      <circle cx="83" cy="93" r="3.2" fill="#fff" />
                    </g>
                    <g ref={pupilR}>
                      <circle cx="123" cy="93" r="3.2" fill="#fff" />
                    </g>
                  </g>

                  <g ref={eyesHappy} stroke="#20140f" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none">
                    <path d="M70 84 L90 98 L70 112" />
                    <path d="M130 84 L110 98 L130 112" />
                  </g>
                </g>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
