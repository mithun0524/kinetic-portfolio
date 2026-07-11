import { useEffect, useRef, useState } from 'react'
import styles from './HerbyGame.module.css'

interface Seg { x1: number; y1: number; x2: number; y2: number }
interface Pt { x: number; y: number }

function yAt(s: Seg, x: number): number | null {
  const lo = Math.min(s.x1, s.x2)
  const hi = Math.max(s.x1, s.x2)
  if (x < lo || x > hi) return null
  const t = (x - s.x1) / (s.x2 - s.x1 || 1)
  return s.y1 + t * (s.y2 - s.y1)
}
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]

const GRAV = 0.6
const WALK = 1.8
const SNAP = 18
const HOP_X = 155      // max gap he'll hop
const HOP_UP = 105
const HOP_DOWN = 165
const CARPET_X = 620   // max gap the carpet crosses
const HOP_H = 66
const CARPET_H = 150
const INK_MAX = 1900
const CARPETS = 2

const JUDGE = {
  steep: ['too steep!', 'whoa, steep!', 'cliff!!'],
  long: ['big bridge!', 'nice ramp~', 'looong'],
  ok: ['ooh a line!', 'nice!', 'thanks!', 'good one'],
  hop: ['hop!', 'up!', 'wheee', 'boing'],
  carpet: ['✨magic✨', 'i can fly!', 'no path? no problem!', 'whoosh~'],
  stuck: ['uh oh…', 'no way across…', 'help?'],
  win: ['home! ^-^', 'yay!! 🎉', 'made it!'],
  fall: ['woahh', '@_@', 'aaa!'],
}

/**
 * Draw Herby Home — a physics puzzle. Draw platform lines; Herby judges them
 * and picks the right move: WALK on them, HOP small gaps, or deploy his
 * FLYING CARPET (limited) for big gaps. Reach the flag to win.
 */
export function HerbyGame({ open, onClose }: { open: boolean; onClose: () => void }) {
  const area = useRef<HTMLDivElement>(null)
  const herbyEl = useRef<HTMLDivElement>(null)
  const preview = useRef<SVGLineElement>(null)
  const bubble = useRef<HTMLDivElement>(null)
  const bubbleTxt = useRef<HTMLSpanElement>(null)

  const [lines, setLines] = useState<Seg[]>([])
  const [status, setStatus] = useState<'play' | 'won' | 'dead'>('play')
  const [face, setFace] = useState<'normal' | 'happy' | 'dizzy' | 'angry'>('normal')
  const [carpets, setCarpets] = useState(CARPETS)
  const [ink, setInk] = useState(0)
  const [exitX, setExitX] = useState(200)
  const [ghostArrived, setGhostArrived] = useState(false)
  const handleClose = () => onClose() // App plays the shared curtain transition

  const linesRef = useRef<Seg[]>([])
  linesRef.current = lines
  const carpetsRef = useRef(CARPETS)
  carpetsRef.current = carpets

  const dim = useRef({ w: 0, h: 0 })
  const level = useRef<{ start: Seg; goal: Seg; fixed: Seg[]; goalX: number; goalY: number; startX: number; startY: number }>()
  const drawing = useRef(false)
  const dstart = useRef<Pt>({ x: 0, y: 0 })
  const herb = useRef({ x: 0, y: 0, vy: 0, mode: 'walk' as 'walk' | 'fall' | 'hop' | 'carpet' | 'charge' | 'stuck', face: 1, sx: 0, sy: 0, tx: 0, ty: 0, ctx: 0, cty: 0, t: 0, dur: 1, spin: 0 })
  const lastSay = useRef(0)
  const raf = useRef(0)
  const statusRef = useRef<'play' | 'won' | 'dead'>('play')
  statusRef.current = status
  const faceRef = useRef(face)
  faceRef.current = face

  // aliveness
  const eyesG = useRef<SVGGElement>(null)
  const pupilLeft = useRef<SVGCircleElement>(null)
  const pupilRight = useRef<SVGCircleElement>(null)
  const cursor = useRef({ x: -9999, y: -9999 })

  const say = (text: string, force = false) => {
    const t = typeof performance !== 'undefined' ? performance.now() : 0
    if (!force && t - lastSay.current < 900) return // cooldown so he doesn't spam
    lastSay.current = t
    if (bubbleTxt.current) bubbleTxt.current.textContent = text
    if (bubble.current) {
      bubble.current.style.opacity = '1'
      bubble.current.style.transform = 'translateX(-50%) scale(1)'
      clearTimeout((bubble.current as any)._t)
      ;(bubble.current as any)._t = setTimeout(() => {
        if (bubble.current) {
          bubble.current.style.opacity = '0'
          bubble.current.style.transform = 'translateX(-50%) scale(0.7)'
        }
      }, 1500)
    }
  }

  const buildLevel = () => {
    const el = area.current!
    const w = el.clientWidth
    const hgt = el.clientHeight
    dim.current = { w, h: hgt }
    level.current = {
      start: { x1: 30, y1: hgt - 70, x2: 200, y2: hgt - 70 },
      goal: { x1: w - 210, y1: 150, x2: w - 40, y2: 150 },
      fixed: [{ x1: w * 0.44, y1: hgt - 210, x2: w * 0.6, y2: hgt - 210 }],
      goalX: w - 120, goalY: 150, startX: 90, startY: hgt - 70,
    }
  }
  const resetHerby = () => {
    const L = level.current!
    herb.current = { ...herb.current, x: L.startX, y: L.startY, vy: 0, mode: 'walk', face: 1, t: 0, spin: 0 }
    herbyEl.current?.classList.remove(styles.angry)
    setStatus('play')
    setFace('normal')
    setGhostArrived(false)
    setCarpets(CARPETS)
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
      if (sy >= y - 4 && sy <= y + SNAP) if (best == null || sy < best) best = sy
    }
    return best
  }
  const landingY = (x: number, prevY: number, newY: number): number | null => {
    let best: number | null = null
    for (const s of allSegs()) {
      const sy = yAt(s, x)
      if (sy == null) continue
      if (sy >= prevY - 2 && sy <= newY + 2) if (best == null || sy < best) best = sy
    }
    return best
  }
  // nearest reachable landing point ahead (to the right), within reach
  const findTarget = (reach: number): Pt | null => {
    const h = herb.current
    let best: Pt | null = null
    let bd = Infinity
    for (const s of allSegs()) {
      const minx = Math.min(s.x1, s.x2)
      const maxx = Math.max(s.x1, s.x2)
      if (maxx <= h.x + 6) continue
      const lx = Math.max(minx, h.x + 8)
      if (lx > h.x + reach) continue
      const ly = yAt(s, lx)
      if (ly == null || ly < h.y - HOP_UP || ly > h.y + HOP_DOWN) continue
      const d = lx - h.x
      if (d < bd) { bd = d; best = { x: lx, y: ly } }
    }
    return best
  }
  const startArc = (t: Pt, mode: 'hop' | 'carpet') => {
    const h = herb.current
    h.sx = h.x; h.sy = h.y; h.tx = t.x; h.ty = t.y; h.t = 0
    h.dur = Math.max(18, Math.hypot(t.x - h.x, t.y - h.y) / (mode === 'carpet' ? 6 : 5))
    h.mode = mode
    h.face = 1
    if (mode === 'carpet') {
      herbyEl.current?.classList.add(styles.charged)
      say(pick(JUDGE.carpet))
    } else say(pick(JUDGE.hop))
  }

  const loop = () => {
    const h = herb.current
    const L = level.current
    if (L && statusRef.current === 'play') {
      if (h.mode === 'walk') {
        const nx = h.x + WALK
        const sy = supportY(nx, h.y)
        if (sy != null) {
          h.x = nx; h.y = sy; h.vy = 0
        } else if (supportY(h.x, h.y) == null) {
          // ground vanished from under him (e.g. you cleared his line) → fall
          h.mode = 'fall'
          h.vy = 1
        } else {
          // real edge (still standing) — judge & choose a power
          const hopT = findTarget(HOP_X)
          if (hopT) startArc(hopT, 'hop')
          else if (carpetsRef.current > 0) {
            const carT = findTarget(CARPET_X)
            if (carT) {
              // stop, react, and charge up before flying
              setCarpets((c) => c - 1)
              h.mode = 'charge'; h.t = 0; h.ctx = carT.x; h.cty = carT.y
              herbyEl.current?.classList.add(styles.charged)
              say(pick(['hmm… big gap', 'no path?', 'let me try…', 'one sec…', 'watch this…']))
            } else { h.mode = 'stuck'; say(pick(JUDGE.stuck)) }
          } else { h.mode = 'stuck'; say(pick(JUDGE.stuck)) }
        }
        if (Math.abs(h.x - L.goalX) < 46 && Math.abs(h.y - L.goalY) < 50) {
          setStatus('won'); setFace('happy'); setGhostArrived(false); setExitX(L.goalX)
          say(pick(JUDGE.win)); herbyEl.current?.classList.remove(styles.charged)
        }
      } else if (h.mode === 'stuck') {
        // stand still and wait for a new line — unless the ground is pulled away
        if (supportY(h.x, h.y) == null) { h.mode = 'fall'; h.vy = 1 }
      } else if (h.mode === 'charge') {
        // stand still and supercharge (~1s), then launch the carpet with a bubble
        h.t += 1
        if (h.t >= 60) startArc({ x: h.ctx, y: h.cty }, 'carpet')
      } else if (h.mode === 'hop' || h.mode === 'carpet') {
        h.t += 1 / h.dur
        const t = Math.min(h.t, 1)
        const H = h.mode === 'carpet' ? CARPET_H : HOP_H
        h.x = h.sx + (h.tx - h.sx) * t
        h.y = h.sy + (h.ty - h.sy) * t - H * Math.sin(Math.PI * t)
        if (t >= 1) {
          h.x = h.tx; h.y = h.ty; h.vy = 0; h.mode = 'walk'
          herbyEl.current?.classList.remove(styles.charged)
        }
      } else {
        // fall
        h.vy = Math.min(h.vy + GRAV, 22)
        const ny = h.y + h.vy
        const land = landingY(h.x, h.y, ny)
        if (land != null && h.vy >= 0) {
          h.y = land; h.vy = 0; h.mode = 'walk'; h.spin = 0
        } else {
          h.y = ny
          h.x += 0.4
          if (h.vy > 12) {
            // real plummet — tumble + scared
            h.spin += 16
            if (faceRef.current !== 'dizzy') setFace('dizzy')
            say('aaaa!')
          }
        }
        if (h.y > dim.current.h + 120) {
          // died — start the ghost sequence
          setExitX(Math.max(50, Math.min(dim.current.w - 50, h.x)))
          setGhostArrived(false)
          setStatus('dead')
        }
      }
    }

    const perf = typeof performance !== 'undefined' ? performance.now() : 0
    if (herbyEl.current) {
      const bob = h.mode === 'walk' ? Math.sin(perf * 0.007) * 2 : 0
      const rot = h.mode === 'fall' ? h.spin : 0
      herbyEl.current.style.transform = `translate(${h.x - 26}px, ${h.y - 46 + bob}px) scaleX(${h.face}) rotate(${rot}deg)`
    }
    // blink
    if (eyesG.current) {
      const tb = perf % 3000
      const sy = tb < 90 ? 0.12 : 1
      eyesG.current.setAttribute('transform', `translate(100 97) scale(1 ${sy}) translate(-100 -97)`)
    }
    // pupils track the cursor
    if (faceRef.current === 'normal' && pupilLeft.current && pupilRight.current && herbyEl.current) {
      const r = herbyEl.current.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = r.top + r.height * 0.45
      const ang = Math.atan2(cursor.current.y - cy, cursor.current.x - cx)
      const dd = Math.min(Math.hypot(cursor.current.x - cx, cursor.current.y - cy) / 50, 1) * 2.6
      const ox = Math.cos(ang) * dd * h.face
      const oy = Math.sin(ang) * dd
      pupilLeft.current.setAttribute('transform', `translate(${ox} ${oy})`)
      pupilRight.current.setAttribute('transform', `translate(${ox} ${oy})`)
    }
    raf.current = requestAnimationFrame(loop)
  }

  useEffect(() => {
    if (!open) return
    buildLevel()
    setLines([]); setInk(0); setCarpets(CARPETS);
    resetHerby()
    raf.current = requestAnimationFrame(loop)
    const onResize = () => buildLevel()
    const onCursor = (e: PointerEvent) => { cursor.current = { x: e.clientX, y: e.clientY } }
    window.addEventListener('resize', onResize)
    window.addEventListener('pointermove', onCursor)
    document.body.style.overflow = 'hidden'
    return () => {
      cancelAnimationFrame(raf.current)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onCursor)
      document.body.style.overflow = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Herby is pokeable but NOT draggable in the game
  const hi = useRef({ down: false, x: 0, y: 0, moved: false })
  const pokeTimes = useRef<number[]>([])
  const flashFace = (f: 'happy' | 'dizzy') => {
    setFace(f)
    setTimeout(() => { if (statusRef.current !== 'won' && face !== 'angry') setFace('normal') }, 1000)
  }
  // count recent pesters; returns how many in the last 3s
  const annoy = () => {
    const t = typeof performance !== 'undefined' ? performance.now() : 0
    pokeTimes.current.push(t)
    pokeTimes.current = pokeTimes.current.filter((x) => t - x < 3000)
    return pokeTimes.current.length
  }
  const goAngry = () => {
    setFace('angry')
    herbyEl.current?.classList.add(styles.angry)
    say(pick(['grr! stop it!', '>:( leave me be', 'rude!!', 'hmph!', 'no!! 😠']), true)
    setTimeout(() => {
      if (statusRef.current !== 'won') {
        setFace('normal')
        herbyEl.current?.classList.remove(styles.angry)
      }
    }, 1800)
  }
  const onHerbyEnter = (e: React.PointerEvent) => {
    e.stopPropagation()
    say(pick(['hi!', 'hehe~', '^-^', 'watchin me?', 'boop me!']))
    flashFace('happy')
  }
  const onHerbyDown = (e: React.PointerEvent) => {
    e.stopPropagation()
    hi.current = { down: true, x: e.clientX, y: e.clientY, moved: false }
    herbyEl.current?.setPointerCapture(e.pointerId)
  }
  const onHerbyMove = (e: React.PointerEvent) => {
    if (!hi.current.down) return
    e.stopPropagation()
    if (!hi.current.moved && Math.hypot(e.clientX - hi.current.x, e.clientY - hi.current.y) > 6) {
      hi.current.moved = true
      if (annoy() >= 4) goAngry()
      else {
        say(pick(['no cheating! 😤', 'nice try~', 'i walk myself!', 'no shortcuts!', 'hey!! >:(']), true)
        flashFace('dizzy')
      }
    }
  }
  const onHerbyUp = (e: React.PointerEvent) => {
    e.stopPropagation()
    herbyEl.current?.releasePointerCapture?.(e.pointerId)
    if (hi.current.down && !hi.current.moved) {
      if (annoy() >= 4) {
        goAngry()
      } else {
        say(pick(['boop!', 'hehe', 'yay!', 'again!', 'teehee', 'wheee']), true)
        flashFace('happy')
        if (herb.current.mode === 'walk' || herb.current.mode === 'stuck') {
          herb.current.vy = -11
          herb.current.mode = 'fall'
        }
      }
    }
    hi.current.down = false
  }

  const rel = (e: React.PointerEvent) => {
    const r = area.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  const onDown = (e: React.PointerEvent) => {
    if (status !== 'play' || ink >= INK_MAX) return
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
    if (d <= 24) return
    if (ink + d > INK_MAX) { say('out of ink!'); return }
    const seg = { x1: dstart.current.x, y1: dstart.current.y, x2: p.x, y2: p.y }
    setLines((ls) => [...ls, seg])
    setInk((i) => i + d)
    // a new line? give Herby another go if he was stuck
    if (herb.current.mode === 'stuck') herb.current.mode = 'walk'
    // Herby judges the line
    const slope = Math.abs((seg.y2 - seg.y1) / (seg.x2 - seg.x1 || 1))
    if (slope > 1.4) say(pick(JUDGE.steep))
    else if (d > 340) say(pick(JUDGE.long))
    else say(pick(JUDGE.ok))
  }

  if (!open) return null
  const L = level.current

  return (
    <div className={styles.overlay}>
      <div className={styles.head}>
        <div>
          <span className="eyebrow">( Play )</span>
          <h3 className={`display ${styles.title}`}>Draw Herby Home</h3>
          <p className={styles.hint}>Drag to draw lines. Herby reads them and walks, hops, or flies to the flag.</p>
        </div>
        <div className={styles.controls}>
          <button onClick={() => { setLines([]); setInk(0) }} data-cursor="grow">Clear</button>
          <button onClick={resetHerby} data-cursor="grow">Restart</button>
          <button onClick={handleClose} className={styles.close} data-cursor="grow">Close ✕</button>
        </div>
      </div>

      <div ref={area} className={styles.arena} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}>
        {/* abilities hint + resources */}
        <div className={styles.legend}>
          <div className={styles.legendTitle}>Herby can</div>
          <div className={styles.legendRow}><span>🚶</span> walk on your lines</div>
          <div className={styles.legendRow}><span>⤴</span> hop small gaps</div>
          <div className={styles.legendRow}><span>🪄</span> fly a carpet over big gaps</div>
          <div className={styles.meta}>
            <span>Carpets: {'✦'.repeat(carpets) || '—'}</span>
            <span className={styles.inkWrap}>Ink <i className={styles.inkBar}><i style={{ width: `${100 - (ink / INK_MAX) * 100}%` }} /></i></span>
          </div>
        </div>

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

        {L && (
          <div className={styles.flag} style={{ left: L.goalX, top: L.goalY }}><span>🏁</span></div>
        )}

        <div
          ref={herbyEl}
          className={styles.herby}
          onPointerEnter={onHerbyEnter}
          onPointerDown={onHerbyDown}
          onPointerMove={onHerbyMove}
          onPointerUp={onHerbyUp}
        >
          <div ref={bubble} className={styles.bubble}><span ref={bubbleTxt} /></div>
          <svg viewBox="0 0 200 174" width="52" height="45" className={styles.sprite}>
            <g fill="#d97757">
              <rect x="8" y="82" width="22" height="34" rx="2" />
              <rect x="170" y="82" width="22" height="34" rx="2" />
              <rect x="62" y="138" width="22" height="30" rx="2" />
              <rect x="116" y="138" width="22" height="30" rx="2" />
              <rect x="28" y="52" width="144" height="90" rx="5" />
              {face === 'happy' ? (
                <g stroke="#20140f" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none">
                  <path d="M72 90 L92 100 L72 110" />
                  <path d="M128 90 L108 100 L128 110" />
                  <path d="M86 120 Q100 134 114 120" strokeWidth="5" />
                </g>
              ) : face === 'angry' ? (
                <g>
                  <g stroke="#20140f" strokeWidth="7" strokeLinecap="round">
                    <path d="M70 86 L94 96" />
                    <path d="M130 86 L106 96" />
                  </g>
                  <ellipse cx="84" cy="105" rx="7" ry="8" fill="#20140f" />
                  <ellipse cx="116" cy="105" rx="7" ry="8" fill="#20140f" />
                  <path d="M90 126 Q100 118 110 126" fill="none" stroke="#20140f" strokeWidth="4.5" strokeLinecap="round" />
                </g>
              ) : face === 'dizzy' ? (
                <g stroke="#20140f" strokeWidth="6" strokeLinecap="round">
                  <path d="M76 92 L92 108" /><path d="M92 92 L76 108" />
                  <path d="M108 92 L124 108" /><path d="M124 92 L108 108" />
                  <path d="M90 122 q5 -6 10 0 q5 6 10 0" fill="none" strokeWidth="4.5" />
                </g>
              ) : (
                <g ref={eyesG}>
                  <ellipse cx="82" cy="97" rx="11" ry="13" fill="#20140f" />
                  <ellipse cx="118" cy="97" rx="11" ry="13" fill="#20140f" />
                  <circle ref={pupilLeft} cx="85" cy="94" r="3.2" fill="#fff" />
                  <circle ref={pupilRight} cx="121" cy="94" r="3.2" fill="#fff" />
                  <path d="M89 124 Q100 131 111 124" fill="none" stroke="#20140f" strokeWidth="4.5" strokeLinecap="round" />
                </g>
              )}
            </g>
          </svg>
          <span className={styles.carpet} />
        </div>

        {status === 'won' && (
          <div className={styles.dead}>
            <div className={styles.confetti} aria-hidden>
              {Array.from({ length: 14 }).map((_, i) => <span key={i} />)}
            </div>
            {/* happy Herby flies in to you */}
            <div
              className={styles.winHerby}
              style={{ ['--sx' as string]: `${exitX}px` }}
              onAnimationEnd={(e) => { if (e.animationName.includes('winCome')) setGhostArrived(true) }}
            >
              <div className={styles.ghostBubble}>{ghostArrived ? 'we made it! ^-^' : 'wheeee!'}</div>
              <svg viewBox="0 0 200 174" width="132" height="115" className={styles.ghostSvg}>
                <g fill="#d97757">
                  <rect x="8" y="82" width="22" height="34" rx="2" />
                  <rect x="170" y="82" width="22" height="34" rx="2" />
                  <rect x="62" y="138" width="22" height="30" rx="2" />
                  <rect x="116" y="138" width="22" height="30" rx="2" />
                  <rect x="28" y="52" width="144" height="90" rx="5" />
                </g>
                <g stroke="#20140f" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none">
                  <path d="M72 90 L92 100 L72 110" />
                  <path d="M128 90 L108 100 L128 110" />
                </g>
              </svg>
            </div>

            {ghostArrived && (
              <div className={styles.deadPanel}>
                <h2 className={`display ${styles.winTitle}`}>Herby&apos;s home! 🎉</h2>
                <div className={styles.winBtns}>
                  <button onClick={resetHerby} data-cursor="grow">Play again</button>
                  <button onClick={handleClose} className={styles.close} data-cursor="grow">Done</button>
                </div>
              </div>
            )}
          </div>
        )}

        {status === 'dead' && (
          <div className={styles.dead}>
            {/* ghost Herby floats up from where he fell and zooms toward you */}
            <div
              className={styles.ghost}
              style={{ ['--sx' as string]: `${exitX}px` }}
              onAnimationEnd={(e) => { if (e.animationName.includes('ghostCome')) setGhostArrived(true) }}
            >
              <div className={styles.ghostBubble}>{ghostArrived ? 'i couldn’t make it… 🥺' : 'wooOOoo~'}</div>
              {/* a ghostly, sad Herby */}
              <svg viewBox="0 0 200 174" width="132" height="115" className={styles.ghostSvg}>
                <g fill="#ece9e2" opacity="0.9">
                  <rect x="8" y="82" width="22" height="34" rx="2" />
                  <rect x="170" y="82" width="22" height="34" rx="2" />
                  <rect x="62" y="138" width="22" height="30" rx="2" />
                  <rect x="116" y="138" width="22" height="30" rx="2" />
                  <rect x="28" y="52" width="144" height="90" rx="5" />
                </g>
                <g stroke="#20140f" strokeWidth="7" strokeLinecap="round" fill="none">
                  <path d="M72 96 Q82 108 92 100" />
                  <path d="M108 100 Q118 108 128 96" />
                </g>
                <ellipse cx="86" cy="116" rx="3.5" ry="6" fill="#bfe3ff" />
              </svg>
            </div>

            {ghostArrived && (
              <div className={styles.deadPanel}>
                <p className={styles.deadText}>Herby fell off… try again?</p>
                <div className={styles.winBtns}>
                  <button onClick={resetHerby} data-cursor="grow">New game</button>
                  <button onClick={handleClose} className={styles.close} data-cursor="grow">Done</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
