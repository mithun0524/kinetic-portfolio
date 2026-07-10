import { useRef } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '../lib/gsap'
import styles from './Mascot.module.css'

/**
 * A blocky little buddy (Claude-Code-ish) in the hero's empty space.
 * - Idle: eyes follow the cursor + blink.
 * - Hover: happy `><` squint + lean.
 * - Press: squishes down.
 * - Click: happy hop with squash/stretch + a sparkle pop.
 * Pure SVG + GSAP, no 3D deps.
 */
export function Mascot() {
  const root = useRef<HTMLDivElement>(null)
  const jump = useRef<HTMLDivElement>(null)
  const body = useRef<SVGGElement>(null)
  const eyesOpen = useRef<SVGGElement>(null)
  const eyesHappy = useRef<SVGGElement>(null)
  const pupilL = useRef<SVGGElement>(null)
  const pupilR = useRef<SVGGElement>(null)
  const spark = useRef<SVGGElement>(null)
  const busy = useRef(false)

  useGSAP(
    () => {
      gsap.set(eyesHappy.current, { autoAlpha: 0 })
      gsap.set(spark.current, { autoAlpha: 0 })
      if (prefersReducedMotion()) return

      // blink loop
      const blink = () => {
        gsap.to(eyesOpen.current, {
          scaleY: 0.1,
          transformOrigin: '50% 50%',
          duration: 0.08,
          yoyo: true,
          repeat: 1,
        })
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
        const dist = Math.min(Math.hypot(dx, dy) / 40, 1) * max
        gsap.to(p, { x: Math.cos(ang) * dist, y: Math.sin(ang) * dist, duration: 0.5, ease: 'power3.out' })
      }
      const onMove = (e: PointerEvent) => {
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

  // hover: happy squint + slight lean
  const hover = (on: boolean) => {
    if (prefersReducedMotion() || busy.current) return
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

  // press feedback
  const press = (down: boolean) => {
    if (prefersReducedMotion() || busy.current) return
    gsap.to(body.current, {
      scaleY: down ? 0.85 : 0.94,
      scaleX: down ? 1.12 : 1.06,
      transformOrigin: '50% 100%',
      duration: 0.14,
      ease: 'power2.out',
    })
  }

  // click: happy hop + sparkle pop
  const hop = () => {
    if (prefersReducedMotion() || busy.current) return
    busy.current = true
    showHappy(true)

    gsap
      .timeline({
        onComplete: () => {
          busy.current = false
          showHappy(false)
          gsap.set(body.current, { rotation: 0 })
        },
      })
      .to(body.current, { scaleY: 0.78, scaleX: 1.18, transformOrigin: '50% 100%', duration: 0.1 })
      .to(jump.current, { y: -46, duration: 0.32, ease: 'power2.out' }, '<')
      .to(body.current, { scaleY: 1.12, scaleX: 0.9, rotation: 8, duration: 0.22 }, '<')
      .to(jump.current, { y: 0, duration: 0.4, ease: 'bounce.out' })
      .to(body.current, { scaleY: 1, scaleX: 1, rotation: 0, duration: 0.3, ease: 'elastic.out(1, 0.4)' }, '-=0.15')

    // sparkle
    gsap.set(spark.current, { autoAlpha: 1, scale: 0.3, y: 0, transformOrigin: '50% 50%' })
    gsap
      .timeline()
      .to(spark.current, { scale: 1, y: -34, duration: 0.5, ease: 'power2.out' })
      .to(spark.current, { autoAlpha: 0, y: -50, duration: 0.3 }, '-=0.15')
  }

  return (
    <div
      ref={root}
      className={styles.mascot}
      aria-hidden
      onPointerEnter={() => hover(true)}
      onPointerLeave={() => {
        press(false)
        hover(false)
      }}
      onPointerDown={() => press(true)}
      onPointerUp={() => press(false)}
      onClick={hop}
    >
      <div ref={jump}>
        <svg viewBox="0 0 200 200" className={styles.svg}>
          {/* sparkle that pops on click */}
          <g ref={spark} fill="var(--m)">
            <path d="M100 12 L104 26 L118 30 L104 34 L100 48 L96 34 L82 30 L96 26 Z" />
          </g>

          <g ref={body}>
            {/* side nubs */}
            <rect x="24" y="82" width="20" height="36" rx="7" fill="var(--m)" />
            <rect x="156" y="82" width="20" height="36" rx="7" fill="var(--m)" />
            {/* legs */}
            <rect x="64" y="146" width="20" height="32" rx="6" fill="var(--m)" />
            <rect x="116" y="146" width="20" height="32" rx="6" fill="var(--m)" />
            {/* body */}
            <rect x="42" y="44" width="116" height="112" rx="18" fill="var(--m)" />

            {/* open eyes (track cursor) */}
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

            {/* happy >< eyes */}
            <g ref={eyesHappy} stroke="#20140f" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none">
              <path d="M70 84 L90 98 L70 112" />
              <path d="M130 84 L110 98 L130 112" />
            </g>
          </g>
        </svg>
      </div>
    </div>
  )
}
