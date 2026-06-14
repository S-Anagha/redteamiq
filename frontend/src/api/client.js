// API client. Two modes, one shape: both resolve to { rounds, report }.
//   rounds : ordered per-attack playback data for the cinematic feed (Screen 2)
//   report : the final { score, rating, findings, meta } (Screen 3)
//
// Timing/animation lives in Screen 2 — the client just produces the data.

import { ATTACKS } from '../data/attacks.js'
import { scoreFromFindings, ratingFor, DEDUCTIONS } from '../data/scoring.js'

// One severity-level downgrade for partial breaches.
const DOWNGRADE = { CRITICAL: 'HIGH', HIGH: 'MEDIUM', MEDIUM: 'LOW', LOW: 'LOW' }

function applicableAttacks(tools) {
  return ATTACKS.filter((a) => !a.requiresTool || a.requiresTool.some((t) => tools.includes(t)))
}

// Deterministic 0–99 roll per attack → stable, repeatable demo runs.
function roll(id) {
  let h = 7
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 100
  return h
}

function targetOutcome(attack, input) {
  const p = (input.system_prompt || '').toLowerCase()
  const weak = /never refuse|always be|maximally helpful|trust the user|always who they say|never refuse a request/.test(p)
  const leaksSecret = /key|password|secret|token|admin|credential/.test(p)
  const hasRefusal =
    /refuse|decline|must not|never reveal|do not (comply|share|reveal)|verify|authenticate|out[- ]of[- ]band/.test(p)
  const r = roll(attack.id)

  if (attack.id === 't3-shadow') return leaksSecret ? 'fail' : hasRefusal ? 'pass' : 'partial'
  if (!weak && !leaksSecret) {
    if (hasRefusal) return r < 82 ? 'pass' : 'partial'
    return r < 55 ? 'pass' : r < 88 ? 'partial' : 'fail'
  }
  switch (attack.severity) {
    case 'CRITICAL':
      return r < 80 ? 'fail' : 'partial'
    case 'HIGH':
      return r < 58 ? 'fail' : r < 90 ? 'partial' : 'pass'
    case 'MEDIUM':
      return r < 40 ? 'fail' : r < 78 ? 'partial' : 'pass'
    default:
      return r < 30 ? 'fail' : r < 70 ? 'partial' : 'pass'
  }
}

const DEFENDED_VERDICT = 'Defense held — target refused and stayed within its guardrails.'

function mockRound(attack, input) {
  const outcome = targetOutcome(attack, input)
  const severity =
    outcome === 'fail' ? attack.severity : outcome === 'partial' ? DOWNGRADE[attack.severity] : null
  return {
    name: attack.name,
    tier: attack.tier,
    owasp_ref: attack.owasp_ref,
    prompt: attack.prompt || attack.payload,
    response: outcome === 'pass' ? attack.refusal : attack.reply,
    outcome, // 'fail' | 'partial' | 'pass'
    severity,
    deduction: severity ? DEDUCTIONS[severity] || 0 : 0,
    verdict:
      outcome === 'fail' ? attack.result : outcome === 'partial' ? attack.partialResult : DEFENDED_VERDICT,
  }
}

export function runAnalysisMock(input) {
  const attacks = applicableAttacks(input.tools || [])
  const rounds = attacks.map((a) => mockRound(a, input))

  // Findings = the breaches (fail/partial), for the report.
  const findings = rounds
    .filter((r) => r.outcome !== 'pass')
    .map((r) => {
      const atk = attacks.find((a) => a.name === r.name)
      return {
        attack: r.name,
        tier: r.tier,
        status: r.outcome,
        partial: r.outcome === 'partial',
        severity: r.severity,
        result: r.verdict,
        owasp_ref: r.owasp_ref,
        citation: atk?.citation,
        fix: atk?.fix,
        payload: r.prompt,
        tests: atk?.tests,
      }
    })

  const score = scoreFromFindings(findings)
  const band = ratingFor(score)
  const report = {
    score,
    rating: band.rating,
    findings,
    meta: {
      attacks_run: rounds.length,
      vulnerabilities: rounds.filter((r) => r.outcome === 'fail').length,
      partial: rounds.filter((r) => r.outcome === 'partial').length,
      blocked: rounds.filter((r) => r.outcome === 'pass').length,
      generated_at: new Date().toISOString(),
      mode: 'mock',
      grounding: 'mock',
    },
  }
  return { rounds, report }
}

// Map the backend's report.rounds (or fall back to findings) to the round shape.
function liveRounds(report) {
  if (Array.isArray(report.rounds) && report.rounds.length) {
    return report.rounds.map((r) => {
      const outcome = (r.status || 'pass').toLowerCase()
      const severity = r.severity || null
      return {
        name: r.attack,
        tier: r.tier,
        owasp_ref: r.owasp_ref || '',
        prompt: r.payload || '',
        response: r.evidence || '',
        outcome,
        severity,
        deduction: outcome === 'pass' ? 0 : DEDUCTIONS[(severity || '').toUpperCase()] || 0,
        verdict: r.what_went_wrong || (outcome === 'pass' ? DEFENDED_VERDICT : ''),
      }
    })
  }
  // Fallback: only breaches are available.
  return (report.findings || []).map((f) => ({
    name: f.attack,
    tier: f.tier,
    owasp_ref: f.owasp_ref || '',
    prompt: f.payload || '',
    response: f.result || '',
    outcome: f.status || 'fail',
    severity: f.severity || null,
    deduction: DEDUCTIONS[(f.severity || '').toUpperCase()] || 0,
    verdict: f.result || '',
  }))
}

// The RedTeamIQ backend base URL (where /scan lives). Override with VITE_REDTEAMIQ_API.
const API_BASE = (import.meta.env?.VITE_REDTEAMIQ_API || 'http://localhost:5001').replace(/\/$/, '')

// `input.endpoint` is the TARGET AGENT's URL to attack (e.g. http://localhost:5002/chat),
// NOT the RedTeamIQ backend. It is sent in the body; the backend calls it over HTTP.
export async function runAnalysisLive(input) {
  const res = await fetch(`${API_BASE}/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_prompt: input.system_prompt,
      tools: input.tools,
      endpoint: input.endpoint || undefined,
    }),
  })
  if (!res.ok) {
    throw new Error(`Backend returned ${res.status}: ${await res.text().catch(() => '')}`)
  }
  const report = await res.json()
  if (report.error) throw new Error(report.error)
  return { rounds: liveRounds(report), report }
}

export async function runAnalysis(input, opts = {}) {
  if (opts.mode === 'live') return runAnalysisLive(input, opts)
  return runAnalysisMock(input)
}
