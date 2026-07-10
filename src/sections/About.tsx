import { useSplitReveal } from '../hooks/useSplitReveal'
import styles from './About.module.css'

/**
 * About: a large statement revealed word-by-word, scrubbed to scroll so
 * the copy "writes itself" as you move down the page.
 */
export function About() {
  const statement = useSplitReveal<HTMLParagraphElement>({
    type: 'words',
    scrub: true,
    stagger: 0.06,
    y: 130,
    start: 'top 75%',
  })

  return (
    <section className={`section ${styles.about}`} id="about">
      <span className="eyebrow">( About )</span>
      <p ref={statement} className={`display ${styles.statement}`} style={{ opacity: 0 }}>
        I build things that ship — autonomous AI agents, browser-based dev
        tools and adaptive learning. Full-stack, end to end, where every
        interaction feels <span className="chrome-text">intentional</span>.
      </p>
    </section>
  )
}
