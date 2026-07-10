import { useRef } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '../lib/gsap'
import styles from './Mascot.module.css'

/**
 * A small friendly creature that lives in the hero's empty space.
 * Its pupils track the cursor, it bobs and blinks on idle, and it does a
 * happy squish when hovered. Pure SVG + GSAP — no 3D deps.
 */
export function Mascot() {
  const root = useRef<HTMLDivElement>(null)
  const body = useRef<SVGGElement>(null)
  const eyes = useRef<SVGGElement>(null)
  const pupilL = useRef<SVGGElement>(null)
  const pupilR = useRef<SVGGElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return

      // idle bob
      gsap.to(body.current, {
        y: -14,
        duration: 2.4,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      })

      // blink loop (squash the eyes vertically)
      const blink = () => {
        gsap.to(eyes.current, {
          scaleY: 0.1,
          transformOrigin: '50% 50%',
          duration: 0.08,
          yoyo: true,
          repeat: 1,
          onComplete: () => gsap.delayedCall(2 + (root.current ? 1 : 0), blink),
        })
      }
      gsap.delayedCall(2.5, blink)

      // pupils follow the cursor
      const move = (p: SVGGElement | null, e: PointerEvent, max: number) => {
        if (!p) return
        const r = p.getBoundingClientRect()
        const cx = r.left + r.width / 2
        const cy = r.top + r.height / 2
        const dx = e.clientX - cx
        const dy = e.clientY - cy
        const ang = Math.atan2(dy, dx)
        const dist = Math.min(Math.hypot(dx, dy) / 30, 1) * max
        gsap.to(p, {
          x: Math.cos(ang) * dist,
          y: Math.sin(ang) * dist,
          duration: 0.5,
          ease: 'power3.out',
        })
      }
      const onMove = (e: PointerEvent) => {
        move(pupilL.current, e, 5)
        move(pupilR.current, e, 5)
      }
      window.addEventListener('pointermove', onMove)
      return () => window.removeEventListener('pointermove', onMove)
    },
    { scope: root }
  )

  const squish = (on: boolean) => {
    if (prefersReducedMotion()) return
    gsap.to(body.current, {
      scaleX: on ? 1.08 : 1,
      scaleY: on ? 0.92 : 1,
      transformOrigin: '50% 100%',
      duration: 0.4,
      ease: 'elastic.out(1, 0.4)',
    })
  }

  return (
    <div
      ref={root}
      className={styles.mascot}
      aria-hidden
      onPointerEnter={() => squish(true)}
      onPointerLeave={() => squish(false)}
    >
      <svg viewBox="0 0 200 210" className={styles.svg}>
        <defs>
          <radialGradient id="blob-body" cx="0.4" cy="0.3" r="0.85">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.6" stopColor="#ecebe6" />
            <stop offset="1" stopColor="#cfcdc4" />
          </radialGradient>
        </defs>

        <g ref={body}>
          {/* little sprout on top */}
          <path
            d="M100 34 C100 18 108 10 120 8 C116 20 110 28 100 34 Z"
            fill="#cfcdc4"
          />

          {/* soft round body */}
          <path
            d="M100 30
               C148 30 168 68 168 112
               C168 165 137 188 100 188
               C63 188 32 165 32 112
               C32 68 52 30 100 30 Z"
            fill="url(#blob-body)"
          />

          {/* blush cheeks */}
          <ellipse cx="62" cy="126" rx="13" ry="8" fill="#ff9e8a" opacity="0.55" />
          <ellipse cx="138" cy="126" rx="13" ry="8" fill="#ff9e8a" opacity="0.55" />

          {/* eyes */}
          <g ref={eyes}>
            <ellipse cx="74" cy="102" rx="16" ry="19" fill="#ffffff" />
            <ellipse cx="126" cy="102" rx="16" ry="19" fill="#ffffff" />
            <g ref={pupilL}>
              <circle cx="74" cy="104" r="10" fill="#171717" />
              <circle cx="78" cy="100" r="3.4" fill="#ffffff" />
              <circle cx="71" cy="107" r="1.6" fill="#ffffff" opacity="0.8" />
            </g>
            <g ref={pupilR}>
              <circle cx="126" cy="104" r="10" fill="#171717" />
              <circle cx="130" cy="100" r="3.4" fill="#ffffff" />
              <circle cx="123" cy="107" r="1.6" fill="#ffffff" opacity="0.8" />
            </g>
          </g>

          {/* tiny happy mouth */}
          <path
            d="M90 140 Q100 150 110 140"
            fill="none"
            stroke="#171717"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  )
}
