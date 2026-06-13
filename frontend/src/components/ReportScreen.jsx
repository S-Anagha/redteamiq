import { useEffect, useState } from 'react'
import { TIERS } from '../data/attacks.js'
import { SEVERITY_ORDER, DEDUCTIONS, SEVERITY_STYLE, ratingFor } from '../data/scoring.js'
import { Panel, SeverityBadge, Tag } from './ui.jsx'

// Count-up animation for the big score number.
function useCountUp(target, dur = 1000) {
  const [n, setN] = useState(0)
  useEffect(() => {
    let raf
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur)
      const eased = 1 - Math.pow(1 - t, 3)
      setN(Math.round(eased * target))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, dur])
  return n
}

function ScoreHero({ report }) {
  const band = ratingFor(report.score)
  const shown = useCountUp(report.score)
  const m = report.meta || {}

  return (
    <Panel className="mb-8 overflow-hidden">
      <div
        className="flex flex-col items-center gap-6 px-6 py-8 sm:flex-row sm:justify-between sm:gap-10"
        style={{
          background: `radial-gradient(600px 200px at 12% 0%, ${band.color}1f, transparent 70%)`,
        }}
      >
        {/* Big score number + rating */}
        <div className="flex flex-col items-center sm:items-start">
          <div className="flex items-end gap-2">
            <span
              className="font-mono text-8xl font-bold leading-none tracking-tight"
              style={{ color: band.color, textShadow: `0 0 28px ${band.color}55` }}
            >
              {shown}
            </span>
            <span className="mb-2 font-mono text-2xl text-gray-500">/100</span>
          </div>
          <span
            className="mt-3 rounded-full px-5 py-1.5 text-base font-bold tracking-wide"
            style={{
              color: band.color,
              background: `${band.color}1a`,
              border: `1px solid ${band.color}66`,
            }}
          >
            {band.rating}
          </span>
          <span className="mt-2 text-xs text-gray-500">Security posture score</span>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
          <Stat label="Attacks run" value={m.attacks_run ?? '—'} />
          <Stat
            label="Breaches"
            value={m.vulnerabilities ?? report.findings.filter((f) => f.status === 'fail').length}
            tone="red"
          />
          <Stat
            label="Partial"
            value={m.partial ?? report.findings.filter((f) => f.partial).length}
            tone="amber"
          />
          <Stat label="Blocked" value={m.blocked ?? '—'} tone="green" />
        </div>
      </div>
    </Panel>
  )
}

function Stat({ label, value, tone }) {
  const color =
    tone === 'red'
      ? 'text-red-400'
      : tone === 'amber'
        ? 'text-amber-400'
        : tone === 'green'
          ? 'text-green-400'
          : 'text-white'
  return (
    <div className="min-w-[110px] rounded-lg border border-[#1f2937] bg-[#0a0e14] px-4 py-2.5">
      <div className={`font-mono text-2xl font-semibold ${color}`}>{value}</div>
      <div className="text-[11px] text-gray-500">{label}</div>
    </div>
  )
}

function Field({ label, value, mono, accent }) {
  return (
    <div>
      <div className="font-mono text-[11px] uppercase tracking-wide text-gray-500">{label}</div>
      <div
        className={`mt-0.5 ${mono ? 'font-mono text-[13px]' : 'text-sm'} ${
          accent === 'cyan' ? 'text-cyan-200' : accent === 'red' ? 'text-red-200/90' : 'text-gray-300'
        }`}
      >
        {value}
      </div>
    </div>
  )
}

function FindingCard({ f }) {
  return (
    <Panel className="slide-in p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <SeverityBadge severity={f.severity} />
            {f.partial && (
              <span className="rounded border border-amber-500/50 bg-amber-500/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-300">
                PARTIAL
              </span>
            )}
            {f.tier != null && (
              <span className="font-mono text-[11px] text-gray-500">
                Tier {f.tier} · {TIERS[f.tier]}
              </span>
            )}
          </div>
          <h3 className="mt-2 text-base font-semibold text-white">{f.attack}</h3>
        </div>
        <span className="shrink-0 font-mono text-xs text-red-400">
          −{DEDUCTIONS[f.severity] ?? 0} pts
        </span>
      </div>

      <div className="mt-4 space-y-3">
        <Field label="What the attacker did" value={f.payload} />
        <Field label="What the agent did wrong" value={f.result} accent="red" />
        <Field label="Recommended fix" value={f.fix} accent="cyan" />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#1f2937] pt-3">
        <Tag>OWASP {f.owasp_ref}</Tag>
        {f.citation && <Tag>📚 {f.citation}</Tag>}
      </div>
    </Panel>
  )
}

function SeveritySection({ severity, findings }) {
  if (findings.length === 0) return null
  const s = SEVERITY_STYLE[severity]
  return (
    <section className="mb-7">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.dot }} />
        <h3 className="font-mono text-sm font-semibold uppercase tracking-wide" style={{ color: s.text }}>
          {severity}
        </h3>
        <span className="rounded-full bg-[#0f1521] px-2 py-0.5 font-mono text-xs text-gray-400">
          {findings.length}
        </span>
        <div className="ml-1 h-px flex-1" style={{ background: `${s.border}33` }} />
      </div>
      <div className="space-y-4">
        {findings.map((f, i) => (
          <FindingCard key={i} f={f} />
        ))}
      </div>
    </section>
  )
}

// Build a clean, shareable Markdown security report for download.
function toMarkdown(report) {
  const m = report.meta || {}
  const L = []
  L.push('# RedTeamIQ — AI Agent Security Report', '')
  L.push(`**Score:** ${report.score}/100 — ${report.rating}`)
  L.push(
    `**Attacks run:** ${m.attacks_run ?? '—'}  |  **Breaches:** ${m.vulnerabilities ?? '—'}  |  **Partial:** ${m.partial ?? '—'}  |  **Blocked:** ${m.blocked ?? '—'}`,
  )
  if (m.generated_at) L.push(`**Generated:** ${m.generated_at}`)
  L.push('', '---', '')
  for (const sev of SEVERITY_ORDER) {
    const group = report.findings.filter((f) => f.severity === sev)
    if (!group.length) continue
    L.push(`## ${sev} (${group.length})`, '')
    for (const f of group) {
      L.push(`### ${f.attack}${f.partial ? ' (partial)' : ''}`)
      L.push(`- **Tier:** ${f.tier} — ${TIERS[f.tier] ?? ''}`)
      L.push(`- **What the attacker did:** ${f.payload}`)
      L.push(`- **What the agent did wrong:** ${f.result}`)
      L.push(`- **OWASP reference:** ${f.owasp_ref}${f.citation ? ` (${f.citation})` : ''}`)
      L.push(`- **Recommended fix:** ${f.fix}`)
      L.push(`- **Score impact:** −${DEDUCTIONS[f.severity] ?? 0} pts`, '')
    }
  }
  if (!report.findings.length)
    L.push('No confirmed vulnerabilities — the agent resisted every attack tier.')
  return L.join('\n')
}

export default function ReportScreen({ report, onReset }) {
  const { findings = [] } = report

  const downloadReport = () => {
    const blob = new Blob([toMarkdown(report)], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'redteamiq-security-report.md'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <h2 className="mb-6 text-2xl font-semibold tracking-tight text-white">Security Report</h2>

      <ScoreHero report={report} />

      <h3 className="mb-4 font-mono text-sm uppercase tracking-wide text-gray-500">
        Findings ({findings.length})
      </h3>

      {findings.length === 0 ? (
        <Panel className="p-10 text-center text-gray-300">
          <div className="text-3xl">✓</div>
          <p className="mt-2">No confirmed vulnerabilities. The agent resisted every attack tier.</p>
        </Panel>
      ) : (
        SEVERITY_ORDER.map((sev) => (
          <SeveritySection key={sev} severity={sev} findings={findings.filter((f) => f.severity === sev)} />
        ))
      )}

      {/* Bottom actions */}
      <div className="mt-10 flex flex-col items-center justify-center gap-3 border-t border-[#1f2937] pt-8 sm:flex-row">
        <button
          onClick={downloadReport}
          className="w-full rounded-lg border border-[#1f2937] bg-[#0f1521] px-6 py-3 text-sm font-semibold text-gray-200 transition hover:border-cyan-500/50 hover:text-cyan-200 sm:w-auto"
        >
          ↓ Download Report
        </button>
        <button
          onClick={onReset}
          className="w-full rounded-lg bg-red-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition hover:bg-red-400 sm:w-auto"
        >
          ↻ Run another scan
        </button>
      </div>
    </div>
  )
}
