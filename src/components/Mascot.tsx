import { useRef, forwardRef, useImperativeHandle, type RefObject } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '../lib/gsap'
import styles from './Mascot.module.css'

export interface MascotHandle {
  peek: () => void
  duck: () => void
  arrive: () => void
}

// cute, non-human blurbs per mood
const SAY: Record<string, string[]> = {
  idle: ['beep!', 'boop~', 'la la la', 'hmm?', 'ooo', '*wiggle*', 'wheee', 'hi hi!', '^-^', 'nyoom', '*hums*'],
  hover: ['hi!', 'you again? ^-^', 'pat pat?', 'ooh a cursor!', 'sup!', '*blinks*', 'hehe~', 'hi friend!', 'boop me!'],
  click: ['boing!', 'wheee!', 'yay!', '*giggles*', 'hop hop!', 'again! again!', 'weee~', 'eee!'],
  climb: ['up we go!', 'climbing!', 'almost home~', 'hup!', 'wooo', '*determined*', 'nearly there!', 'homeward!'],
  land: ['oof!', 'ta-da!', '*lands*', 'phew~', 'ow- jk!'],
  happy: ['yay!', '^-^', 'hehe~', 'wheee', 'home!'],
  blush: ['eee~', '>///<', 's-stop it~', '*blush*', 'hehe//', ';///;'],
  angry: ['grr!', 'hey!', 'put me down!', 'no throwing!', '>:(', 'rude!'],
  sad: ['aww…', 'why…', '*sniff*', ':(', 'so far…', 'oof…'],
  bored: ['*yawn*', 'so bored…', 'zzz', 'anything fun?', '…', '*sigh*'],
  dizzy: ['woah…', '@_@', 'so dizzy…', 'spinny!', 'ugh…', 'wobble~'],
  magic: ['✨magic✨', 'whoosh!', 'no path? no problem!', 'watch this~', 'wheee!', 'i can fly!'],
}
const rand = (a: string[]) => a[Math.floor(Math.random() * a.length)]

/**
 * A blocky buddy that lives at HOME (a visible text line) and paces along it.
 * Drag it anywhere and it finds its way back home, climbing ledge-by-ledge —
 * only ever standing on visible text (never invisible layout boxes).
 * Moods: happy/blush/angry/sad/bored/dizzy. Speech bubbles throughout.
 */
function MascotBase(
  {
    ground = false,
    homeRef,
    intro = false,
  }: {
    ground?: boolean
    homeRef?: RefObject<HTMLElement | null>
    intro?: boolean
  },
  ref: React.Ref<MascotHandle>
) {
  const root = useRef<HTMLDivElement>(null)
  const drag = useRef<HTMLDivElement>(null)
  const jump = useRef<HTMLDivElement>(null)
  const facer = useRef<HTMLDivElement>(null)
  const body = useRef<SVGGElement>(null)
  const pupilL = useRef<SVGGElement>(null)
  const pupilR = useRef<SVGGElement>(null)
  const legL = useRef<SVGRectElement>(null)
  const legR = useRef<SVGRectElement>(null)
  const spark = useRef<SVGGElement>(null)
  const carpet = useRef<HTMLDivElement>(null)
  const bubble = useRef<HTMLDivElement>(null)
  const bubbleText = useRef<HTMLSpanElement>(null)

  const eyesOpen = useRef<SVGGElement>(null)
  const eyesHappy = useRef<SVGGElement>(null)
  const faceBlush = useRef<SVGGElement>(null)
  const faceAngry = useRef<SVGGElement>(null)
  const faceSad = useRef<SVGGElement>(null)
  const faceBored = useRef<SVGGElement>(null)
  const faceDizzy = useRef<SVGGElement>(null)
  const cheeks = useRef<SVGGElement>(null)

  const legTweens = useRef<gsap.core.Tween[]>([])
  const patrolTl = useRef<gsap.core.Timeline | null>(null)
  const walkOn = useRef(true)
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
  const getX = () => (gsap.getProperty(drag.current, 'x') as number) || 0
  const getY = () => (gsap.getProperty(drag.current, 'y') as number) || 0

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
    normal: eyesOpen.current, happy: eyesHappy.current, blush: faceBlush.current,
    angry: faceAngry.current, sad: faceSad.current, bored: faceBored.current, dizzy: faceDizzy.current,
  })
  const showFace = (name: string) => {
    const m = FACE() as Record<string, SVGGElement | null>
    Object.entries(m).forEach(([k, el]) => {
      gsap.killTweensOf(el)
      // killing a mid-blink tween can leave scaleY stuck low — always restore it
      if (k === name) gsap.to(el, { autoAlpha: 1, scaleY: 1, duration: 0.12 })
      else gsap.set(el, { autoAlpha: 0, scaleY: 1 })
    })
    gsap.killTweensOf(cheeks.current)
    gsap.set(cheeks.current, { autoAlpha: name === 'blush' ? 1 : 0 })
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

  // ---- geometry: ground = visible text ----
  const feetBottom = () => body.current?.getBoundingClientRect().bottom ?? 0
  const feetCenterX = () => {
    const r = body.current?.getBoundingClientRect()
    return r ? r.left + r.width / 2 : 0
  }
  const getSurfaces = () => {
    const els = document.querySelectorAll<HTMLElement>('main h1, main h2, main h3, main h4, main p, main li, main a, [data-solid]')
    const raw: { left: number; right: number; top: number; bottom: number }[] = []
    els.forEach((el) => {
      if (el.closest('[data-nofloor]')) return
      const txt = (el.textContent || '').trim()
      if (!txt) {
        if (el.hasAttribute('data-solid')) {
          const r = el.getBoundingClientRect()
          if (r.width >= 40) raw.push({ left: r.left, right: r.right, top: r.top, bottom: r.bottom })
        }
        return
      }
      const range = document.createRange()
      range.selectNodeContents(el)
      const rects = range.getClientRects()
      const maxW = window.innerWidth * 0.9 // ignore anything ~full-width (a container, not a word/line)
      for (let i = 0; i < rects.length; i++) {
        const r = rects[i]
        if (r.width < 40 || r.height < 6 || r.width > maxW) continue
        raw.push({ left: r.left, right: r.right, top: r.top, bottom: r.bottom })
      }
      range.detach?.()
    })
    raw.sort((a, b) => a.top - b.top)
    const merged: { left: number; right: number; top: number; bottom: number }[] = []
    for (const s of raw) {
      const m = merged.find((x) => Math.abs(x.top - s.top) < 10 && s.left < x.right + 24 && s.right > x.left - 24)
      if (m) {
        m.left = Math.min(m.left, s.left)
        m.right = Math.max(m.right, s.right)
        m.top = Math.min(m.top, s.top)
        m.bottom = Math.max(m.bottom, s.bottom)
      } else merged.push({ ...s })
    }
    return merged
  }

  // home = the visible text line it lives on (or a small ledge at its rest spot)
  const homeRect = () => {
    if (homeRef?.current) {
      const r = homeRef.current.getBoundingClientRect()
      if (r.width > 10) return { left: r.left, right: r.right, top: r.top }
    }
    const ax = feetCenterX() - getX()
    const ay = feetBottom() - getY()
    return { left: ax - 70, right: ax + 70, top: ay }
  }

  // ---- pace back and forth along home ----
  const patrol = () => {
    if (!walkOn.current || prefersReducedMotion()) return
    if (busy.current || drag_.current.active || hovering.current || emotion.current !== 'normal') {
      gsap.delayedCall(1, patrol)
      return
    }
    const h = homeRect()
    const fx = feetCenterX()
    const fy = feetBottom()
    // drifted off home (e.g. layout shift) → walk/climb back
    if (Math.abs(fy - h.top) > 26) {
      returnHome()
      return
    }
    const anchorX = fx - getX()
    const anchorY = fy - getY()
    const mid = (h.left + h.right) / 2
    const tx = fx < mid ? h.right - 18 : h.left + 18
    face(tx < fx ? -1 : 1)
    legTweens.current.forEach((t) => t.resume())
    patrolTl.current = gsap.timeline({
      onComplete: () => {
        if (walkOn.current) gsap.delayedCall(0.5 + Math.random() * 1.6, patrol)
      },
    })
    patrolTl.current
      .set(drag.current, { y: h.top - anchorY }, 0)
      .to(drag.current, { x: tx - anchorX, duration: gsap.utils.clamp(0.6, 2.4, Math.abs(tx - fx) / 120), ease: 'none' })
  }

  const startWalking = () => {
    walkOn.current = true
    legTweens.current.forEach((t) => t.resume())
    patrol()
  }
  const stopWalking = () => {
    walkOn.current = false
    patrolTl.current?.kill()
    legTweens.current.forEach((t) => t.pause())
    gsap.to([legL.current, legR.current], { y: 0, duration: 0.2, ease: 'power2.out' })
    gsap.to(facer.current, { rotation: 0, duration: 0.2 })
  }
  const lean = (on: boolean) =>
    gsap.to(body.current, {
      scaleX: on ? 1.06 : 1, scaleY: on ? 0.94 : 1, rotation: on ? 3 : 0,
      transformOrigin: '50% 100%', duration: 0.5, ease: 'elastic.out(1, 0.4)',
    })

  // place feet exactly on home instantly (no travel)
  const snapHome = () => {
    const h = homeRect()
    const ax = feetCenterX() - getX()
    const ay = feetBottom() - getY()
    gsap.set(drag.current, { x: (h.left + h.right) / 2 - ax, y: h.top - ay })
  }

  // --- hero intro, driven imperatively by the Hero chat ---
  const setFeet = (px: number, py: number) => {
    const ax = feetCenterX() - getX()
    const ay = feetBottom() - getY()
    gsap.set(drag.current, { x: px - ax, y: py - ay })
  }
  // Herby smoothly peeks upside-down from the top — only his eyes show
  const peek = () => {
    if (prefersReducedMotion()) return
    legTweens.current.forEach((t) => t.pause()) // stop the waddle so the flip sticks
    const h = homeRect()
    gsap.set(facer.current, { rotation: 180 })
    setFeet((h.left + h.right) / 2, h.top)
    const r = body.current?.getBoundingClientRect()
    if (!r) return
    // start fully above the top edge, then slide down so only the eyes peek in
    gsap.set(drag.current, { y: `+=${-30 - r.bottom}` })
    gsap.set(facer.current, { autoAlpha: 1 })
    gsap.to(drag.current, { y: '+=118', duration: 1.1, ease: 'power2.out' })
    gsap.killTweensOf([pupilL.current, pupilR.current])
    gsap.fromTo([pupilL.current, pupilR.current], { y: 0 }, { y: 3, duration: 0.9, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 1.0 })
  }
  const duck = () => {
    if (prefersReducedMotion()) return
    gsap.killTweensOf([pupilL.current, pupilR.current])
    gsap.set([pupilL.current, pupilR.current], { y: 0 })
    gsap.to(drag.current, {
      y: '-=190',
      duration: 0.9,
      ease: 'power2.in',
      onComplete: () => gsap.set(facer.current, { autoAlpha: 0, rotation: 0 }),
    })
  }
  // Herby drops in full, lands, introduces himself, then starts pacing
  const arrive = () => {
    if (prefersReducedMotion()) {
      snapHome()
      gsap.set(facer.current, { autoAlpha: 1, rotation: 0 })
      busy.current = false
      startWalking()
      return
    }
    const h = homeRect()
    gsap.set(facer.current, { autoAlpha: 1, rotation: 0 })
    setFeet((h.left + h.right) / 2, 30)
    say('there it is!', 2)
    const ay = feetBottom() - getY()
    gsap.to(drag.current, {
      y: h.top - ay,
      duration: 1.15,
      ease: 'bounce.out',
      onComplete: () => {
        gsap.timeline()
          .to(body.current, { scaleY: 0.68, scaleX: 1.28, transformOrigin: '50% 100%', duration: 0.1 })
          .to(body.current, { scaleY: 1, scaleX: 1, duration: 0.4, ease: 'elastic.out(1, 0.4)' })
        gsap.set(spark.current, { autoAlpha: 1, scale: 0.3, y: 20, transformOrigin: '50% 50%' })
        gsap.timeline().to(spark.current, { scale: 0.9, y: -6, duration: 0.4, ease: 'power2.out' }).to(spark.current, { autoAlpha: 0, duration: 0.3 }, '-=0.1')
        gsap.delayedCall(0.8, () => say("hi! i'm Herby ^-^", 2.4))
        gsap.delayedCall(3.2, () => { busy.current = false; startWalking() })
      },
    })
  }
  useImperativeHandle(ref, () => ({ peek, duck, arrive }))

  useGSAP(
    () => {
      lastInteract.current = now()
      ;[eyesHappy, faceBlush, faceAngry, faceSad, faceBored, faceDizzy, cheeks, spark].forEach((r) =>
        gsap.set(r.current, { autoAlpha: 0 })
      )
      gsap.set(carpet.current, { autoAlpha: 0, scaleX: 0 })
      if (prefersReducedMotion()) return

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
      const antics = () => {
        gsap.delayedCall(4 + Math.random() * 5, () => {
          if (!busy.current && !hovering.current && !drag_.current.active && emotion.current === 'normal') lookAround()
          antics()
        })
      }
      antics()
      const talk = () => {
        gsap.delayedCall(7 + Math.random() * 9, () => {
          if (!drag_.current.active && emotion.current === 'normal') say(rand(SAY.idle))
          talk()
        })
      }
      talk()
      const boredCheck = () => {
        gsap.delayedCall(2, () => {
          if (!busy.current && !hovering.current && !drag_.current.active && emotion.current === 'normal' && now() - lastInteract.current > 16000) {
            stopWalking()
            setEmotion('bored', 0, true)
          }
          boredCheck()
        })
      }
      boredCheck()

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

      // settle onto home; in intro mode stay hidden until Hero drives arrive()
      gsap.delayedCall(0.6, () => {
        if (intro) {
          busy.current = true
          walkOn.current = false
          legTweens.current.forEach((t) => t.pause()) // no waddle until he arrives
          snapHome()
          gsap.set(facer.current, { autoAlpha: 0 })
        } else {
          snapHome()
          patrol()
        }
      })
      return () => window.removeEventListener('pointermove', onMove)
    },
    { scope: root }
  )

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
      lean(false)
      if (emotion.current === 'normal' || emotion.current === 'happy') showFace('normal')
      startWalking()
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
    s.ox = getX()
    s.oy = getY()
    s.shake = 0
    s.lastDir = 0
    s.lastFlip = 0
    s.maxSpeed = 0
    s.lastX = e.clientX
    s.lastT = now()
    stopWalking()
    root.current?.setPointerCapture(e.pointerId)
  }
  const onMoveDrag = (e: React.PointerEvent) => {
    const s = drag_.current
    if (!s.active) return
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
    if (s.shake >= 4) setEmotion('dizzy', 2.4)
    else if (s.maxSpeed > 2.2) setEmotion('angry', 2)
    else if (s.maxSpeed < 0.6 && Math.hypot(getX(), getY()) > 520) setEmotion('sad', 3)
    dropAndFall()
  }

  const dropAndFall = () => {
    busy.current = true
    walkOn.current = false
    patrolTl.current?.kill()
    legTweens.current.forEach((t) => t.pause())
    gsap.to([legL.current, legR.current], { y: 0, duration: 0.15 })
    if (emotion.current === 'normal') gsap.to(body.current, { scale: 1, duration: 0.2 })

    const startFeet = feetBottom()
    const fx = feetCenterX()
    const surfs = getSurfaces()

    // grab-the-word: dropped with feet inside a word's box → snap onto it
    let grabTop: number | null = null
    surfs.forEach((r) => {
      if (fx >= r.left && fx <= r.right && startFeet >= r.top - 24 && startFeet <= r.bottom + 12) {
        if (grabTop === null || r.top < grabTop) grabTop = r.top
      }
    })
    if (grabTop !== null) {
      const over = feetBottom() - grabTop
      gsap.to(drag.current, { y: getY() - over, duration: 0.18, ease: 'power2.out', onComplete: land })
      return
    }

    let target = window.innerHeight - 6
    surfs.forEach((r) => {
      if (fx >= r.left && fx <= r.right && r.top >= startFeet - 2 && r.top < target) target = r.top
    })
    let v = 0
    const g = 1.6
    const fall = () => {
      v = Math.min(v + g, 28)
      gsap.set(drag.current, { y: getY() + v })
      if (feetBottom() >= target) {
        gsap.set(drag.current, { y: getY() - (feetBottom() - target) })
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
    gsap.delayedCall(0.6, returnHome)
  }

  // ---- find the way home over visible-text ledges ----
  const returnHome = () => {
    legTweens.current.forEach((t) => t.resume())
    if (emotion.current === 'normal') say(rand(SAY.climb), 2.4)

    gsap.set(jump.current, { y: 0 })
    gsap.set(facer.current, { x: 0, rotation: 0 })
    gsap.set(body.current, { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 })

    const h = homeRect()
    const homeFeetX = gsap.utils.clamp(h.left + 18, h.right - 18, (h.left + h.right) / 2)
    const homeFeetY = h.top
    const anchorX = feetCenterX() - getX()
    const anchorY = feetBottom() - getY()
    const toDX = (px: number) => px - anchorX
    const toDY = (py: number) => py - anchorY

    const surfaces = getSurfaces()
    let cx = feetCenterX()
    let cy = feetBottom()
    const REACH = 190

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(drag.current, { x: toDX(homeFeetX), y: toDY(homeFeetY) })
        gsap.set(jump.current, { y: 0 })
        gsap.set(body.current, { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 })
        busy.current = false
        setEmotion('happy', 1.2)
        if (hovering.current) stopWalking()
        else startWalking()
      },
    })
    const clampX = (s: { left: number; right: number }) => gsap.utils.clamp(s.left + 18, s.right - 18, homeFeetX)
    const walkTo = (px: number) => {
      const d = Math.abs(px - cx)
      if (d < 3) return
      face(px < cx ? -1 : 1)
      tl.to(drag.current, { x: toDX(px), duration: gsap.utils.clamp(0.45, 1.6, d / 140), ease: 'none' })
      cx = px
    }
    const hopTo = (px: number, py: number) => {
      face(px < cx ? -1 : 1)
      tl.call(() => {
        if (emotion.current === 'normal' && Math.random() < 0.35) say(rand(SAY.climb), 1.4)
      })
      const up = gsap.utils.clamp(36, 72, cy - py + 18)
      tl.to(body.current, { scaleY: 0.82, scaleX: 1.18, transformOrigin: '50% 100%', duration: 0.1, ease: 'power2.in' })
        .to(drag.current, { x: toDX(px), duration: 0.34, ease: 'power1.inOut' })
        .to(drag.current, { keyframes: [{ y: toDY(py) - up, duration: 0.16, ease: 'power2.out' }, { y: toDY(py), duration: 0.18, ease: 'power2.in' }] }, '<')
        .to(body.current, { scaleY: 1, scaleX: 1, duration: 0.28, ease: 'elastic.out(1, 0.5)' })
      cx = px
      cy = py
    }
    // no path? conjure a line and ride it home like a magic carpet
    const carpetTo = (px: number, py: number) => {
      face(px < cx ? -1 : 1)
      tl.call(() => {
        legTweens.current.forEach((t) => t.pause()) // stand still on the carpet
        gsap.set([legL.current, legR.current], { y: 0 })
        gsap.set(carpet.current, { autoAlpha: 1, scaleX: 0, transformOrigin: '50% 50%' })
        root.current?.classList.add(styles.charged) // supercharge + shimmer
        if (emotion.current === 'normal') say(rand(SAY.magic), 1.8)
      })
      tl.to(carpet.current, { scaleX: 1, duration: 0.3, ease: 'back.out(2)' })
        .to(body.current, { y: -3, duration: 0.2 }, '<')
      const midY = Math.min(cy, py) - 90
      tl.to(drag.current, { x: toDX(px), duration: 1.3, ease: 'power1.inOut' })
        .to(drag.current, { keyframes: [{ y: toDY(midY), duration: 0.65, ease: 'sine.out' }, { y: toDY(py), duration: 0.65, ease: 'sine.in' }] }, '<')
        .to(carpet.current, { rotation: 2, duration: 0.6, yoyo: true, repeat: 1, ease: 'sine.inOut' }, '<')
      tl.to(carpet.current, { scaleX: 0, autoAlpha: 0, duration: 0.3, ease: 'power2.in' })
        .to(body.current, { y: 0, duration: 0.2 }, '<')
        .call(() => {
          root.current?.classList.remove(styles.charged)
          legTweens.current.forEach((t) => t.resume())
        })
      cx = px
      cy = py
    }

    let guard = 0
    while (guard++ < 26) {
      if (Math.abs(cy - homeFeetY) < 8) {
        walkTo(homeFeetX)
        break
      }
      if (homeFeetY > cy + 8) {
        // home is below — walk over and drop onto it
        walkTo(homeFeetX)
        tl.to(drag.current, { y: toDY(homeFeetY), duration: 0.45, ease: 'power2.in' })
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
        walkTo(homeFeetX)
      } else {
        // stuck with no ledge between here and home → magic carpet the rest
        carpetTo(homeFeetX, homeFeetY)
        break
      }
    }
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
        <div ref={jump} className={styles.layer}>
          <div ref={bubble} className={styles.bubble}>
            <span ref={bubbleText} />
          </div>
          <div ref={carpet} className={styles.carpet} aria-hidden />
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
                <g ref={cheeks}>
                  <ellipse cx="64" cy="114" rx="11" ry="6" fill="#ff8f8f" opacity="0.75" />
                  <ellipse cx="136" cy="114" rx="11" ry="6" fill="#ff8f8f" opacity="0.75" />
                </g>
                <g ref={eyesOpen}>
                  <ellipse cx="82" cy="97" rx="11" ry="13" fill="#20140f" />
                  <ellipse cx="118" cy="97" rx="11" ry="13" fill="#20140f" />
                  <g ref={pupilL}>
                    <circle cx="85" cy="94" r="3.2" fill="#fff" />
                  </g>
                  <g ref={pupilR}>
                    <circle cx="121" cy="94" r="3.2" fill="#fff" />
                  </g>
                  {/* little smile */}
                  <path d="M91 120 Q100 127 109 120" fill="none" stroke="#20140f" strokeWidth="4.5" strokeLinecap="round" />
                </g>
                <g ref={eyesHappy} stroke="#20140f" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none">
                  <path d="M72 86 L92 99 L72 112" />
                  <path d="M128 86 L108 99 L128 112" />
                  {/* big grin */}
                  <path d="M86 118 Q100 132 114 118" strokeWidth="5" />
                </g>
                <g ref={faceBlush} stroke="#20140f" strokeWidth="7" strokeLinecap="round" fill="none">
                  <path d="M72 100 Q82 90 92 100" />
                  <path d="M108 100 Q118 90 128 100" />
                  {/* shy little smile */}
                  <path d="M93 120 Q100 126 107 120" strokeWidth="4.5" />
                </g>
                <g ref={faceAngry}>
                  <g stroke="#20140f" strokeWidth="7" strokeLinecap="round">
                    <path d="M70 86 L94 96" />
                    <path d="M130 86 L106 96" />
                  </g>
                  <ellipse cx="84" cy="105" rx="7" ry="8" fill="#20140f" />
                  <ellipse cx="116" cy="105" rx="7" ry="8" fill="#20140f" />
                  {/* gritted frown */}
                  <path d="M90 124 Q100 116 110 124" fill="none" stroke="#20140f" strokeWidth="4.5" strokeLinecap="round" />
                </g>
                <g ref={faceSad}>
                  <g stroke="#20140f" strokeWidth="7" strokeLinecap="round" fill="none">
                    <path d="M72 96 Q82 108 92 100" />
                    <path d="M108 100 Q118 108 128 96" />
                  </g>
                  <ellipse cx="86" cy="116" rx="3.5" ry="6" fill="#bfe3ff" />
                  {/* wobbly frown */}
                  <path d="M90 126 Q100 116 110 126" fill="none" stroke="#20140f" strokeWidth="4.5" strokeLinecap="round" />
                </g>
                <g ref={faceBored} stroke="#20140f" strokeWidth="7" strokeLinecap="round">
                  <path d="M70 100 L94 100" />
                  <path d="M106 100 L130 100" />
                  {/* small yawn */}
                  <ellipse cx="100" cy="122" rx="6" ry="7" fill="#20140f" stroke="none" />
                </g>
                <g ref={faceDizzy} stroke="#20140f" strokeWidth="6" strokeLinecap="round">
                  <path d="M76 92 L92 108" />
                  <path d="M92 92 L76 108" />
                  <path d="M108 92 L124 108" />
                  <path d="M124 92 L108 108" />
                  {/* woozy squiggle */}
                  <path d="M90 122 q5 -6 10 0 q5 6 10 0" fill="none" strokeWidth="4.5" />
                </g>
              </g>
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}

export const Mascot = forwardRef(MascotBase)
