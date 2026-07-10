import { useState } from 'react'
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

export default function App() {
  const [ready, setReady] = useState(false)
  useLenis()

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
    </>
  )
}
