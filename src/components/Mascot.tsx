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
export function Mascot({ ground = false, range = 80 }: { ground?: boolean; range?: number } = {}) {
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
  const legTweens = useRef<gsap.core.Tween[]>([])

  const busy = useRef(false)
  const hovering = useRef(false)
  const drag_ = useRef({ active: false, moved: false, sx: 0, sy: 0, ox: 0, oy: 0 })

  const face = (dir: number) => gsap.to(facer.current, { scaleX: dir, duration: 0.25, overwrite: 'auto' })

  useGSAP(
    () => {
      gsap.set(eyesHappy.current, { autoAlpha: 0 })
      gsap.set(spark.current, { autoAlpha: 0 })
      if (prefersReducedMotion()) return

      const span = range / 80 * 4.5
      walkTl.current = gsap
        .timeline({ repeat: -1 })
        .add(() => face(1))
        .to(walker.current, { x: range, duration: span, ease: 'none' })
        .add(() => face(-1))
        .to(walker.current, { x: -range, duration: span, ease: 'none' })

      // stepping legs + waddle (tracked so drag can freeze them)
      const stepL = gsap.to(legL.current, { y: -7, duration: 0.28, repeat: -1, yoyo: true, ease: 'sine.inOut' })
      const stepR = gsap.to(legR.current, { y: -7, duration: 0.28, repeat: -1, yoyo: true, ease: 'sine.inOut' })
      stepR.progress(0.5)
      const waddle = gsap.to(facer.current, { rotation: 2.5, duration: 0.28, repeat: -1, yoyo: true, ease: 'sine.inOut' })
      legTweens.current = [stepL, stepR, waddle]

      // blink
      const blink = () => {
        gsap.to(eyesOpen.current, { scaleY: 0.1, transformOrigin: '50% 50%', duration: 0.08, yoyo: true, repeat: 1 })
        gsap.delayedCall(2.6, blink)
      }
      gsap.delayedCall(2.6, blink)

      // random idle antics — occasional hop or look-around
      const lookAround = () => {
        const dirs = [
          [-4, -2],
          [4, -2],
          [0, 3],
          [-4, 2],
          [4, 2],
        ]
        const [dx, dy] = dirs[Math.floor(Math.random() * dirs.length)]
        gsap.to([pupilL.current, pupilR.current], {
          x: dx,
          y: dy,
          duration: 0.3,
          yoyo: true,
          repeat: 1,
          ease: 'power2.inOut',
        })
      }
      const idle = () => {
        gsap.delayedCall(3 + Math.random() * 4, () => {
          if (!busy.current && !hovering.current && !drag_.current.active) {
            if (Math.random() < 0.55) hop()
            else lookAround()
          }
          idle()
        })
      }
      idle()

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

  const startWalking = () => {
    walkTl.current?.resume()
    legTweens.current.forEach((t) => t.resume())
  }
  const stopWalking = () => {
    walkTl.current?.pause()
    legTweens.current.forEach((t) => t.pause())
    gsap.to([legL.current, legR.current], { y: 0, duration: 0.2, ease: 'power2.out' })
    gsap.to(facer.current, { rotation: 0, duration: 0.2 })
  }
  const lean = (on: boolean) =>
    gsap.to(body.current, {
      scaleX: on ? 1.06 : 1,
      scaleY: on ? 0.94 : 1,
      rotation: on ? 3 : 0,
      transformOrigin: '50% 100%',
      duration: 0.5,
      ease: 'elastic.out(1, 0.4)',
    })

  const hover = (on: boolean) => {
    if (prefersReducedMotion() || drag_.current.active) return
    hovering.current = on
    if (busy.current) return
    if (on) {
      stopWalking()
      showHappy(true)
      lean(true)
    } else {
      startWalking()
      showHappy(false)
      lean(false)
    }
  }

  const hop = () => {
    if (prefersReducedMotion() || busy.current) return
    busy.current = true
    stopWalking()
    showHappy(true)
    gsap
      .timeline({
        onComplete: () => {
          busy.current = false
          gsap.set(body.current, { rotation: 0 })
          // if the pointer is still on it, stay stopped & happy; else walk again
          if (hovering.current) {
            showHappy(true)
          } else {
            showHappy(false)
            startWalking()
          }
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
      // "picked up" pose: freeze the legs/waddle and tuck legs in
      legTweens.current.forEach((t) => t.pause())
      gsap.to([legL.current, legR.current], { y: 0, duration: 0.2, ease: 'power2.out' })
      gsap.to(facer.current, { rotation: 0, duration: 0.2 })
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
    dropAndFall()
  }

  // ---- gravity physics ----
  const feetBottom = () => body.current?.getBoundingClientRect().bottom ?? 0
  const feetCenterX = () => {
    const r = body.current?.getBoundingClientRect()
    return r ? r.left + r.width / 2 : 0
  }

  // every real text block becomes a ledge; skip moving strips + the mascots
  const getSurfaces = () => {
    const els = document.querySelectorAll<HTMLElement>(
      'main h1, main h2, main h3, main h4, main p, main li, main a, [data-solid]'
    )
    const raw: { left: number; right: number; top: number }[] = []
    els.forEach((el) => {
      if (el.closest('[data-nofloor]')) return
      const r = el.getBoundingClientRect()
      if (r.width < 50 || r.height < 8) return
      if (!(el.textContent || '').trim() && !el.hasAttribute('data-solid')) return
      raw.push({ left: r.left, right: r.right, top: r.top })
    })
    // merge text sharing a line into one wide ledge (kills micro-hops)
    raw.sort((a, b) => a.top - b.top)
    const merged: { left: number; right: number; top: number }[] = []
    for (const s of raw) {
      const m = merged.find(
        (x) => Math.abs(x.top - s.top) < 10 && s.left < x.right + 24 && s.right > x.left - 24
      )
      if (m) {
        m.left = Math.min(m.left, s.left)
        m.right = Math.max(m.right, s.right)
      } else merged.push({ ...s })
    }
    return merged
  }

  const dropAndFall = () => {
    busy.current = true
    walkTl.current?.pause()
    legTweens.current.forEach((t) => t.pause())
    gsap.to([legL.current, legR.current], { y: 0, duration: 0.15 })
    gsap.to(body.current, { scale: 1, duration: 0.2 })
    showHappy(false)

    // find the highest solid surface directly below the feet
    const startFeet = feetBottom()
    const fx = feetCenterX()
    let target = window.innerHeight - 6 // floor fallback
    getSurfaces().forEach((r) => {
      if (fx >= r.left && fx <= r.right && r.top >= startFeet - 2 && r.top < target) {
        target = r.top
      }
    })

    let v = 0
    const g = 1.6
    const fall = () => {
      v = Math.min(v + g, 28) // cap terminal velocity so tall drops stay readable
      const y = (gsap.getProperty(drag.current, 'y') as number) + v
      gsap.set(drag.current, { y })
      if (feetBottom() >= target) {
        const over = feetBottom() - target
        gsap.set(drag.current, { y: (gsap.getProperty(drag.current, 'y') as number) - over })
        gsap.ticker.remove(fall)
        land()
      }
    }
    gsap.ticker.add(fall)
  }

  const land = () => {
    gsap
      .timeline()
      .to(body.current, { scaleY: 0.7, scaleX: 1.25, transformOrigin: '50% 100%', duration: 0.08 })
      .to(body.current, { scaleY: 1, scaleX: 1, duration: 0.35, ease: 'elastic.out(1, 0.4)' })
    // dust sparkle
    gsap.set(spark.current, { autoAlpha: 1, scale: 0.3, y: 20, transformOrigin: '50% 50%' })
    gsap.timeline().to(spark.current, { scale: 0.9, y: -6, duration: 0.4, ease: 'power2.out' }).to(spark.current, { autoAlpha: 0, duration: 0.3 }, '-=0.1')
    gsap.delayedCall(0.5, returnHome)
  }

  const returnHome = () => {
    legTweens.current.forEach((t) => t.resume())

    // map between viewport pixels and the drag transform (home = drag 0,0)
    const dragX0 = (gsap.getProperty(drag.current, 'x') as number) || 0
    const dragY0 = (gsap.getProperty(drag.current, 'y') as number) || 0
    const homeFeetX = feetCenterX() - dragX0
    const homeFeetY = feetBottom() - dragY0
    const toDragX = (px: number) => px - homeFeetX
    const toDragY = (py: number) => py - homeFeetY

    const surfaces = getSurfaces()

    let cx = feetCenterX()
    let cy = feetBottom()
    const REACH = 320 // how far horizontally it can reach a ledge to hop onto

    const tl = gsap.timeline({
      onComplete: () => {
        busy.current = false
        if (hovering.current) stopWalking()
        else startWalking()
      },
    })

    const clampX = (s: { left: number; right: number }) => gsap.utils.clamp(s.left + 18, s.right - 18, homeFeetX)

    const walkTo = (px: number) => {
      const d = Math.abs(px - cx)
      if (d < 3) return
      face(px < cx ? -1 : 1)
      tl.to(drag.current, { x: toDragX(px), duration: gsap.utils.clamp(0.2, 0.9, d / 260), ease: 'power2.inOut' })
      cx = px
    }
    const hopTo = (px: number, py: number) => {
      face(px < cx ? -1 : 1)
      const up = gsap.utils.clamp(60, 140, cy - py + 34)
      tl.to(body.current, { scaleY: 0.8, scaleX: 1.2, transformOrigin: '50% 100%', duration: 0.08 })
        .to(drag.current, { x: toDragX(px), duration: 0.55, ease: 'power1.inOut' })
        .to(
          drag.current,
          {
            keyframes: [
              { y: toDragY(py) - up, duration: 0.26, ease: 'power2.out' },
              { y: toDragY(py), duration: 0.3, ease: 'power2.in' },
            ],
          },
          '<'
        )
        .to(body.current, { scaleY: 1.12, scaleX: 0.9, duration: 0.2 }, '<')
        .to(body.current, { scaleY: 1, scaleX: 1, duration: 0.3, ease: 'elastic.out(1, 0.4)' })
      cx = px
      cy = py
    }

    // climb ledge-by-ledge toward home, biased to move homeward each hop
    let guard = 0
    while (guard++ < 16) {
      // arrived at home level → walk the last stretch
      if (Math.abs(cy - homeFeetY) < 8) {
        walkTo(homeFeetX)
        break
      }
      // home is below (rare after a fall): walk over, then drop
      if (homeFeetY > cy + 8) {
        walkTo(homeFeetX)
        tl.to(drag.current, { y: 0, duration: 0.45, ease: 'power2.in' })
        break
      }
      // ledges above, meaningful climb, within reach
      const cands = surfaces.filter(
        (s) => s.top <= cy - 24 && s.top >= homeFeetY - 8 && s.right >= cx - REACH && s.left <= cx + REACH
      )
      if (cands.length) {
        // take the next level up (highest tops), then the one closest to home x
        const maxTop = Math.max(...cands.map((c) => c.top))
        const band = cands.filter((c) => c.top >= maxTop - 70)
        band.sort((a, b) => Math.abs(clampX(a) - homeFeetX) - Math.abs(clampX(b) - homeFeetX))
        const s = band[0]
        const targetX = clampX(s)
        walkTo(targetX)
        hopTo(targetX, s.top)
      } else {
        // nothing reachable — one big hop straight home
        hopTo(homeFeetX, homeFeetY)
        break
      }
    }
    // guarantee an exact settle at home
    tl.to(drag.current, { x: 0, y: 0, duration: 0.3, ease: 'power2.out' })
  }

  return (
    <div
      ref={root}
      className={`${styles.mascot} ${ground ? styles.ground : ''}`}
      aria-hidden
      data-nofloor
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
              <svg viewBox="0 0 200 174" className={styles.svg}>
                <g ref={spark} fill="var(--m)">
                  <path d="M100 12 L104 26 L118 30 L104 34 L100 48 L96 34 L82 30 L96 26 Z" />
                </g>

                <g ref={body}>
                  {/* side nubs */}
                  <rect x="8" y="82" width="22" height="34" rx="2" fill="var(--m)" />
                  <rect x="170" y="82" width="22" height="34" rx="2" fill="var(--m)" />
                  {/* legs */}
                  <rect ref={legL} x="62" y="138" width="22" height="30" rx="2" fill="var(--m)" />
                  <rect ref={legR} x="116" y="138" width="22" height="30" rx="2" fill="var(--m)" />
                  {/* wide body, small radius */}
                  <rect x="28" y="52" width="144" height="90" rx="5" fill="var(--m)" />

                  <g ref={eyesOpen}>
                    <ellipse cx="82" cy="97" rx="11" ry="13" fill="#20140f" />
                    <ellipse cx="118" cy="97" rx="11" ry="13" fill="#20140f" />
                    <g ref={pupilL}>
                      <circle cx="85" cy="94" r="3.2" fill="#fff" />
                    </g>
                    <g ref={pupilR}>
                      <circle cx="121" cy="94" r="3.2" fill="#fff" />
                    </g>
                  </g>

                  <g ref={eyesHappy} stroke="#20140f" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none">
                    <path d="M72 86 L92 99 L72 112" />
                    <path d="M128 86 L108 99 L128 112" />
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
