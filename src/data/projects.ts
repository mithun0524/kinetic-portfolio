// PLACEHOLDER content — swap for real projects.
export interface Project {
  index: string
  title: string
  role: string
  year: string
  tags: string[]
  blurb: string
  href: string
}

export const projects: Project[] = [
  {
    index: '01',
    title: 'Aurora Commerce',
    role: 'Lead Frontend / Motion',
    year: '2026',
    tags: ['GSAP', 'WebGL', 'Next.js'],
    blurb:
      'A luxury storefront where products assemble on scroll. Scroll-scrubbed timelines and shader transitions cut bounce by 34%.',
    href: '#',
  },
  {
    index: '02',
    title: 'Sonare Audio',
    role: 'Interaction Engineer',
    year: '2025',
    tags: ['Kinetic Type', 'Canvas', 'React'],
    blurb:
      'Sound-reactive brand site. Waveform-driven kinetic typography synced to a live audio analyser.',
    href: '#',
  },
  {
    index: '03',
    title: 'Meridian Studio',
    role: 'Creative Developer',
    year: '2025',
    tags: ['Parallax', 'Lenis', 'ScrollTrigger'],
    blurb:
      'Editorial agency portfolio built on layered parallax and pinned horizontal galleries. Awwwards SOTD.',
    href: '#',
  },
  {
    index: '04',
    title: 'Volt Mobility',
    role: 'Frontend Architect',
    year: '2024',
    tags: ['SVG Morph', 'GSAP', 'TypeScript'],
    blurb:
      'EV configurator with morphing SVG blueprints and magnetic UI. 60fps on mid-range mobile.',
    href: '#',
  },
]
