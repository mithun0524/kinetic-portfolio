import { useRef } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '../lib/gsap'
import styles from './Mascot.module.css'

// cute, non-human blurbs per mood
const SAY: Record<string, string[]> = {
  idle: ['beep!', 'boop~', 'la la la', 'hmm?', 'ooo', '*wiggle*', 'wheee', 'hi hi!', '^-^', 'nyoom', '*hums*'],
  hover: ['hi!', 'you again? ^-^', 'pat pat?', 'ooh a cursor!', 'sup!', '*blinks*', 'hehe~', 'hi friend!', 'boop me!'],
  click: ['boing!', 'wheee!', 'yay!', '*giggles*', 'hop hop!', 'again! again!', 'weee~', 'eee!'],
  climb: ['up we go!', 'climbing!', 'almost home~', 'hup!', 'wooo', '*determined*', 'nearly there!', 'so high!'],
  land: ['oof!', 'ta-da!', '*lands*', 'phew~', 'ow- jk!'],
  happy: ['yay!', '^-^', 'hehe~', 'wheee', 'so happy!'],
  blush: ['eee~', '>///<', 's-stop it~', '*blush*', 'hehe//', ';///;'],
  angry: ['grr!', 'hey!', 'put me down!', 'no throwing!', '>:(', 'rude!'],
  sad: ['aww…', 'why…', '*sniff*', ':(', 'miss home…', 'so far…'],
  bored: ['*yawn*', 'so bored…', 'zzz', 'anything fun?', '…', '*sigh*'],
  dizzy: ['woah…', '@_@', 'so dizzy…', 'spinny!', 'ugh…', 'wobble~'],
}
const rand = (a: string[]) => a[Math.floor(Math.random() * a.length)]

/**
 * A blocky little buddy (Claude-Code-ish). Walks, follows the cursor, blinks,
 * chatters, and is draggable with gravity + ledge-climbing physics.
 * Emotions: happy (hover/click), blush (petted a lot), angry (thrown hard /
 * click-spam), sad (dropped far / long fall), bored (idle a while), dizzy
 * (shaken while dragging).
 */
export function Mascot({ ground = false, range = 80 }: { ground?: boolean; range?: number } = {}) {
  const root = useRef<HTMLDivElement>(null)
  const drag = useRef<HTMLDivElement>(null)
  const walker = useRef<HTMLDivElement>(null)
  const jump = useRef<HTMLDivElement>(null)
  const facer = useRef<HTMLDivElement>(null)
  const body = useRef<SVGGElement>(null)
  const pupilL = useRef<SVGGElement>(null)
  const pupilR = useRef<SVGGElement>(null)
  const legL = useRef<SVGRectElement>(null)
  const legR = useRef<SVGRectElement>(null)
  const spark = useRef<SVGGElement>(null)
  const bubble = useRef<HTMLDivElement>(null)
  const bubbleText = useRef<HTMLSpanElement>(null)

  // face groups
  const eyesOpen = useRef<SVGGElement>(null)
  const eyesHappy = useRef<SVGGElement>(null)
  const faceBlush = useRef<SVGGElement>(null)
  const faceAngry = useRef<SVGGElement>(null)
  const faceSad = useRef<SVGGElement>(null)
  const faceBored = useRef<SVGGElement>(null)
  const faceDizzy = useRef<SVGGElement>(null)
  const cheeks = useRef<SVGGElement>(null)

  const walkTl = useRef<gsap.core.Timeline | null>(null)
  const legTweens = useRef<gsap.core.Tween[]>([])
  const boredTween = useRef<gsap.core.Tween | null>(null)
  const emoTimer = useRef<gsap.core.Tween | null>(null)

  const busy = useRef(false)
  const hovering = useRef(false)
  const emotion = useRef('normal')
  const lastInteract = useRef(0)
  const petTimes = useRef<number[]>([])
  const clickTimes = useRef<number[]>([])
  const drag_ = useRef({
    active: false, moved: false, sx: 0, sy: 0, ox: 0, oy: 0,
    shake: 0, lastDir: 0, lastFlip: 0, maxSpeed: 0, lastX: 0, lastT: 0,
  })

  const now = () => (typeof performance !== 'undefined' ? performance.now() : 0)
  const recent = (arr: number[], win: number) => arr.filter((t) => now() - t < win).length

  const face = (dir: number) => gsap.to(facer.current, { scaleX: dir, duration: 0.25, overwrite: 'auto' })

  const say = (text: string, hold = 1.8) => {
    if (prefersReducedMotion() || !bubble.current) return
    if (bubbleText.current) bubbleText.current.textContent = text
    gsap.killTweensOf(bubble.current)
    gsap.fromTo(
      bubble.current,
      { autoAlpha: 0, scale: 0.5, y: 8, transformOrigin: '0% 100%' },
      { autoAlpha: 1, scale: 1, y: 0, duration: 0.25, ease: 'back.out(2.5)' }
    )
    gsap.to(bubble.current, { autoAlpha: 0, scale: 0.7, duration: 0.25, delay: hold })
  }

  // ---- faces / emotions ----
  const FACE = () => ({
    normal: eyesOpen.current,
    happy: eyesHappy.current,
    blush: faceBlush.current,
    angry: faceAngry.current,
    sad: faceSad.current,
    bored: faceBored.current,
    dizzy: faceDizzy.current,
  })
  const showFace = (name: string) => {
    const m = FACE() as Record<string, SVGGElement | null>
    Object.entries(m).forEach(([k, el]) => gsap.to(el, { autoAlpha: k === name ? 1 : 0, duration: 0.12 }))
    gsap.to(cheeks.current, { autoAlpha: name === 'blush' ? 1 : 0, duration: 0.15 })
  }

  const reaction = (name: string) => {
    if (name !== 'bored') {
      boredTween.current?.kill()
      boredTween.current = null
    }
    switch (name) {
      case 'happy':
        gsap.fromTo(jump.current, { y: 0 }, { keyframes: [{ y: -14, duration: 0.15, ease: 'power2.out' }, { y: 0, duration: 0.28, ease: 'bounce.out' }] })
        break
      case 'blush':
        gsap.fromTo(facer.current, { rotation: -3 }, { rotation: 3, duration: 0.12, yoyo: true, repeat: 3, onComplete: () => gsap.to(facer.current, { rotation: 0, duration: 0.15 }) })
        gsap.to([pupilL.current, pupilR.current], { y: 3, duration: 0.2, yoyo: true, repeat: 1 })
        break
      case 'angry':
        gsap.fromTo(facer.current, { x: -4 }, { x: 4, duration: 0.05, yoyo: true, repeat: 9, onComplete: () => gsap.set(facer.current, { x: 0 }) })
        gsap.fromTo(body.current, { scale: 1.08 }, { scale: 1, duration: 0.4, ease: 'elastic.out(1,0.5)', transformOrigin: '50% 100%' })
        break
      case 'sad':
        gsap.to(body.current, { scaleY: 0.9, scaleX: 1.05, duration: 0.5, ease: 'power2.out', transformOrigin: '50% 100%' })
        gsap.to(jump.current, { y: 6, duration: 0.5 })
        break
      case 'dizzy':
        gsap.fromTo(facer.current, { rotation: -9 }, { rotation: 9, duration: 0.16, yoyo: true, repeat: 7, onComplete: () => gsap.to(facer.current, { rotation: 0, duration: 0.2 }) })
        break
      case 'bored':
        boredTween.current = gsap.to(facer.current, { rotation: 3, duration: 1.4, yoyo: true, repeat: -1, ease: 'sine.inOut' })
        break
      case 'normal':
        gsap.to(body.current, { scaleX: 1, scaleY: 1, rotation: 0, duration: 0.3, transformOrigin: '50% 100%' })
        gsap.to(facer.current, { x: 0, rotation: 0, duration: 0.2 })
        gsap.to(jump.current, { y: 0, duration: 0.3 })
        gsap.to([pupilL.current, pupilR.current], { y: 0, duration: 0.2 })
        break
    }
  }

  const setEmotion = (name: string, hold = 2.2, persist = false) => {
    if (prefersReducedMotion()) return
    emotion.current = name
    showFace(name)
    reaction(name)
    if (SAY[name]) say(rand(SAY[name]), Math.min(hold, 2))
    emoTimer.current?.kill()
    if (!persist && name !== 'normal') {
      emoTimer.current = gsap.delayedCall(hold, () => {
        emotion.current = 'normal'
        showFace('normal')
        reaction('normal')
      })
    }
  }

  const resetIdle = () => {
    lastInteract.current = now()
    if (emotion.current === 'bored') {
      emotion.current = 'normal'
      boredTween.current?.kill()
      boredTween.current = null
      showFace('normal')
      gsap.to(facer.current, { rotation: 0, duration: 0.2 })
      startWalking()
    }
  }

  useGSAP(
    () => {
      lastInteract.current = now()
      // hide all non-default faces
      ;[eyesHappy, faceBlush, faceAngry, faceSad, faceBored, faceDizzy, cheeks, spark].forEach((r) =>
        gsap.set(r.current, { autoAlpha: 0 })
      )
      if (prefersReducedMotion()) return

      const span = (range / 80) * 4.5
      walkTl.current = gsap
        .timeline({ repeat: -1 })
        .add(() => face(1))
        .to(walker.current, { x: range, duration: span, ease: 'none' })
        .add(() => face(-1))
        .to(walker.current, { x: -range, duration: span, ease: 'none' })

      const stepL = gsap.to(legL.current, { y: -7, duration: 0.28, repeat: -1, yoyo: true, ease: 'sine.inOut' })
      const stepR = gsap.to(legR.current, { y: -7, duration: 0.28, repeat: -1, yoyo: true, ease: 'sine.inOut' })
      stepR.progress(0.5)
      const waddle = gsap.to(facer.current, { rotation: 2.5, duration: 0.28, repeat: -1, yoyo: true, ease: 'sine.inOut' })
      legTweens.current = [stepL, stepR, waddle]

      const blink = () => {
        if (emotion.current === 'normal')
          gsap.to(eyesOpen.current, { scaleY: 0.1, transformOrigin: '50% 50%', duration: 0.08, yoyo: true, repeat: 1 })
        gsap.delayedCall(2.6, blink)
      }
      gsap.delayedCall(2.6, blink)

      const lookAround = () => {
        const dirs = [[-4, -2], [4, -2], [0, 3], [-4, 2], [4, 2]]
        const [dx, dy] = dirs[Math.floor(Math.random() * dirs.length)]
        gsap.to([pupilL.current, pupilR.current], { x: dx, y: dy, duration: 0.3, yoyo: true, repeat: 1, ease: 'power2.inOut' })
      }
      const idle = () => {
        gsap.delayedCall(3 + Math.random() * 4, () => {
          if (!busy.current && !hovering.current && !drag_.current.active && emotion.current === 'normal') {
            if (Math.random() < 0.55) hop()
            else lookAround()
          }
          idle()
        })
      }
      idle()

      const talk = () => {
        gsap.delayedCall(6 + Math.random() * 9, () => {
          if (!drag_.current.active && emotion.current === 'normal') say(rand(SAY.idle))
          talk()
        })
      }
      talk()

      // bored when idle too long
      const boredCheck = () => {
        gsap.delayedCall(2, () => {
          if (
            !busy.current && !hovering.current && !drag_.current.active &&
            emotion.current === 'normal' && now() - lastInteract.current > 16000
          ) {
            stopWalking()
            setEmotion('bored', 0, true)
          }
          boredCheck()
        })
      }
      boredCheck()

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
        if (drag_.current.active || emotion.current !== 'normal') return
        track(pupilL.current, e, 4)
        track(pupilR.current, e, 4)
      }
      window.addEventListener('pointermove', onMove)
      return () => window.removeEventListener('pointermove', onMove)
    },
    { scope: root }
  )

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
      scaleX: on ? 1.06 : 1, scaleY: on ? 0.94 : 1, rotation: on ? 3 : 0,
      transformOrigin: '50% 100%', duration: 0.5, ease: 'elastic.out(1, 0.4)',
    })

  const hover = (on: boolean) => {
    if (prefersReducedMotion() || drag_.current.active) return
    hovering.current = on
    if (busy.current) return
    if (on) {
      resetIdle()
      stopWalking()
      petTimes.current.push(now())
      if (recent(petTimes.current, 4000) >= 3) setEmotion('blush', 2.5)
      else {
        showFace('happy')
        lean(true)
        say(rand(SAY.hover))
      }
    } else {
      startWalking()
      lean(false)
      if (emotion.current === 'normal' || emotion.current === 'happy') showFace('normal')
    }
  }

  const hop = () => {
    if (prefersReducedMotion() || busy.current) return
    resetIdle()
    clickTimes.current.push(now())
    petTimes.current.push(now())
    if (recent(clickTimes.current, 2000) >= 5) return setEmotion('angry', 2)
    if (recent(petTimes.current, 4000) >= 3) return setEmotion('blush', 2.5)

    busy.current = true
    stopWalking()
    showFace('happy')
    say(rand(SAY.click))
    gsap
      .timeline({
        onComplete: () => {
          busy.current = false
          gsap.set(body.current, { rotation: 0 })
          if (hovering.current) showFace('happy')
          else {
            showFace('normal')
            startWalking()
          }
        },
      })
      .to(body.current, { scaleY: 0.8, scaleX: 1.16, transformOrigin: '50% 100%', duration: 0.1 })
      .to(jump.current, { y: -40, duration: 0.28, ease: 'power2.out' }, '<')
      .to(body.current, { scaleY: 1.1, scaleX: 0.92, rotation: 6, duration: 0.2 }, '<')
      .to(jump.current, { y: 0, duration: 0.38, ease: 'bounce.out' })
      .to(body.current, { scaleY: 1, scaleX: 1, rotation: 0, duration: 0.3, ease: 'elastic.out(1, 0.4)' }, '-=0.12')

    gsap.set(spark.current, { autoAlpha: 1, scale: 0.3, y: 0, transformOrigin: '50% 50%' })
    gsap.timeline().to(spark.current, { scale: 1, y: -34, duration: 0.5, ease: 'power2.out' }).to(spark.current, { autoAlpha: 0, y: -50, duration: 0.3 }, '-=0.15')
  }

  // ---- drag & drop ----
  const onDown = (e: React.PointerEvent) => {
    if (prefersReducedMotion() || busy.current) return
    const s = drag_.current
    resetIdle()
    s.active = true
    s.moved = false
    s.sx = e.clientX
    s.sy = e.clientY
    s.ox = (gsap.getProperty(drag.current, 'x') as number) || 0
    s.oy = (gsap.getProperty(drag.current, 'y') as number) || 0
    s.shake = 0
    s.lastDir = 0
    s.lastFlip = 0
    s.maxSpeed = 0
    s.lastX = e.clientX
    s.lastT = now()
    walkTl.current?.pause()
    root.current?.setPointerCapture(e.pointerId)
  }

  const onMoveDrag = (e: React.PointerEvent) => {
    const s = drag_.current
    if (!s.active) return
    // speed + shake tracking
    const t = now()
    const dt = t - s.lastT
    if (dt > 0) {
      const sp = Math.abs(e.clientX - s.lastX) / dt
      if (sp > s.maxSpeed) s.maxSpeed = sp
      const dir = Math.sign(e.clientX - s.lastX)
      if (dir !== 0 && dir !== s.lastDir) {
        if (t - s.lastFlip < 220) s.shake++
        s.lastFlip = t
        s.lastDir = dir
      }
    }
    s.lastX = e.clientX
    s.lastT = t

    const dx = e.clientX - s.sx
    const dy = e.clientY - s.sy
    if (!s.moved && Math.hypot(dx, dy) > 4) {
      s.moved = true
      legTweens.current.forEach((tw) => tw.pause())
      gsap.to([legL.current, legR.current], { y: 0, duration: 0.2, ease: 'power2.out' })
      gsap.to(facer.current, { rotation: 0, duration: 0.2 })
      showFace('normal')
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
    // rough-handling emotions
    const x = (gsap.getProperty(drag.current, 'x') as number) || 0
    const y = (gsap.getProperty(drag.current, 'y') as number) || 0
    if (s.shake >= 4) setEmotion('dizzy', 2.4)
    else if (s.maxSpeed > 2.2) setEmotion('angry', 2)
    else if (Math.hypot(x, y) > 420) setEmotion('sad', 3)
    dropAndFall()
  }

  // ---- gravity physics ----
  const feetBottom = () => body.current?.getBoundingClientRect().bottom ?? 0
  const feetCenterX = () => {
    const r = body.current?.getBoundingClientRect()
    return r ? r.left + r.width / 2 : 0
  }

  const getSurfaces = () => {
    const els = document.querySelectorAll<HTMLElement>('main h1, main h2, main h3, main h4, main p, main li, main a, [data-solid]')
    const raw: { left: number; right: number; top: number }[] = []
    els.forEach((el) => {
      if (el.closest('[data-nofloor]')) return
      const r = el.getBoundingClientRect()
      if (r.width < 50 || r.height < 8) return
      if (!(el.textContent || '').trim() && !el.hasAttribute('data-solid')) return
      raw.push({ left: r.left, right: r.right, top: r.top })
    })
    raw.sort((a, b) => a.top - b.top)
    const merged: { left: number; right: number; top: number }[] = []
    for (const s of raw) {
      const m = merged.find((x) => Math.abs(x.top - s.top) < 10 && s.left < x.right + 24 && s.right > x.left - 24)
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
    if (emotion.current === 'normal') gsap.to(body.current, { scale: 1, duration: 0.2 })

    const startFeet = feetBottom()
    const fx = feetCenterX()
    let target = window.innerHeight - 6
    getSurfaces().forEach((r) => {
      if (fx >= r.left && fx <= r.right && r.top >= startFeet - 2 && r.top < target) target = r.top
    })

    let v = 0
    const g = 1.6
    const fall = () => {
      v = Math.min(v + g, 28)
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
    gsap.timeline()
      .to(body.current, { scaleY: 0.7, scaleX: 1.25, transformOrigin: '50% 100%', duration: 0.08 })
      .to(body.current, { scaleY: 1, scaleX: 1, duration: 0.35, ease: 'elastic.out(1, 0.4)' })
    gsap.set(spark.current, { autoAlpha: 1, scale: 0.3, y: 20, transformOrigin: '50% 50%' })
    gsap.timeline().to(spark.current, { scale: 0.9, y: -6, duration: 0.4, ease: 'power2.out' }).to(spark.current, { autoAlpha: 0, duration: 0.3 }, '-=0.1')
    if (emotion.current === 'normal') say(rand(SAY.land))
    gsap.delayedCall(0.7, returnHome)
  }

  const returnHome = () => {
    legTweens.current.forEach((t) => t.resume())
    if (emotion.current === 'normal') say(rand(SAY.climb), 2.4)

    // zero transient offsets so the home measurement isn't polluted by
    // emotion/hop transforms (drag keeps the thrown position)
    gsap.set(jump.current, { y: 0 })
    gsap.set(facer.current, { x: 0, rotation: 0 })
    gsap.set(body.current, { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 })

    const dragX0 = (gsap.getProperty(drag.current, 'x') as number) || 0
    const dragY0 = (gsap.getProperty(drag.current, 'y') as number) || 0
    const homeFeetX = feetCenterX() - dragX0
    const homeFeetY = feetBottom() - dragY0
    const toDragX = (px: number) => px - homeFeetX
    const toDragY = (py: number) => py - homeFeetY

    const surfaces = getSurfaces()
    let cx = feetCenterX()
    let cy = feetBottom()
    const REACH = 320

    const tl = gsap.timeline({
      onComplete: () => {
        // hard-reset every offset so it sits exactly on its home line (no drift)
        gsap.set(drag.current, { x: 0, y: 0 })
        gsap.set(jump.current, { y: 0 })
        gsap.set(body.current, { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 })
        busy.current = false
        setEmotion('happy', 1.4)
        if (hovering.current) stopWalking()
        else startWalking()
      },
    })
    const clampX = (s: { left: number; right: number }) => gsap.utils.clamp(s.left + 18, s.right - 18, homeFeetX)
    const walkTo = (px: number) => {
      const d = Math.abs(px - cx)
      if (d < 3) return
      face(px < cx ? -1 : 1)
      tl.to(drag.current, { x: toDragX(px), duration: gsap.utils.clamp(0.45, 1.6, d / 150), ease: 'none' })
      cx = px
    }
    const hopTo = (px: number, py: number) => {
      face(px < cx ? -1 : 1)
      tl.call(() => {
        if (emotion.current === 'normal' && Math.random() < 0.4) say(rand(SAY.climb), 1.4)
      })
      const up = gsap.utils.clamp(50, 100, cy - py + 24)
      tl.to(body.current, { scaleY: 0.82, scaleX: 1.18, transformOrigin: '50% 100%', duration: 0.1, ease: 'power2.in' })
        .to(drag.current, { x: toDragX(px), duration: 0.42, ease: 'power1.inOut' })
        .to(drag.current, { keyframes: [{ y: toDragY(py) - up, duration: 0.19, ease: 'power2.out' }, { y: toDragY(py), duration: 0.21, ease: 'power2.in' }] }, '<')
        .to(body.current, { scaleY: 1.1, scaleX: 0.92, duration: 0.14 }, '<')
        .to(body.current, { scaleY: 0.86, scaleX: 1.14, duration: 0.08 })
        .to(body.current, { scaleY: 1, scaleX: 1, duration: 0.3, ease: 'elastic.out(1, 0.5)' })
      cx = px
      cy = py
    }

    let guard = 0
    while (guard++ < 16) {
      if (Math.abs(cy - homeFeetY) < 8) {
        walkTo(homeFeetX)
        break
      }
      if (homeFeetY > cy + 8) {
        walkTo(homeFeetX)
        tl.to(drag.current, { y: 0, duration: 0.45, ease: 'power2.in' })
        break
      }
      const cands = surfaces.filter((s) => s.top <= cy - 24 && s.top >= homeFeetY - 8 && s.right >= cx - REACH && s.left <= cx + REACH)
      if (cands.length) {
        const maxTop = Math.max(...cands.map((c) => c.top))
        const band = cands.filter((c) => c.top >= maxTop - 70)
        band.sort((a, b) => Math.abs(clampX(a) - homeFeetX) - Math.abs(clampX(b) - homeFeetX))
        const s = band[0]
        const targetX = clampX(s)
        walkTo(targetX)
        hopTo(targetX, s.top)
      } else if (Math.abs(cx - homeFeetX) > 6) {
        // no ledge reachable here — walk along this level toward home, then re-check
        walkTo(homeFeetX)
      } else {
        // under home with nothing between — one hop up onto the home line
        hopTo(homeFeetX, homeFeetY)
        break
      }
    }
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
          <div ref={jump} className={styles.layer}>
            <div ref={bubble} className={styles.bubble}>
              <span ref={bubbleText} />
            </div>
            <div ref={facer}>
              <svg viewBox="0 0 200 174" className={styles.svg}>
                <g ref={spark} fill="var(--m)">
                  <path d="M100 12 L104 26 L118 30 L104 34 L100 48 L96 34 L82 30 L96 26 Z" />
                </g>

                <g ref={body}>
                  <rect x="8" y="82" width="22" height="34" rx="2" fill="var(--m)" />
                  <rect x="170" y="82" width="22" height="34" rx="2" fill="var(--m)" />
                  <rect ref={legL} x="62" y="138" width="22" height="30" rx="2" fill="var(--m)" />
                  <rect ref={legR} x="116" y="138" width="22" height="30" rx="2" fill="var(--m)" />
                  <rect x="28" y="52" width="144" height="90" rx="5" fill="var(--m)" />

                  {/* blush cheeks (shown with blush face) */}
                  <g ref={cheeks}>
                    <ellipse cx="64" cy="114" rx="11" ry="6" fill="#ff8f8f" opacity="0.75" />
                    <ellipse cx="136" cy="114" rx="11" ry="6" fill="#ff8f8f" opacity="0.75" />
                  </g>

                  {/* normal (cursor-tracking) */}
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

                  {/* happy >< */}
                  <g ref={eyesHappy} stroke="#20140f" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none">
                    <path d="M72 86 L92 99 L72 112" />
                    <path d="M128 86 L108 99 L128 112" />
                  </g>

                  {/* blush ^ ^ */}
                  <g ref={faceBlush} stroke="#20140f" strokeWidth="7" strokeLinecap="round" fill="none">
                    <path d="M72 100 Q82 90 92 100" />
                    <path d="M108 100 Q118 90 128 100" />
                  </g>

                  {/* angry brows + eyes */}
                  <g ref={faceAngry}>
                    <g stroke="#20140f" strokeWidth="7" strokeLinecap="round">
                      <path d="M70 86 L94 96" />
                      <path d="M130 86 L106 96" />
                    </g>
                    <ellipse cx="84" cy="105" rx="7" ry="8" fill="#20140f" />
                    <ellipse cx="116" cy="105" rx="7" ry="8" fill="#20140f" />
                  </g>

                  {/* sad droopy + tear */}
                  <g ref={faceSad}>
                    <g stroke="#20140f" strokeWidth="7" strokeLinecap="round" fill="none">
                      <path d="M72 96 Q82 108 92 100" />
                      <path d="M108 100 Q118 108 128 96" />
                    </g>
                    <ellipse cx="86" cy="116" rx="3.5" ry="6" fill="#bfe3ff" />
                  </g>

                  {/* bored sleepy lids */}
                  <g ref={faceBored} stroke="#20140f" strokeWidth="7" strokeLinecap="round">
                    <path d="M70 100 L94 100" />
                    <path d="M106 100 L130 100" />
                  </g>

                  {/* dizzy X eyes */}
                  <g ref={faceDizzy} stroke="#20140f" strokeWidth="6" strokeLinecap="round">
                    <path d="M76 92 L92 108" />
                    <path d="M92 92 L76 108" />
                    <path d="M108 92 L124 108" />
                    <path d="M124 92 L108 108" />
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
