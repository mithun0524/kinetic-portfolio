import styles from './Grain.module.css'

/** Fixed film-grain overlay for texture. Pure CSS/SVG, no JS. */
export function Grain() {
  return <div className={styles.grain} aria-hidden />
}
