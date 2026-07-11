// Real stats + skills for Mithun Chavan A (github.com/mithun0524)
export interface Stat {
  value: number
  suffix: string
  label: string
}

export const stats: Stat[] = [
  { value: 30, suffix: '+', label: 'Public repositories shipped' },
  { value: 15, suffix: '+', label: 'Full-stack & AI apps built' },
  { value: 5, suffix: '+', label: 'Products live on the web' },
  { value: 8, suffix: '+', label: 'Languages & frameworks in play' },
]

export interface Capability {
  label: string
  logo: string
}

export const capabilities: Capability[] = [
  { label: 'Agentic AI', logo: '/logos/agentic.svg' },
  { label: 'LLM Integration', logo: '/logos/llm.svg' },
  { label: 'React & Next.js', logo: '/logos/react.svg' },
  { label: 'TypeScript', logo: '/logos/typescript.svg' },
  { label: 'FastAPI & Python', logo: '/logos/python.svg' },
  { label: 'WebContainers', logo: '/logos/stackblitz.svg' },
  { label: 'GSAP Motion', logo: '/logos/greensock.svg' },
  { label: 'Framer Motion', logo: '/logos/framer.svg' },
  { label: 'Supabase', logo: '/logos/supabase.svg' },
  { label: 'Computer Vision', logo: '/logos/opencv.svg' },
]
