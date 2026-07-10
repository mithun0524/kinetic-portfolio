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
          <linearGradient id="chrome-blob" x1="0.3" y1="0" x2="0.6" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.35" stopColor="#e2e4e8" />
            <stop offset="0.52" stopColor="#a9adb5" />
            <stop offset="0.7" stopColor="#7c8088" />
            <stop offset="1" stopColor="#c6c9cf" />
          </linearGradient>
        </defs>

        {/* contact shadow */}
        <ellipse cx="100" cy="192" rx="52" ry="10" fill="#000" opacity="0.35" />

        <g ref={body}>
          {/* clean rounded chrome droplet */}
          <ellipse cx="100" cy="106" rx="72" ry="76" fill="url(#chrome-blob)" />

          {/* glossy specular highlights (liquid-metal shine) */}
          <ellipse cx="74" cy="58" rx="30" ry="16" fill="#ffffff" opacity="0.75" />
          <circle cx="140" cy="150" r="10" fill="#ffffff" opacity="0.25" />

          {/* eyes */}
          <g ref={eyes}>
            <ellipse cx="78" cy="104" rx="15" ry="17" fill="#141414" />
            <ellipse cx="122" cy="104" rx="15" ry="17" fill="#141414" />
            <g ref={pupilL}>
              <circle cx="82" cy="100" r="4.5" fill="#ffffff" />
              <circle cx="74" cy="108" r="2" fill="#ffffff" opacity="0.7" />
            </g>
            <g ref={pupilR}>
              <circle cx="126" cy="100" r="4.5" fill="#ffffff" />
              <circle cx="118" cy="108" r="2" fill="#ffffff" opacity="0.7" />
            </g>
          </g>

          {/* tiny happy mouth */}
          <path
            d="M90 138 Q100 148 110 138"
            fill="none"
            stroke="#141414"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  )
}
