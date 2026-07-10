import { useRef } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '../lib/gsap'
import styles from './Mascot.module.css'

/**
 * A blocky little buddy (Claude-Code-ish) in the hero's empty space.
 * Idle: bobs, blinks, and its eyes follow the cursor.
 * Hover: happy `><` squint + a wobbly wiggle.
 * Pure SVG + GSAP, no 3D deps.
 */
export function Mascot() {
  const root = useRef<HTMLDivElement>(null)
  const body = useRef<SVGGElement>(null)
  const eyesOpen = useRef<SVGGElement>(null)
  const eyesHappy = useRef<SVGGElement>(null)
  const pupilL = useRef<SVGGElement>(null)
  const pupilR = useRef<SVGGElement>(null)

  useGSAP(
    () => {
      gsap.set(eyesHappy.current, { autoAlpha: 0 })
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

  const react = (on: boolean) => {
    if (prefersReducedMotion()) return
    gsap.to(eyesOpen.current, { autoAlpha: on ? 0 : 1, duration: 0.12 })
    gsap.to(eyesHappy.current, { autoAlpha: on ? 1 : 0, duration: 0.12 })
    gsap.to(body.current, {
      scaleX: on ? 1.07 : 1,
      scaleY: on ? 0.93 : 1,
      rotation: on ? 3 : 0,
      transformOrigin: '50% 100%',
      duration: 0.5,
      ease: 'elastic.out(1, 0.4)',
    })
  }

  return (
    <div
      ref={root}
      className={styles.mascot}
      aria-hidden
      onPointerEnter={() => react(true)}
      onPointerLeave={() => react(false)}
    >
      <div>
        <svg viewBox="0 0 200 200" className={styles.svg}>
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

            {/* happy >< eyes (on hover) */}
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
