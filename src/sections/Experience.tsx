import { useRef } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '../lib/gsap'
import { experience } from '../data/experience'
import styles from './Experience.module.css'

/**
 * Experience: a vertical timeline of roles. Each row slides + fades in on
 * scroll, and a chrome progress line draws down the rail as you scroll past.
 */
export function Experience() {
  const section = useRef<HTMLElement>(null)

  useGSAP(() => {
    if (prefersReducedMotion()) return

    // draw the rail line
    gsap.fromTo(
      `.${styles.rail}`,
      { scaleY: 0 },
      {
        scaleY: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: `.${styles.list}`,
          start: 'top 70%',
          end: 'bottom 70%',
          scrub: true,
        },
      }
    )

    // reveal each row
    gsap.from(`.${styles.row}`, {
      y: 60,
      opacity: 0,
      duration: 0.9,
      ease: 'power4.out',
      stagger: 0.15,
      scrollTrigger: { trigger: `.${styles.list}`, start: 'top 80%' },
    })
  }, { scope: section })

  return (
    <section ref={section} className={`section ${styles.exp}`} id="experience">
      <div className={styles.header}>
        <span className="eyebrow">( Experience )</span>
        <h2 className={`display ${styles.heading}`}>Where I&apos;ve worked</h2>
      </div>

      <div className={styles.list}>
        <span className={styles.rail} aria-hidden />
        {experience.map((r, i) => (
          <div key={i} className={styles.row}>
            <span className={styles.dot} aria-hidden />
            <div className={styles.period}>{r.period}</div>
            <div className={styles.detail}>
              <h3 className={`display ${styles.title}`}>{r.title}</h3>
              <span className={styles.company}>
                {r.company} · {r.location}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
