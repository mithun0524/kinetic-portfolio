import { useEffect, useRef, useState } from 'react'
import g from './HerbyGame.module.css'
import styles from './HerbyRunner.module.css'

/**
 * Herby Runner — a one-thumb, portrait-friendly game for phones.
 * Herby auto-runs; TAP anywhere to hop a gap. Tap again mid-air to pop his
 * magic carpet (limited) and save a mistimed jump. Reach the flag to get home.
 */

interface Seg { x0: number; w: number }

const GRAV = 0.9
const JUMP = 16
const CARPETS = 3
const SX_RATIO = 0.26 // Herby's fixed screen x
const HERB_W = 52
const HERB_H = 45

export function HerbyRunner({ open, onClose }: { open: boolean; onClose: () => void }) {
  const area = useRef<HTMLDivElement>(null)
  const herbyEl = useRef<HTMLDivElement>(null)
  const flagEl = useRef<HTMLDivElement>(null)
  const groundWrap = useRef<HTMLDivElement>(null)
  const fill = useRef<HTMLDivElement>(null)
  const raf = useRef(0)

  const [status, setStatus] = useState<'play' | 'dead' | 'won'>('play')
  const [carpets, setCarpets] = useState(CARPETS)
  const [face, setFace] = useState<'normal' | 'happy' | 'dizzy'>('normal')

  // world / physics state kept in refs (per-frame, no re-render)
  const W = useRef(0)
  const H = useRef(0)
  const GY = useRef(0)
  const SX = useRef(0)
  const segs = useRef<Seg[]>([])
  const flagX = useRef(0)
  const worldX = useRef(0)
  const speed = useRef(3.6)
  const y = useRef(0) // feet y
  const vy = useRef(0)
  const onGround = useRef(true)
  const carpetUsed = useRef(false)
  const carpetsRef = useRef(CARPETS)
  const statusRef = useRef<'play' | 'dead' | 'won'>('play')
  const segEls = useRef<(HTMLDivElement | null)[]>([])
  const [segCount, setSegCount] = useState(0)

  const build = () => {
    const el = area.current!
    W.current = el.clientWidth
    H.current = el.clientHeight
    GY.current = H.current - 84
    SX.current = W.current * SX_RATIO
    // generate platforms with clearable gaps
    const list: Seg[] = []
    let x = -80
    list.push({ x0: x, w: SX.current + 260 }) // runway under Herby
    x = list[0].x0 + list[0].w
    const GAPS = 11
    for (let i = 0; i < GAPS; i++) {
      const wide = i > 2 && i % 4 === 0 // a few wide (carpet-worthy) gaps
      const gap = wide ? 150 + Math.random() * 40 : 70 + Math.random() * 45
      const plat = 150 + Math.random() * 120
      x += gap
      list.push({ x0: x, w: plat })
      x += plat
    }
    // final home platform + flag
    list.push({ x0: x + 90, w: 460 })
    flagX.current = x + 90 + 150
    segs.current = list
    segEls.current = []
    setSegCount(list.length)
    // reset runner
    worldX.current = 0
    speed.current = 3.6
    y.current = GY.current
    vy.current = 0
    onGround.current = true
    carpetUsed.current = false
    carpetsRef.current = CARPETS
    statusRef.current = 'play'
    setCarpets(CARPETS)
    setStatus('play')
    setFace('normal')
  }

  const groundAt = (worldPos: number) =>
    segs.current.some((s) => worldPos >= s.x0 && worldPos <= s.x0 + s.w)

  const loop = () => {
    raf.current = requestAnimationFrame(loop)
    if (statusRef.current !== 'play') return

    // ramp speed slightly with distance
    speed.current = Math.min(6, 3.6 + worldX.current * 0.00035)
    worldX.current += speed.current

    // physics
    vy.current += GRAV
    y.current += vy.current
    const herbWorld = worldX.current + SX.current
    if (y.current >= GY.current) {
      if (groundAt(herbWorld)) {
        y.current = GY.current
        vy.current = 0
        onGround.current = true
        carpetUsed.current = false
      } else {
        onGround.current = false // over a gap → keep falling
      }
    } else {
      onGround.current = false
    }

    // win / lose
    if (herbWorld >= flagX.current) return win()
    if (y.current > H.current + 80) return die()

    // paint
    const hx = SX.current
    const hy = y.current - HERB_H
    const he = herbyEl.current
    if (he) he.style.transform = `translate(${hx}px, ${hy}px)`
    // ground segments
    segs.current.forEach((s, i) => {
      const node = segEls.current[i]
      if (!node) return
      // set size here too so a Restart (same seg count → no re-render) still updates
      node.style.width = `${s.w}px`
      node.style.top = `${GY.current}px`
      node.style.height = `${Math.max(0, H.current - GY.current)}px`
      node.style.transform = `translateX(${s.x0 - worldX.current}px)`
    })
    if (flagEl.current) {
      flagEl.current.style.top = `${GY.current}px`
      flagEl.current.style.transform = `translateX(${flagX.current - worldX.current}px)`
    }
    if (fill.current) fill.current.style.width = `${Math.min(100, (herbWorld / flagX.current) * 100)}%`
  }

  const win = () => {
    statusRef.current = 'won'
    setStatus('won')
    setFace('happy')
  }
  const die = () => {
    statusRef.current = 'dead'
    setStatus('dead')
    setFace('dizzy')
  }

  const tap = () => {
    if (statusRef.current !== 'play') return
    if (onGround.current) {
      vy.current = -JUMP
      onGround.current = false
    } else if (!carpetUsed.current && carpetsRef.current > 0) {
      // magic carpet: mid-air save / extend the hop
      vy.current = -JUMP * 0.92
      carpetUsed.current = true
      carpetsRef.current -= 1
      setCarpets(carpetsRef.current)
      herbyEl.current?.classList.add(styles.charged)
      setTimeout(() => herbyEl.current?.classList.remove(styles.charged), 600)
    }
  }

  useEffect(() => {
    if (!open) return
    build()
    raf.current = requestAnimationFrame(loop)
    const onResize = () => build()
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(raf.current)
      window.removeEventListener('resize', onResize)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (!open) return null

  return (
    <div className={g.overlay}>
      <div className={g.head}>
        <div>
          <span className="eyebrow">( Play )</span>
          <h2 className={`display ${g.title}`}>Run Herby Home</h2>
          <p className={g.hint}>Tap to hop the gaps. Tap again mid-air for his carpet.</p>
        </div>
        <div className={g.controls}>
          <button onClick={build} data-cursor="grow">Restart</button>
          <button onClick={onClose} className={g.close} data-cursor="grow">Close ✕</button>
        </div>
      </div>

      <div ref={area} className={`${g.arena} ${styles.arena}`} onPointerDown={tap}>
        {/* HUD */}
        <div className={styles.hud}>
          <span className={styles.carpets}>Carpets: {'✦'.repeat(carpets) || '—'}</span>
          <span className={styles.track}><i ref={fill} /></span>
        </div>

        {/* ground platforms */}
        <div ref={groundWrap}>
          {Array.from({ length: segCount }).map((_, i) => (
            <div
              key={i}
              ref={(el) => (segEls.current[i] = el)}
              className={styles.ground}
              style={{ top: GY.current, width: segs.current[i]?.w, height: Math.max(0, H.current - GY.current) }}
            />
          ))}
        </div>

        {/* flag */}
        <div ref={flagEl} className={styles.flag} style={{ top: GY.current }}><span>🏁</span></div>

        {/* Herby */}
        <div ref={herbyEl} className={styles.herby}>
          <svg viewBox="0 0 200 174" width={HERB_W} height={HERB_H} className={status === 'play' ? styles.bob : ''}>
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
              ) : face === 'dizzy' ? (
                <g stroke="#20140f" strokeWidth="6" strokeLinecap="round">
                  <path d="M76 92 L92 108" /><path d="M92 92 L76 108" />
                  <path d="M108 92 L124 108" /><path d="M124 92 L108 108" />
                </g>
              ) : (
                <g>
                  <ellipse cx="82" cy="97" rx="11" ry="13" fill="#20140f" />
                  <ellipse cx="118" cy="97" rx="11" ry="13" fill="#20140f" />
                  <circle cx="86" cy="94" r="3.2" fill="#fff" />
                  <circle cx="122" cy="94" r="3.2" fill="#fff" />
                  <path d="M91 120 Q100 127 109 120" fill="none" stroke="#20140f" strokeWidth="4.5" strokeLinecap="round" />
                </g>
              )}
            </g>
          </svg>
        </div>

        {/* end states */}
        {status !== 'play' && (
          <div className={styles.card}>
            <p className={styles.cardTitle}>{status === 'won' ? 'Herby’s home! 🎉' : 'oops — he fell!'}</p>
            <button className={styles.retry} onClick={build} data-cursor="grow">
              {status === 'won' ? 'Play again' : 'Try again'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
