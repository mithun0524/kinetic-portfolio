import { useSplitReveal } from '../hooks/useSplitReveal'
import { useMagnetic } from '../hooks/useMagnetic'
import styles from './Contact.module.css'

/** Contact: kinetic outro line + magnetic email button + footer meta. */
export function Contact() {
  const line = useSplitReveal<HTMLHeadingElement>({ stagger: 0.03, y: 120 })
  const btn = useMagnetic<HTMLAnchorElement>(0.5)

  return (
    <footer className={`section ${styles.contact}`} id="contact">
      <span className="eyebrow">( Let&apos;s build )</span>

      <h2 ref={line} className={`display ${styles.line}`} style={{ opacity: 0 }}>
        Have something that
        <br />
        should <span className="chrome-text">move?</span>
      </h2>

      <a
        ref={btn}
        href="https://github.com/mithun0524"
        target="_blank"
        rel="noreferrer"
        className={styles.cta}
        data-cursor="grow"
      >
        <span>github.com/mithun0524</span>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M4 16L16 4M16 4H6M16 4v10" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </a>

      <div className={styles.meta}>
        <span>© 2026 Mithun Chavan A — Bangalore, India</span>
        <div className={styles.socials}>
          <a href="https://github.com/mithun0524" target="_blank" rel="noreferrer" data-cursor="grow">
            GitHub
          </a>
          <a href="https://mithundotdev.vercel.app" target="_blank" rel="noreferrer" data-cursor="grow">
            mithun.dev
          </a>
          <a href="https://crayon-umber.vercel.app" target="_blank" rel="noreferrer" data-cursor="grow">
            Crayon
          </a>
        </div>
      </div>
    </footer>
  )
}
