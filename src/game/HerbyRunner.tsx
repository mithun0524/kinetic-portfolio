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
const JUMP = 17
const CARPETS = 3
const SX_RATIO = 0.26 // Herby's fixed screen x
const HERB_W = 52
const HERB_H = 45
const COYOTE = 7 // frames after leaving an edge where a tap still counts as a hop

export function HerbyRunner({ open, onClose }: { open: boolean; onClose: () => void }) {
  const area = useRef<HTMLDivElement>(null)
  const herbyEl = useRef<HTMLDivElement>(null)
  const flagEl = useRef<HTMLDivElement>(null)
  const groundWrap = useRef<HTMLDivElement>(null)
  const fill = useRef<HTMLDivElement>(null)
  const raf = useRef(0)

  const [status, setStatus] = useState<'ready' | 'play' | 'dead' | 'won'>('ready')
  const [carpets, setCarpets] = useState(CARPETS)
  const [face, setFace] = useState<'normal' | 'happy' | 'dizzy'>('normal')
  const [exitX, setExitX] = useState(0)
  const [ghostArrived, setGhostArrived] = useState(false)
  const [finalScore, setFinalScore] = useState(0)
  const [best, setBest] = useState(0)
  const [isNewBest, setIsNewBest] = useState(false)
  const bestRef = useRef(0)
  const scoreEl = useRef<HTMLSpanElement>(null)

  // load persisted high score once
  useEffect(() => {
    try {
      const b = Number(localStorage.getItem('herbyRunnerBest') || 0)
      if (b > 0) { bestRef.current = b; setBest(b) }
    } catch { /* localStorage blocked — just skip */ }
  }, [])

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
  const sinceGround = useRef(0)
  const carpetUsed = useRef(false)
  const carpetsRef = useRef(CARPETS)
  const statusRef = useRef<'ready' | 'play' | 'dead' | 'won'>('ready')
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
    // single-hop reach ≈ speed × airtime. airtime = 2·JUMP/GRAV ≈ 38 frames,
    // start speed 4 → ~150px reach. Keep gaps comfortably under that so every
    // gap is clearable with one well-timed hop (carpet is just a save, not required).
    const GAPS = 11
    for (let i = 0; i < GAPS; i++) {
      const gap = 55 + Math.random() * 40 // 55–95px, always hoppable
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
    statusRef.current = 'ready'
    setCarpets(CARPETS)
    setStatus('ready')
    setFace('normal')
    setGhostArrived(false)
  }

  const groundAt = (worldPos: number) =>
    segs.current.some((s) => worldPos >= s.x0 && worldPos <= s.x0 + s.w)

  const loop = () => {
    raf.current = requestAnimationFrame(loop)

    // simulate only while playing; ready/dead/won just keep painting the scene
    if (statusRef.current === 'play') {
      // start near cruising speed (no sluggish intro), ramp gently
      speed.current = Math.min(5.4, 4.4 + worldX.current * 0.00016)
      worldX.current += speed.current

      vy.current += GRAV
      y.current += vy.current
      const hw = worldX.current + SX.current
      if (y.current >= GY.current) {
        if (groundAt(hw)) {
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
      // coyote-time bookkeeping
      if (onGround.current) sinceGround.current = 0
      else sinceGround.current++

      if (hw >= flagX.current) win()
      else if (y.current > H.current + 80) die()
    }

    // paint (always) so the ready screen shows the level and end screens freeze it
    const herbWorld = worldX.current + SX.current
    const he = herbyEl.current
    if (he) he.style.transform = `translate(${SX.current}px, ${y.current - HERB_H}px)`
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
    if (scoreEl.current) scoreEl.current.textContent = `${Math.floor(worldX.current / 24)} m`
  }

  const record = () => {
    const s = Math.floor(worldX.current / 24)
    setFinalScore(s)
    if (s > bestRef.current) {
      bestRef.current = s
      setBest(s)
      setIsNewBest(true)
      try { localStorage.setItem('herbyRunnerBest', String(s)) } catch { /* ignore */ }
    } else {
      setIsNewBest(false)
    }
  }
  const win = () => {
    statusRef.current = 'won'
    setExitX(SX.current)
    record()
    setGhostArrived(false)
    setStatus('won')
    setFace('happy')
  }
  const die = () => {
    statusRef.current = 'dead'
    setExitX(SX.current)
    record()
    setGhostArrived(false)
    setStatus('dead')
    setFace('dizzy')
  }

  const tap = () => {
    if (statusRef.current === 'ready') {
      statusRef.current = 'play'
      setStatus('play')
      return
    }
    if (statusRef.current !== 'play') return
    // hop if grounded, or within coyote time after running off an edge (falling,
    // not rising) — so an edge-tap is a hop, never an accidental carpet
    const canHop =
      onGround.current || (sinceGround.current <= COYOTE && vy.current >= 0)
    if (canHop) {
      vy.current = -JUMP
      onGround.current = false
      sinceGround.current = 999 // consumed — a follow-up tap is a carpet, not a re-hop
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

  const ended = status === 'won' || status === 'dead'

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
        <div className={styles.hud} style={{ visibility: ended ? 'hidden' : 'visible' }}>
          <span className={styles.carpets}>Carpets: {'✦'.repeat(carpets) || '—'}</span>
          <span className={styles.track}><i ref={fill} /></span>
          {best > 0 && <span className={styles.best}>★ {best}</span>}
          <span ref={scoreEl} className={styles.score}>0 m</span>
        </div>

        {/* ground platforms */}
        <div ref={groundWrap} style={{ visibility: ended ? 'hidden' : 'visible' }}>
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
        <div ref={flagEl} className={styles.flag} style={{ top: GY.current, visibility: ended ? 'hidden' : 'visible' }}><span>🏁</span></div>

        {/* Herby */}
        <div ref={herbyEl} className={styles.herby} style={{ visibility: ended ? 'hidden' : 'visible' }}>
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

        {/* start screen */}
        {status === 'ready' && (
          <div className={styles.card} onPointerDown={(e) => e.stopPropagation()}>
            <p className={styles.cardTitle}>Run Herby Home</p>
            <p className={styles.cardSub}>Tap to hop the gaps · tap again mid-air for his carpet</p>
            <button className={styles.retry} onClick={tap} data-cursor="grow">Tap to start</button>
          </div>
        )}

        {/* win: happy Herby flies in + confetti (same as desktop) */}
        {status === 'won' && (
          <div className={g.dead}>
            <div className={g.confetti} aria-hidden>
              {Array.from({ length: 14 }).map((_, i) => <span key={i} />)}
            </div>
            <div
              className={g.winHerby}
              style={{ ['--sx' as string]: `${exitX}px` }}
              onAnimationEnd={(e) => { if (e.animationName.includes('winCome')) setGhostArrived(true) }}
            >
              <div className={g.ghostBubble}>{ghostArrived ? 'we made it! ^-^' : 'wheeee!'}</div>
              <svg viewBox="0 0 200 174" width="132" height="115" className={g.ghostSvg}>
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
              <div className={g.deadPanel}>
                <h2 className={`display ${g.winTitle}`}>Herby&apos;s home! 🎉</h2>
                <p className={styles.scoreLine}>
                  {isNewBest ? `🏆 new best · ${finalScore} m` : `score · ${finalScore} m  ·  best ${best} m`}
                </p>
                <div className={g.winBtns}>
                  <button onClick={build} data-cursor="grow">Play again</button>
                  <button onClick={onClose} className={g.close} data-cursor="grow">Done</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* death: ghost Herby drifts across then closes in (same as desktop) */}
        {status === 'dead' && (
          <div className={g.dead}>
            <div
              className={g.ghost}
              style={{ ['--sx' as string]: `${exitX}px` }}
              onAnimationEnd={(e) => { if (e.animationName.includes('ghostCome')) setGhostArrived(true) }}
            >
              <div className={g.ghostBubble}>{ghostArrived ? 'i couldn’t make it… 🥺' : 'wooOOoo~'}</div>
              <svg viewBox="0 0 200 174" width="132" height="115" className={g.ghostSvg}>
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
              <div className={g.deadPanel}>
                <p className={g.deadText}>Herby fell off… try again?</p>
                <p className={styles.scoreLine}>
                  {isNewBest ? `🏆 new best · ${finalScore} m` : `score · ${finalScore} m  ·  best ${best} m`}
                </p>
                <div className={g.winBtns}>
                  <button onClick={build} data-cursor="grow">New game</button>
                  <button onClick={onClose} className={g.close} data-cursor="grow">Done</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
