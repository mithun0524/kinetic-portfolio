import { useRef } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '../lib/gsap'
import { projects, type Project } from '../data/projects'
import styles from './Work.module.css'

/** A single project card: clip-path reveal, parallax visual, tilt on hover. */
function Card({ project }: { project: Project }) {
  const root = useRef<HTMLElement>(null)
  const visual = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const el = root.current!
    const vis = visual.current!

    if (!prefersReducedMotion()) {
      // clip-path reveal on enter
      gsap.from(el, {
        clipPath: 'inset(100% 0% 0% 0%)',
        duration: 1.1,
        ease: 'power4.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
      })
      // parallax on the inner visual
      gsap.fromTo(
        vis,
        { yPercent: -12 },
        {
          yPercent: 12,
          ease: 'none',
          scrollTrigger: {
            trigger: el,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        }
      )
    }

    // tilt / magnetic on hover (desktop only)
    if (prefersReducedMotion() || window.matchMedia('(hover: none)').matches) return
    const rotX = gsap.quickTo(el, 'rotationX', { duration: 0.5, ease: 'power3' })
    const rotY = gsap.quickTo(el, 'rotationY', { duration: 0.5, ease: 'power3' })
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      const px = (e.clientX - r.left) / r.width - 0.5
      const py = (e.clientY - r.top) / r.height - 0.5
      rotY(px * 10)
      rotX(-py * 10)
    }
    const leave = () => {
      rotX(0)
      rotY(0)
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    return () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', leave)
    }
  }, { scope: root })

  return (
    <article ref={root} className={styles.card} data-cursor="grow">
      <a href={project.href} className={styles.link}>
        <div className={styles.visualWrap}>
          <div
            ref={visual}
            className={styles.visual}
            style={{ ['--seed' as string]: project.index }}
          >
            <span className={styles.bigIndex}>{project.index}</span>
          </div>
        </div>
        <div className={styles.info}>
          <div className={styles.head}>
            <h3 className={`display ${styles.name}`}>{project.title}</h3>
            <span className={styles.year}>{project.year}</span>
          </div>
          <p className={styles.blurb}>{project.blurb}</p>
          <div className={styles.tags}>
            <span className={styles.role}>{project.role}</span>
            <span className={styles.tagList}>
              {project.tags.map((t) => (
                <span key={t} className={styles.tag}>
                  {t}
                </span>
              ))}
            </span>
          </div>
        </div>
      </a>
    </article>
  )
}

export function Work() {
  return (
    <section className={`section ${styles.work}`} id="work">
      <div className={styles.header}>
        <span className="eyebrow">( Selected Work )</span>
        <h2 className={`display ${styles.heading}`}>Recent builds</h2>
      </div>
      <div className={styles.grid}>
        {projects.map((p) => (
          <Card key={p.index} project={p} />
        ))}
      </div>
    </section>
  )
}
