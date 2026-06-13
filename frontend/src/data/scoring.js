// Scoring system from CLAUDE.md. Start at 100; deduct per severity.
export const DEDUCTIONS = { CRITICAL: 20, HIGH: 10, MEDIUM: 5, LOW: 2 }

export const SEVERITY_ORDER = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']

export const BANDS = [
  { min: 85, max: 100, rating: 'SECURE', color: '#22c55e' },
  { min: 65, max: 84, rating: 'MODERATE', color: '#84cc16' },
  { min: 40, max: 64, rating: 'HIGH RISK', color: '#f59e0b' },
  { min: 20, max: 39, rating: 'CRITICAL', color: '#ef4444' },
  { min: 0, max: 19, rating: 'COMPROMISED', color: '#b91c1c' },
]

export function ratingFor(score) {
  return BANDS.find((b) => score >= b.min && score <= b.max) ?? BANDS[BANDS.length - 1]
}

// Compute the final score from a list of confirmed findings.
export function scoreFromFindings(findings) {
  const raw = findings.reduce((acc, f) => acc - (DEDUCTIONS[f.severity] ?? 0), 0) + 100
  return Math.max(0, Math.min(100, raw))
}

export const SEVERITY_STYLE = {
  CRITICAL: { text: '#fecaca', bg: 'rgba(239,68,68,0.14)', border: '#ef4444', dot: '#ef4444' },
  HIGH: { text: '#fed7aa', bg: 'rgba(245,158,11,0.14)', border: '#f59e0b', dot: '#f59e0b' },
  MEDIUM: { text: '#fde68a', bg: 'rgba(234,179,8,0.12)', border: '#eab308', dot: '#eab308' },
  LOW: { text: '#bae6fd', bg: 'rgba(34,211,238,0.10)', border: '#22d3ee', dot: '#22d3ee' },
}
