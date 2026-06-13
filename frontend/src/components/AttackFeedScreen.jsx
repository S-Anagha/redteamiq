import { useEffect, useRef } from 'react'
import { TIERS } from '../data/attacks.js'
import { Panel, SeverityBadge } from './ui.jsx'

// Three-state result badge: FAIL (red) / PARTIAL (yellow) / PASS (green).
const BADGE = {
  fail: { label: 'FAIL', cls: 'text-red-300 bg-red-500/15 border-red-500/50' },
  partial: { label: 'PARTIAL', cls: 'text-amber-300 bg-amber-500/15 border-amber-500/50' },
  pass: { label: 'PASS', cls: 'text-green-300 bg-green-500/15 border-green-500/50' },
}

function ResultBadge({ status }) {
  if (status === 'running')
    return (
      <span className="flex items-center gap-1.5 font-mono text-xs text-amber-300">
        <span className="h-2 w-2 rounded-full bg-amber-400 blink" /> RUNNING
      </span>
    )
  if (status === 'queued')
    return <span className="font-mono text-xs text-gray-600">QUEUED</span>
  const b = BADGE[status]
  return (
    <span className={`rounded border px-2 py-0.5 font-mono text-xs font-bold ${b.cls}`}>
      {b.label}
    </span>
  )
}

// Left accent + card tint per state.
function cardTone(status) {
  if (status === 'fail') return 'border-red-500/30 bg-red-500/[0.06]'
  if (status === 'partial') return 'border-amber-500/30 bg-amber-500/[0.05]'
  if (status === 'pass') return 'border-green-500/20 bg-green-500/[0.04]'
  if (status === 'running') return 'border-amber-500/40 bg-amber-500/[0.04] pulse-ring'
  return 'border-transparent bg-[#0f1521]/40'
}

function Stat({ value, label, tone }) {
  const color =
    tone === 'red' ? 'text-red-400' : tone === 'amber' ? 'text-amber-400' : tone === 'green' ? 'text-green-400' : 'text-white'
  return (
    <div className="text-right">
      <div className={`text-2xl font-semibold ${color}`}>{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  )
}

export default function AttackFeedScreen({ rows, total, doneCount, failCount, partialCount, passCount }) {
  const endRef = useRef(null)
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [rows.length, doneCount])

  const pct = total ? Math.round((doneCount / total) * 100) : 0
  const finishing = total != null && doneCount === total

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            {finishing ? 'Attack run complete' : 'Attack run in progress'}
          </h2>
          <p className="mt-1 font-mono text-sm text-gray-500">
            {finishing
              ? 'Compiling security report…'
              : 'Executing adversarial probes against the target agent…'}
          </p>
        </div>
        <div className="flex gap-5 font-mono">
          <Stat value={`${doneCount}/${total ?? '—'}`} label="run" />
          <Stat value={failCount} label="breaches" tone="red" />
          <Stat value={partialCount} label="partial" tone="amber" />
          <Stat value={passCount} label="blocked" tone="green" />
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-2 flex items-center justify-between font-mono text-xs text-gray-500">
        <span>attack {Math.min(doneCount + (finishing ? 0 : 1), total ?? 0)} of {total ?? '—'}</span>
        <span>{pct}%</span>
      </div>
      <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-[#1f2937]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-amber-300 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      <Panel className="overflow-hidden">
        <div className="flex items-center gap-2 border-b border-[#1f2937] bg-[#0f1521] px-4 py-2 font-mono text-xs text-gray-500">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-500/50" />
          <span className="ml-2">redteamiq — live attack console</span>
        </div>
        <div className="max-h-[480px] overflow-y-auto p-2">
          {rows.length === 0 && (
            <div className="px-3 py-10 text-center font-mono text-sm text-gray-600">
              <span className="blink">▌</span> Initializing recon agent…
            </div>
          )}
          {rows.map((r) => (
            <div
              key={r.attack.id || r.index}
              className={`slide-in mb-1.5 rounded-lg border px-3.5 py-3 transition ${cardTone(r.status)}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 rounded bg-[#0a0e14] px-1.5 py-0.5 font-mono text-[10px] text-gray-500">
                      TIER {r.attack.tier} · {TIERS[r.attack.tier]}
                    </span>
                  </div>
                  <div className="mt-1 truncate text-sm font-semibold text-gray-100">
                    {r.attack.name}
                  </div>
                  {/* "What was tested" — shown on every card */}
                  {r.attack.tests && (
                    <div className="mt-0.5 text-xs text-gray-500">
                      <span className="text-gray-600">Tested: </span>
                      {r.attack.tests}
                    </div>
                  )}
                </div>
                <div className="shrink-0 pt-0.5">
                  <ResultBadge status={r.status} />
                </div>
              </div>

              {/* Result detail for partial/fail */}
              {(r.status === 'fail' || r.status === 'partial') && r.finding && (
                <div
                  className={`mt-2.5 border-l-2 pl-3 ${
                    r.status === 'fail' ? 'border-red-500/40' : 'border-amber-500/40'
                  }`}
                >
                  <p className="text-xs text-gray-400">{r.finding.result}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <SeverityBadge severity={r.finding.severity} />
                    <span className="font-mono text-[11px] text-gray-500">{r.finding.owasp_ref}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={endRef} />
        </div>
      </Panel>
    </div>
  )
}
