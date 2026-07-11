import { useState, useEffect, useRef } from 'react'
import { gsap, ScrollTrigger } from './lib/gsap'
import { useLenis } from './hooks/useLenis'
import { Cursor } from './components/Cursor'
import { Grain } from './components/Grain'
import { ScrollProgress } from './components/ScrollProgress'
import { IntroOverlay } from './components/IntroOverlay'
import { Hero } from './sections/Hero'
import { Marquee } from './sections/Marquee'
import { About } from './sections/About'
import { Work } from './sections/Work'
import { Capabilities } from './sections/Capabilities'
import { Experience } from './sections/Experience'
import { Contact } from './sections/Contact'
import { HerbyGame } from './game/HerbyGame'
import styles from './App.module.css'

export default function App() {
  const [ready, setReady] = useState(false)
  const [playing, setPlaying] = useState(false)
  const curtain = useRef<HTMLDivElement>(null)
  useLenis()

  // one shared coral curtain: cover → swap → reveal, used for both open & close
  const transition = (toPlaying: boolean) => {
    const el = curtain.current
    if (!el) { setPlaying(toPlaying); return }
    gsap.killTweensOf(el)
    gsap.set(el, { visibility: 'visible', transformOrigin: '50% 100%', scaleY: 0 })
    gsap
      .timeline()
      .to(el, { scaleY: 1, duration: 0.42, ease: 'power3.in' })
      .add(() => {
        setPlaying(toPlaying)
        gsap.set(el, { transformOrigin: '50% 0%' })
      })
      .to(el, { scaleY: 0, duration: 0.55, ease: 'power3.out', delay: 0.05 })
      .set(el, { visibility: 'hidden' })
  }

  // Pins (Capabilities) insert spacers that shift every trigger below them.
  // Recompute all trigger positions once fonts + layout have settled.
  useEffect(() => {
    document.fonts.ready.then(() => ScrollTrigger.refresh())
    const t = setTimeout(() => ScrollTrigger.refresh(), 600)
    return () => clearTimeout(t)
  }, [ready])

  return (
    <>
      <IntroOverlay onDone={() => setReady(true)} />
      <Cursor />
      <Grain />
      <ScrollProgress />

      <main>
        <Hero ready={ready} />
        <Marquee />
        <About />
        <Work />
        <Capabilities />
        <Experience />
        <Contact onPlay={() => transition(true)} />
      </main>

      <HerbyGame open={playing} onClose={() => transition(false)} />
      <div ref={curtain} className={styles.curtain} aria-hidden />
    </>
  )
}
