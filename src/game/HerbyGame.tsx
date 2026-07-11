import { useEffect, useRef, useState } from 'react'
import styles from './HerbyGame.module.css'

interface Seg {
  x1: number
  y1: number
  x2: number
  y2: number
}

/** y of a segment at a given x (null if x outside its span) */
function yAt(s: Seg, x: number): number | null {
  const lo = Math.min(s.x1, s.x2)
  const hi = Math.max(s.x1, s.x2)
  if (x < lo || x > hi) return null
  const t = (x - s.x1) / (s.x2 - s.x1 || 1)
  return s.y1 + t * (s.y2 - s.y1)
}

const GRAV = 0.6
const WALK = 1.7
const SNAP = 18 // how far below the feet we still count as "on" a line (slope tolerance)

/**
 * Draw Herby Home — a physics puzzle. Herby auto-walks right under gravity;
 * you draw platform lines with the mouse to bridge gaps and ramp him up to the
 * goal flag. Uses his walk / gravity / line-riding abilities.
 */
export function HerbyGame({ open, onClose }: { open: boolean; onClose: () => void }) {
  const area = useRef<HTMLDivElement>(null)
  const herbyEl = useRef<HTMLDivElement>(null)
  const preview = useRef<SVGLineElement>(null)
  const [lines, setLines] = useState<Seg[]>([])
  const [status, setStatus] = useState<'play' | 'won'>('play')
  const linesRef = useRef<Seg[]>([])
  linesRef.current = lines

  const dim = useRef({ w: 0, h: 0 })
  const level = useRef<{ start: Seg; goal: Seg; fixed: Seg[]; goalX: number; goalY: number; startX: number; startY: number }>()
  const drawing = useRef(false)
  const dstart = useRef({ x: 0, y: 0 })
  const herb = useRef({ x: 0, y: 0, vy: 0, ground: false, face: 1 })
  const raf = useRef(0)

  const buildLevel = () => {
    const el = area.current!
    const w = el.clientWidth
    const hgt = el.clientHeight
    dim.current = { w, h: hgt }
    const start: Seg = { x1: 30, y1: hgt - 70, x2: 200, y2: hgt - 70 }
    const goal: Seg = { x1: w - 210, y1: 150, x2: w - 40, y2: 150 }
    const fixed: Seg[] = [
      { x1: w * 0.42, y1: hgt - 190, x2: w * 0.58, y2: hgt - 190 },
    ]
    level.current = {
      start, goal, fixed,
      goalX: w - 120, goalY: 150,
      startX: 90, startY: hgt - 70,
    }
  }

  const resetHerby = () => {
    const L = level.current!
    herb.current = { x: L.startX, y: L.startY, vy: 0, ground: true, face: 1 }
    setStatus('play')
  }

  const allSegs = (): Seg[] => {
    const L = level.current!
    return [L.start, L.goal, ...L.fixed, ...linesRef.current]
  }

  const supportY = (x: number, y: number): number | null => {
    let best: number | null = null
    for (const s of allSegs()) {
      const sy = yAt(s, x)
      if (sy == null) continue
      if (sy >= y - 4 && sy <= y + SNAP) {
        if (best == null || sy < best) best = sy
      }
    }
    return best
  }
  const landingY = (x: number, prevY: number, newY: number): number | null => {
    let best: number | null = null
    for (const s of allSegs()) {
      const sy = yAt(s, x)
      if (sy == null) continue
      if (sy >= prevY - 2 && sy <= newY + 2) {
        if (best == null || sy < best) best = sy
      }
    }
    return best
  }

  const loop = () => {
    const h = herb.current
    const L = level.current
    if (L && status !== 'won') {
      if (h.ground) {
        const nx = h.x + WALK
        h.face = 1
        const sy = supportY(nx, h.y)
        if (sy != null) {
          h.x = nx
          h.y = sy
          h.vy = 0
        } else {
          h.ground = false // walked off the edge
        }
      } else {
        h.vy = Math.min(h.vy + GRAV, 22)
        const ny = h.y + h.vy
        const land = landingY(h.x, h.y, ny)
        if (land != null && h.vy >= 0) {
          h.y = land
          h.vy = 0
          h.ground = true
        } else {
          h.y = ny
          h.x += 0.4 // slight forward drift while falling
        }
      }
      // fell out of the world
      if (h.y > dim.current.h + 120) resetHerby()
      // reached the goal
      if (Math.abs(h.x - L.goalX) < 46 && Math.abs(h.y - L.goalY) < 46) setStatus('won')
    }

    if (herbyEl.current) {
      herbyEl.current.style.transform = `translate(${herb.current.x - 26}px, ${herb.current.y - 46}px) scaleX(${herb.current.face})`
    }
    raf.current = requestAnimationFrame(loop)
  }

  useEffect(() => {
    if (!open) return
    buildLevel()
    setLines([])
    resetHerby()
    raf.current = requestAnimationFrame(loop)
    const onResize = () => buildLevel()
    window.addEventListener('resize', onResize)
    document.body.style.overflow = 'hidden'
    return () => {
      cancelAnimationFrame(raf.current)
      window.removeEventListener('resize', onResize)
      document.body.style.overflow = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, status])

  // drawing
  const rel = (e: React.PointerEvent) => {
    const r = area.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  const onDown = (e: React.PointerEvent) => {
    if (status === 'won') return
    drawing.current = true
    dstart.current = rel(e)
    area.current?.setPointerCapture(e.pointerId)
  }
  const onMove = (e: React.PointerEvent) => {
    if (!drawing.current || !preview.current) return
    const p = rel(e)
    preview.current.setAttribute('x1', String(dstart.current.x))
    preview.current.setAttribute('y1', String(dstart.current.y))
    preview.current.setAttribute('x2', String(p.x))
    preview.current.setAttribute('y2', String(p.y))
    preview.current.style.opacity = '1'
  }
  const onUp = (e: React.PointerEvent) => {
    if (!drawing.current) return
    drawing.current = false
    if (preview.current) preview.current.style.opacity = '0'
    const p = rel(e)
    const d = Math.hypot(p.x - dstart.current.x, p.y - dstart.current.y)
    if (d > 24) setLines((ls) => [...ls, { x1: dstart.current.x, y1: dstart.current.y, x2: p.x, y2: p.y }])
  }

  if (!open) return null
  const L = level.current

  return (
    <div className={styles.overlay}>
      <div className={styles.head}>
        <div>
          <span className="eyebrow">( Play )</span>
          <h3 className={`display ${styles.title}`}>Draw Herby Home</h3>
          <p className={styles.hint}>Drag to draw lines. Herby walks right — build ramps & bridges to the flag.</p>
        </div>
        <div className={styles.controls}>
          <button onClick={() => setLines([])} data-cursor="grow">Clear</button>
          <button onClick={resetHerby} data-cursor="grow">Restart</button>
          <button onClick={onClose} className={styles.close} data-cursor="grow">Close ✕</button>
        </div>
      </div>

      <div
        ref={area}
        className={styles.arena}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
      >
        <svg className={styles.svg}>
          {L && (
            <>
              <line x1={L.start.x1} y1={L.start.y1} x2={L.start.x2} y2={L.start.y2} className={styles.platform} />
              <line x1={L.goal.x1} y1={L.goal.y1} x2={L.goal.x2} y2={L.goal.y2} className={styles.platform} />
              {L.fixed.map((s, i) => (
                <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} className={styles.platform} />
              ))}
            </>
          )}
          {lines.map((s, i) => (
            <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} className={styles.drawn} />
          ))}
          <line ref={preview} className={styles.preview} />
        </svg>

        {/* goal flag */}
        {L && (
          <div className={styles.flag} style={{ left: L.goalX, top: L.goalY }}>
            <span>🏁</span>
          </div>
        )}

        {/* Herby sprite */}
        <div ref={herbyEl} className={styles.herby}>
          <svg viewBox="0 0 200 174" width="52" height="45">
            <g fill="#d97757">
              <rect x="8" y="82" width="22" height="34" rx="2" />
              <rect x="170" y="82" width="22" height="34" rx="2" />
              <rect x="62" y="138" width="22" height="30" rx="2" />
              <rect x="116" y="138" width="22" height="30" rx="2" />
              <rect x="28" y="52" width="144" height="90" rx="5" />
              <ellipse cx="82" cy="97" rx="11" ry="13" fill="#20140f" />
              <ellipse cx="118" cy="97" rx="11" ry="13" fill="#20140f" />
              <circle cx="85" cy="94" r="3.2" fill="#fff" />
              <circle cx="121" cy="94" r="3.2" fill="#fff" />
            </g>
          </svg>
        </div>

        {status === 'won' && (
          <div className={styles.win}>
            <h2 className={`display ${styles.winTitle}`}>Herby&apos;s home! 🎉</h2>
            <div className={styles.winBtns}>
              <button onClick={resetHerby} data-cursor="grow">Play again</button>
              <button onClick={onClose} className={styles.close} data-cursor="grow">Done</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
