import { useEffect, useState } from 'react'
import { TIERS } from '../data/attacks.js'
import { TOOLS } from '../data/tools.js'
import {
  SEVERITY_ORDER,
  DEDUCTIONS,
  SEV_COLOR,
  DEFENDED_COLOR,
  gradeFor,
  DIMENSIONS,
  dimsFor,
  radarData,
} from '../data/scoring.js'

const sevColor = (s) => SEV_COLOR[s] || '#9ca3af'

function agentName(prompt) {
  const m = /you are\s+([A-Za-z][\w.\- ]{0,28}?)[\s,.;:]/i.exec(`${prompt || ''} `)
  return (m && m[1].trim()) || 'The agent'
}

// ── Count-up for the score number ────────────────────────────────────────────
function useCountUp(target, dur = 900) {
  const [n, setN] = useState(0)
  useEffect(() => {
    let raf
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur)
      setN(Math.round((1 - Math.pow(1 - t, 3)) * target))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, dur])
  return n
}

// ── SECTION 1a — Risk radar (custom SVG pentagon, 5 axes 0-10) ────────────────
const RADAR_SHORT = {
  Exploitability: 'Exploit',
  'Blast Radius': 'Blast',
  Reversibility: 'Reverse',
  'Detection Difficulty': 'Detect',
  'Auth Bypass': 'Auth',
}
function RiskRadar({ data }) {
  const cx = 150
  const cy = 125
  const R = 80
  const N = data.length
  const ang = (i) => (Math.PI * 2 * i) / N - Math.PI / 2
  const pt = (i, r) => [cx + Math.cos(ang(i)) * r, cy + Math.sin(ang(i)) * r]
  const poly = (r, scale = 1) => data.map((_, i) => pt(i, r * scale).join(',')).join(' ')
  const dataPoly = data.map((d, i) => pt(i, R * (d.value / 10)).join(',')).join(' ')

  return (
    <svg viewBox="-30 0 360 260" className="h-[230px] w-full max-w-[340px]">
      {[0.25, 0.5, 0.75, 1].map((lvl) => (
        <polygon key={lvl} points={poly(R, lvl)} fill="none" stroke="#1f2937" strokeWidth="1" />
      ))}
      {data.map((_, i) => {
        const [x, y] = pt(i, R)
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#1f2937" strokeWidth="1" />
      })}
      <polygon points={dataPoly} fill="rgba(255,59,59,0.25)" stroke="#FF3B3B" strokeWidth="2" />
      {data.map((d, i) => {
        const [x, y] = pt(i, R * (d.value / 10))
        return <circle key={i} cx={x} cy={y} r="3" fill="#FF3B3B" />
      })}
      {data.map((d, i) => {
        const [x, y] = pt(i, R + 16)
        const anchor = x < cx - 5 ? 'end' : x > cx + 5 ? 'start' : 'middle'
        return (
          <text key={i} x={x} y={y} textAnchor={anchor} dominantBaseline="middle"
            className="fill-gray-400" style={{ fontSize: '9px', fontFamily: 'monospace' }}>
            {RADAR_SHORT[d.label] || d.label} {d.value}
          </text>
        )
      })}
    </svg>
  )
}

function StatBox({ label, value, color }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.05] px-4 py-3 text-center">
      <div className="font-mono text-2xl font-bold" style={{ color: color || '#fff' }}>{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-gray-500">{label}</div>
    </div>
  )
}

// ── SECTION 2 — Attack surface map (tools × tiers) ───────────────────────────
function toolMatches(item, toolId, toolLabel) {
  const hay = `${item.attack || ''} ${item.payload || ''} ${item.result || ''}`.toLowerCase()
  const words = [toolId.replace('_', ' '), toolId, ...toolLabel.toLowerCase().split(' ')]
  return words.some((w) => w.length > 2 && hay.includes(w))
}
function AttackSurfaceMap({ items, tools }) {
  const rows = (tools && tools.length ? tools : ['email', 'database']).map(
    (id) => TOOLS.find((t) => t.id === id) || { id, label: id },
  )
  const tiers = [1, 2, 3, 4, 5, 6, 7]
  const rank = { breached: 3, partial: 2, blocked: 1, none: 0 }
  const norm = (s) => (s === 'fail' ? 'breached' : s === 'pass' ? 'blocked' : s)
  const cellColor = (o) =>
    o === 'breached' ? '#FF3B3B' : o === 'partial' ? '#FF8C00' : o === 'blocked' ? DEFENDED_COLOR : '#161e2d'

  const cell = (toolId, toolLabel, tier) => {
    let best = 'none'
    items
      .filter((it) => Number(it.tier) === tier)
      .forEach((it) => {
        const anyTool = rows.some((r) => toolMatches(it, r.id, r.label))
        if (toolMatches(it, toolId, toolLabel) || !anyTool) {
          const o = norm(it.status || it.outcome || 'none')
          if ((rank[o] || 0) > rank[best]) best = o
        }
      })
    return best
  }

  return (
    <div className="overflow-x-auto">
      <div
        className="inline-grid gap-1"
        style={{ gridTemplateColumns: `120px repeat(${tiers.length}, 44px)` }}
      >
        <div />
        {tiers.map((t) => (
          <div key={t} title={TIERS[t]} className="text-center font-mono text-[10px] text-gray-500">
            T{t}
          </div>
        ))}
        {rows.map((r) => (
          <div key={r.id} className="contents">
            <div className="flex items-center justify-end pr-2 font-mono text-[11px] text-gray-400">
              {r.label}
            </div>
            {tiers.map((t) => {
              const o = cell(r.id, r.label, t)
              return (
                <div
                  key={t}
                  title={`${r.label} · ${TIERS[t]} · ${o}`}
                  className="h-8 rounded"
                  style={{ background: cellColor(o), opacity: o === 'none' ? 0.5 : 1 }}
                />
              )
            })}
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-3 font-mono text-[10px] text-gray-500">
        <Legend c="#FF3B3B" t="breached" />
        <Legend c="#FF8C00" t="partial" />
        <Legend c={DEFENDED_COLOR} t="blocked" />
        <Legend c="#161e2d" t="not tested" />
      </div>
    </div>
  )
}
function Legend({ c, t }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-3 w-3 rounded" style={{ background: c }} /> {t}
    </span>
  )
}

// ── SECTION 3 — dimension bars + finding card ────────────────────────────────
function DimensionBars({ dims }) {
  return (
    <div className="space-y-1.5">
      {DIMENSIONS.map((d) => {
        const v = dims[d.key] ?? 0
        const color = v >= 9 ? SEV_COLOR.CRITICAL : v >= 7 ? SEV_COLOR.HIGH : v >= 4 ? SEV_COLOR.MEDIUM : SEV_COLOR.LOW
        return (
          <div key={d.key} className="flex items-center gap-2">
            <span className="w-32 shrink-0 font-mono text-[10px] text-gray-400">{d.label}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full" style={{ width: `${v * 10}%`, background: color }} />
            </div>
            <span className="w-6 text-right font-mono text-[10px] text-gray-400">{v}</span>
          </div>
        )
      })}
    </div>
  )
}

function FindingCard({ f }) {
  const dims = dimsFor(f)
  const color = sevColor(f.severity)
  return (
    <div className="slide-in rounded-xl border border-white/10 bg-white/[0.05] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="rounded px-2 py-0.5 font-mono text-[11px] font-bold"
              style={{ color, background: `${color}1f`, border: `1px solid ${color}66` }}
            >
              {f.severity}{f.severity_score != null ? ` · ${f.severity_score}` : ''}
            </span>
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
            {f.owasp_ref && (
              <span className="rounded border border-white/10 px-1.5 py-0.5 font-mono text-[11px] text-gray-400">
                OWASP {f.owasp_ref}
              </span>
            )}
          </div>
          <h3 className="mt-2 text-base font-semibold text-white">{f.attack}</h3>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <DimensionBars dims={dims} />
        <div className="space-y-2 text-sm">
          {f.payload && <Field label="What the attacker did" value={f.payload} />}
          <Field label="What the agent did wrong" value={f.result} accent="red" />
        </div>
      </div>

      {f.evidence && (
        <div className="mt-3">
          <div className="font-mono text-[10px] uppercase tracking-wide text-gray-500">Evidence (agent's actual response)</div>
          <pre className="mt-1 max-h-32 overflow-auto whitespace-pre-wrap rounded-lg border border-white/10 bg-[#0a0e14] p-3 font-mono text-[12px] text-red-200/90">{f.evidence}</pre>
        </div>
      )}

      <div className="mt-3 space-y-2 text-sm">
        <Field label="Recommended fix" value={f.fix} accent="cyan" />
        {f.parallel && <Field label="Real-world parallel" value={f.parallel} accent="amber" />}
        {!f.parallel && f.citation && <Field label="Source" value={f.citation} accent="amber" />}
      </div>
    </div>
  )
}

function Field({ label, value, accent }) {
  const c = accent === 'cyan' ? 'text-cyan-200' : accent === 'red' ? 'text-red-200/90' : accent === 'amber' ? 'text-amber-200/90' : 'text-gray-300'
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-wide text-gray-500">{label}</div>
      <div className={`mt-0.5 text-sm ${c}`}>{value}</div>
    </div>
  )
}

// ── SECTION 4 — remediation roadmap ──────────────────────────────────────────
function Roadmap({ findings }) {
  const cols = [
    { title: 'FIX IMMEDIATELY', sub: 'Critical findings', sev: ['CRITICAL'], color: SEV_COLOR.CRITICAL },
    { title: 'FIX BEFORE LAUNCH', sub: 'High findings', sev: ['HIGH'], color: SEV_COLOR.HIGH },
    { title: 'FIX THIS SPRINT', sub: 'Medium & Low findings', sev: ['MEDIUM', 'LOW'], color: SEV_COLOR.MEDIUM },
  ]
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {cols.map((c) => {
        const items = findings.filter((f) => c.sev.includes(f.severity))
        return (
          <div key={c.title} className="rounded-xl border border-white/10 bg-white/[0.05] p-4">
            <div className="font-mono text-sm font-bold" style={{ color: c.color }}>{c.title}</div>
            <div className="text-[11px] text-gray-500">{c.sub}</div>
            <ol className="mt-3 space-y-2">
              {items.length === 0 && <li className="text-xs text-gray-600">— nothing here —</li>}
              {items.map((f, i) => (
                <li key={i} className="flex gap-2 text-xs text-gray-300">
                  <span className="font-mono" style={{ color: c.color }}>{i + 1}.</span>
                  <span><span className="text-gray-400">{f.attack}:</span> {f.fix}</span>
                </li>
              ))}
            </ol>
          </div>
        )
      })}
    </div>
  )
}

// ── Report ───────────────────────────────────────────────────────────────────
export default function ReportScreen({ report, input, onReset }) {
  const findings = report.findings || []
  const m = report.meta || {}
  const band = gradeFor(report.score)
  const shown = useCountUp(report.score)
  const radar = radarData(findings)

  const fails = m.vulnerabilities ?? findings.filter((f) => f.status === 'fail').length
  const partials = m.partial ?? findings.filter((f) => f.partial).length
  const attacksRun = m.attacks_run ?? findings.length
  const blocked = m.blocked ?? Math.max(0, attacksRun - findings.length)

  const topDim = [...radar].sort((a, b) => b.value - a.value)[0]
  const worst = [...findings].sort((a, b) => (b.severity_score ?? 0) - (a.severity_score ?? 0))[0]
  const name = agentName(input?.system_prompt)
  const summary =
    findings.length === 0
      ? `${name} resisted all ${attacksRun} attacks — no confirmed vulnerabilities.`
      : `${name} failed ${fails + partials} of ${attacksRun} attacks (${fails} breached, ${partials} partial). ` +
        `Its biggest weakness is ${topDim.label.toLowerCase()} (avg ${topDim.value}/10).` +
        (worst ? ` Highest-risk finding: ${worst.attack}.` : '')

  const sorted = [...findings].sort(
    (a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity),
  )
  const mapItems = (report.rounds && report.rounds.length ? report.rounds : findings)

  // Download = the browser's native Print → Save as PDF of this exact rendered report
  // (radar, colors, surface map all preserved). Print CSS in index.css hides the app chrome.
  const downloadPdf = () => window.print()

  return (
    <div className="report-print mx-auto max-w-5xl px-6 py-8">
      {/* Printable document title (shown in the PDF; subtle on screen) */}
      <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-3">
        <div>
          <div className="font-mono text-lg font-semibold tracking-tight text-white">
            RedTeam<span className="text-red-500">IQ</span> — Security Report
          </div>
          <div className="font-mono text-[11px] text-gray-500">
            {agentName(input?.system_prompt)} · {m.execution_mode === 'real-endpoint' ? 'live target' : m.mode === 'mock' ? 'simulation (mock)' : 'simulation'}
            {m.generated_at ? ` · ${String(m.generated_at).slice(0, 10)}` : ''}
          </div>
        </div>
        <button
          onClick={downloadPdf}
          className="no-print rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:border-cyan-500/70"
        >
          ⤓ Download PDF
        </button>
      </div>
      {/* SECTION 1 — Executive summary */}
      <div className="rounded-xl border border-white/10 bg-white/[0.05] p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="flex items-center gap-5">
            <div className="text-center">
              <div className="font-mono text-7xl font-black leading-none" style={{ color: band.color, textShadow: `0 0 28px ${band.color}55` }}>
                {band.grade}
              </div>
              <div className="mt-1 font-mono text-sm" style={{ color: band.color }}>{band.label}</div>
              <div className="mt-1 font-mono text-2xl font-bold text-white">{shown}<span className="text-sm text-gray-500">/100</span></div>
            </div>
            <div className="flex-1">
              <RiskRadar data={radar} />
            </div>
          </div>
          <div className="flex-1">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatBox label="Attacks" value={attacksRun} />
              <StatBox label="Breaches" value={fails} color={SEV_COLOR.CRITICAL} />
              <StatBox label="Partial" value={partials} color={SEV_COLOR.HIGH} />
              <StatBox label="Blocked" value={blocked} color={DEFENDED_COLOR} />
            </div>
            <p className="mt-4 text-sm leading-relaxed text-gray-300">{summary}</p>
          </div>
        </div>
      </div>

      {/* SECTION 2 — Attack surface map */}
      <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.05] p-6">
        <h3 className="mb-1 text-sm font-semibold text-white">Attack surface map</h3>
        <p className="mb-4 text-xs text-gray-500">Which tools are vulnerable to which attack tiers.</p>
        <AttackSurfaceMap items={mapItems} tools={input?.tools || []} />
      </div>

      {/* SECTION 3 — Findings */}
      <div className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-mono text-sm uppercase tracking-wide text-gray-400">Findings ({findings.length})</h3>
        </div>
        {findings.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.05] p-10 text-center text-gray-300">
            ✓ No confirmed vulnerabilities. The agent resisted every attack.
          </div>
        ) : (
          <div className="space-y-4">
            {sorted.map((f, i) => <FindingCard key={i} f={f} />)}
          </div>
        )}
      </div>

      {/* SECTION 4 — Remediation roadmap */}
      {findings.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-4 font-mono text-sm uppercase tracking-wide text-gray-400">Remediation roadmap</h3>
          <Roadmap findings={findings} />
        </div>
      )}

      {/* Actions */}
      <div className="no-print mt-10 flex flex-col items-center justify-center gap-3 border-t border-white/10 pt-8 sm:flex-row">
        <button onClick={downloadPdf} className="w-full rounded-lg border border-white/10 bg-white/[0.05] px-6 py-3 text-sm font-semibold text-gray-200 transition hover:border-cyan-500/50 hover:text-cyan-200 sm:w-auto">
          ⤓ Download PDF
        </button>
        <button onClick={onReset} className="w-full rounded-lg bg-red-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition hover:bg-red-400 sm:w-auto">
          ↻ Run another scan
        </button>
      </div>
    </div>
  )
}
