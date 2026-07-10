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
      <svg viewBox="0 0 200 220" className={styles.svg}>
        <defs>
          <linearGradient id="chrome-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f5f5f5" />
            <stop offset="0.45" stopColor="#c9c9c9" />
            <stop offset="0.55" stopColor="#8f8f8f" />
            <stop offset="1" stopColor="#dcdcdc" />
          </linearGradient>
        </defs>

        <g ref={body}>
          {/* antennae */}
          <line x1="70" y1="46" x2="60" y2="18" stroke="#8f8f8f" strokeWidth="3" />
          <circle cx="60" cy="14" r="6" fill="url(#chrome-body)" />
          <line x1="130" y1="46" x2="140" y2="18" stroke="#8f8f8f" strokeWidth="3" />
          <circle cx="140" cy="14" r="6" fill="url(#chrome-body)" />

          {/* body */}
          <rect
            x="30"
            y="44"
            width="140"
            height="150"
            rx="58"
            fill="url(#chrome-body)"
          />

          {/* feet */}
          <ellipse cx="72" cy="196" rx="20" ry="10" fill="#bdbdbd" />
          <ellipse cx="128" cy="196" rx="20" ry="10" fill="#bdbdbd" />

          {/* face */}
          <g ref={eyes}>
            <circle cx="76" cy="104" r="20" fill="#0a0a0a" />
            <circle cx="124" cy="104" r="20" fill="#0a0a0a" />
            <g ref={pupilL}>
              <circle cx="76" cy="104" r="8" fill="#fff" />
              <circle cx="79" cy="101" r="2.5" fill="#0a0a0a" opacity="0.35" />
            </g>
            <g ref={pupilR}>
              <circle cx="124" cy="104" r="8" fill="#fff" />
              <circle cx="127" cy="101" r="2.5" fill="#0a0a0a" opacity="0.35" />
            </g>
          </g>

          {/* smile */}
          <path
            d="M84 150 Q100 166 116 150"
            fill="none"
            stroke="#0a0a0a"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  )
}
