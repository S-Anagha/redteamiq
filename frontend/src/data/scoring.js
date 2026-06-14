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

// ── CVSS-style colors (per the report spec) ──────────────────────────────────
export const SEV_COLOR = {
  CRITICAL: '#FF3B3B',
  HIGH: '#FF8C00',
  MEDIUM: '#FFD700',
  LOW: '#4CAF50',
}
export const DEFENDED_COLOR = '#2ECC71'

// ── Letter-grade bands ───────────────────────────────────────────────────────
export const GRADE_BANDS = [
  { min: 85, max: 100, grade: 'A', label: 'Secure', color: '#2ECC71' },
  { min: 70, max: 84, grade: 'B', label: 'Low Risk', color: '#A3D977' },
  { min: 55, max: 69, grade: 'C', label: 'Moderate Risk', color: '#FFD700' },
  { min: 40, max: 54, grade: 'D', label: 'High Risk', color: '#FF8C00' },
  { min: 25, max: 39, grade: 'E', label: 'Critical Risk', color: '#FF5A1F' },
  { min: 0, max: 24, grade: 'F', label: 'Compromised', color: '#FF3B3B' },
]
export function gradeFor(score) {
  return GRADE_BANDS.find((b) => score >= b.min && score <= b.max) ?? GRADE_BANDS[GRADE_BANDS.length - 1]
}

// ── The 5 scoring dimensions ─────────────────────────────────────────────────
export const DIMENSIONS = [
  { key: 'exploitability', label: 'Exploitability' },
  { key: 'blast_radius', label: 'Blast Radius' },
  { key: 'reversibility', label: 'Reversibility' },
  { key: 'detection_difficulty', label: 'Detection Difficulty' },
  { key: 'authentication_bypass', label: 'Auth Bypass' },
]

// Severity label from a finding's dimension average (0-10), CVSS-style.
export function labelFromScore(avg) {
  if (avg >= 9) return 'CRITICAL'
  if (avg >= 7) return 'HIGH'
  if (avg >= 4) return 'MEDIUM'
  return 'LOW'
}

// Use a finding's real dimensions when present; otherwise synthesize a plausible
// profile from its severity (so mock / older reports still render the radar + bars).
const SYNTH = {
  CRITICAL: { exploitability: 9, blast_radius: 9, reversibility: 9, detection_difficulty: 8, authentication_bypass: 9 },
  HIGH: { exploitability: 7, blast_radius: 7, reversibility: 6, detection_difficulty: 6, authentication_bypass: 7 },
  MEDIUM: { exploitability: 5, blast_radius: 5, reversibility: 4, detection_difficulty: 5, authentication_bypass: 4 },
  LOW: { exploitability: 3, blast_radius: 3, reversibility: 2, detection_difficulty: 3, authentication_bypass: 2 },
}
export function dimsFor(finding) {
  if (finding?.dimensions && typeof finding.dimensions === 'object') return finding.dimensions
  return SYNTH[finding?.severity] || SYNTH.MEDIUM
}

// Average each dimension across all findings (for the risk radar).
export function radarData(findings) {
  return DIMENSIONS.map((d) => {
    const vals = (findings || []).map((f) => dimsFor(f)[d.key] ?? 0)
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
    return { key: d.key, label: d.label, value: Math.round(avg * 10) / 10 }
  })
}
