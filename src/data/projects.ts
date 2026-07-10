// Real projects pulled from github.com/mithun0524
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
    title: 'Crayon',
    role: 'Creator',
    year: '2026',
    tags: ['TypeScript', 'Ink', 'LLM Agents'],
    blurb:
      'Autonomous AI coding agent for the terminal & VS Code. A ReAct loop that plans, runs commands and self-heals failing builds — with a local Tree-sitter + SQLite indexer and hot-swappable models (Anthropic, OpenAI, Ollama).',
    href: 'https://crayon-umber.vercel.app',
  },
  {
    index: '02',
    title: 'DevForge',
    role: 'Creator',
    year: '2026',
    tags: ['Next.js', 'React 19', 'WebContainers'],
    blurb:
      'A browser-based AI code editor that ships production apps with live preview. Full Node runtime via WebContainers, Monaco editor, integrated terminal and 5+ free LLMs — zero backend.',
    href: 'https://devforge-chi.vercel.app',
  },
  {
    index: '03',
    title: 'AdaptIQ',
    role: 'Creator',
    year: '2026',
    tags: ['TypeScript', 'IRT', 'AI Tutoring'],
    blurb:
      'Adaptive learning platform for maths. IRT-driven difficulty that meets each learner at their level, AI hints at the moment of confusion, and NCERT-aligned practice with streaks and progress tracking.',
    href: 'https://github.com/mithun0524/AdaptIQ',
  },
  {
    index: '04',
    title: 'InterPrep',
    role: 'Creator',
    year: '2025',
    tags: ['Next.js', 'Voice AI', 'Firebase'],
    blurb:
      'AI-powered interview prep with real-time voice. Simulates technical, behavioral and mixed interviews, then returns instant scored feedback and a reviewable history.',
    href: 'https://interprep-kappa.vercel.app',
  },
]
