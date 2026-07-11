import { useState, useEffect } from 'react'
import { ScrollTrigger } from './lib/gsap'
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
  useLenis()

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
        <Contact />
      </main>

      <button className={styles.playBtn} onClick={() => setPlaying(true)} data-cursor="grow">
        <span className={styles.playDot} />
        Play with Herby
      </button>
      <HerbyGame open={playing} onClose={() => setPlaying(false)} />
    </>
  )
}
