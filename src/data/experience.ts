export interface Role {
  company: string
  title: string
  period: string
  location: string
}

// Roles only — no duty descriptions by request.
export const experience: Role[] = [
  {
    company: 'Aquera Labs',
    title: 'Member of Technical Staff (MTS-1)',
    period: 'May 2026 — Present',
    location: 'Bangalore, India',
  },
  {
    company: 'Aquera Labs',
    title: 'SDE Trainee',
    period: 'Nov 2025 — May 2026',
    location: 'Bangalore, India',
  },
]
