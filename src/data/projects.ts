// Real projects pulled from github.com/mithun0524
export interface Project {
  index: string
  title: string
  role: string
  year: string
  tags: string[]
  blurb: string
  href: string
  /** Live-site screenshot in /public/previews; falls back to a generated visual. */
  image?: string
}

export const projects: Project[] = [
  {
    index: '01',
    title: 'Crayon',
    role: 'Creator',
    year: '2026',
    tags: ['TypeScript', 'Ink', 'LLM Agents'],
    blurb:
      'An AI coding agent that lives in your terminal and VS Code. It plans the work, runs the commands, and fixes its own broken builds. It indexes your codebase locally and lets you swap between Claude, GPT and local Ollama models.',
    href: 'https://crayon-umber.vercel.app',
    image: '/previews/crayon.jpg',
  },
  {
    index: '02',
    title: 'DevForge',
    role: 'Creator',
    year: '2026',
    tags: ['Next.js', 'React 19', 'WebContainers'],
    blurb:
      'An AI code editor that runs entirely in your browser. It spins up a real Node environment, generates whole apps with live preview, and needs no backend at all.',
    href: 'https://devforge-chi.vercel.app',
    image: '/previews/devforge.jpg',
  },
  {
    index: '03',
    title: 'AdaptIQ',
    role: 'Creator',
    year: '2026',
    tags: ['TypeScript', 'IRT', 'AI Tutoring'],
    blurb:
      'A maths practice app that adapts to each student. It reads how you’re doing and adjusts the difficulty, drops in hints when you get stuck, and tracks your progress across NCERT topics.',
    href: 'https://github.com/mithun0524/AdaptIQ',
  },
  {
    index: '04',
    title: 'InterPrep',
    role: 'Creator',
    year: '2025',
    tags: ['Next.js', 'Voice AI', 'Firebase'],
    blurb:
      'Practice interviews out loud with an AI. It runs technical and behavioral rounds by voice, scores you right after, and keeps every session so you can look back on how you did.',
    href: 'https://interpreppy.vercel.app/',
    image: '/previews/interprep.jpg',
  },
]
