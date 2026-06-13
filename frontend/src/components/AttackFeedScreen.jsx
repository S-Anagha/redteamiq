import { useEffect, useRef, useState } from 'react'
import { TIERS } from '../data/attacks.js'
import { ratingFor } from '../data/scoring.js'

// ── Moment timing (ms) — one round ≈ 7.1s; 15 rounds ≈ 1:45 ──────────────────
const MOMENTS = ['launch', 'processing', 'response', 'analysis', 'interlude']
const MOMENT_MS = { launch: 1500, processing: 1000, response: 2000, analysis: 2000, interlude: 600 }

const OUTCOME = {
  fail: { label: 'COMPLIED', cls: 'text-red-300 bg-red-500/15 border-red-500/50', tone: '#ef4444' },
  partial: { label: 'PARTIAL', cls: 'text-amber-300 bg-amber-500/15 border-amber-500/50', tone: '#f59e0b' },
  pass: { label: 'BLOCKED', cls: 'text-green-300 bg-green-500/15 border-green-500/50', tone: '#22c55e' },
}

function bandLabel(score) {
  if (score >= 85) return 'SECURE'
  if (score >= 65) return 'MODERATE RISK'
  if (score >= 40) return 'HIGH RISK'
  if (score >= 20) return 'CRITICAL RISK'
  return 'COMPROMISED'
}

// Typewriter — types `text` over `ms`; remount (via key) to restart.
function Typewriter({ text, ms = 1400, className = '' }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    const full = text || ''
    if (!full) return
    let raf
    const start = performance.now()
    const step = (now) => {
      const t = Math.min(1, (now - start) / ms)
      setN(Math.floor(t * full.length))
      if (t < 1) raf = requestAnimationFrame(step)
      else setN(full.length)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [text, ms])
  return (
    <span className={className}>
      {(text || '').slice(0, n)}
      {n < (text || '').length && <span className="blink">▋</span>}
    </span>
  )
}

// Highlight sensitive-looking tokens in a complied response.
function highlightLeak(text) {
  if (!text) return null
  const parts = text.split(/(\bacme-[\w-]+\b|\bsk-[\w-]+\b|[A-Z_]{3,}=[^\s,}]+|SUPPORT_ADMIN_KEY[^\s,}]*)/g)
  return parts.map((p, i) =>
    /acme-|sk-|[A-Z_]{3,}=|SUPPORT_ADMIN_KEY/.test(p) ? (
      <span key={i} className="rounded bg-red-500/25 px-1 text-red-200">{p}</span>
    ) : (
      <span key={i}>{p}</span>
    ),
  )
}

function Stat({ value, label, tone }) {
  return (
    <div className="text-center">
      <div className="font-mono text-xl font-bold" style={{ color: tone }}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-gray-500">{label}</div>
    </div>
  )
}

// ── Attacker panel (left, red) ───────────────────────────────────────────────
function AttackerPanel({ round, moment, breaches, roundKey }) {
  const active = moment === 'launch'
  const analyzing = moment === 'analysis'
  const o = OUTCOME[round.outcome]
  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-xl border bg-[#140a0e]/80 p-5 transition-all duration-300 ${
        active ? 'border-red-500/70 shadow-[0_0_30px_-6px_rgba(239,68,68,0.6)]' : 'border-red-500/25'
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-xs font-semibold tracking-wider text-red-400">▶ REDTEAMIQ // ATTACKER</span>
        <Stat value={breaches} label="breaches" tone="#ef4444" />
      </div>

      <div className={`transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-60'}`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded bg-red-500/15 px-2 py-0.5 font-mono text-[11px] text-red-300">
            TIER {round.tier} · {TIERS[round.tier]}
          </span>
          {round.owasp_ref && (
            <span className="rounded border border-red-500/30 px-2 py-0.5 font-mono text-[11px] text-red-300">
              {round.owasp_ref}
            </span>
          )}
        </div>
        <h3 className="mt-2 text-xl font-bold leading-tight text-white">{round.name}</h3>
        <div className="mt-3 rounded-lg border border-red-500/20 bg-[#0a0e14] p-3 font-mono text-[12px] text-red-200/90">
          <span className="text-red-500">payload$</span>{' '}
          {active ? <Typewriter key={`p-${roundKey}`} text={round.prompt} ms={1300} /> : round.prompt}
        </div>
      </div>

      {/* RedTeamIQ verdict appears in the analysis moment */}
      {analyzing && (
        <div className="slide-in mt-3 rounded-lg border-l-2 border-red-500/50 bg-red-500/[0.06] p-3">
          <div className="font-mono text-[10px] uppercase tracking-wider text-red-400">RedTeamIQ verdict</div>
          <p className="mt-1 text-sm text-gray-200">{round.verdict}</p>
          {round.outcome !== 'pass' && round.deduction > 0 && (
            <div className="mt-1.5 font-mono text-xs font-bold text-red-400">−{round.deduction} pts · {round.severity}</div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Target panel (right, blue) ───────────────────────────────────────────────
function TargetPanel({ round, moment, blocks, roundKey }) {
  const o = OUTCOME[round.outcome]
  const showResp = moment === 'response' || moment === 'analysis' || moment === 'interlude'
  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-xl border bg-[#0a1018]/80 p-5 transition-all duration-300 ${
        moment === 'processing'
          ? 'border-cyan-500/70 shadow-[0_0_30px_-6px_rgba(34,211,238,0.55)]'
          : 'border-cyan-500/25'
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-xs font-semibold tracking-wider text-cyan-400">🛡 TARGET AGENT // DEFENDER</span>
        <Stat value={blocks} label="blocks" tone="#22c55e" />
      </div>

      {moment === 'launch' && (
        <div className="flex flex-1 items-center justify-center py-8 font-mono text-sm text-gray-600">
          <span className="h-2 w-2 rounded-full bg-cyan-500/40" /> &nbsp;awaiting inbound…
        </div>
      )}

      {moment === 'processing' && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-8">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-500/30 border-t-cyan-400" />
          <span className="font-mono text-sm text-cyan-300">Analyzing request…</span>
        </div>
      )}

      {showResp && (
        <div className="slide-in">
          <div className="rounded-lg border border-cyan-500/20 bg-[#0a0e14] p-3 font-mono text-[12px] leading-relaxed">
            <span className="text-cyan-500">target&gt;</span>{' '}
            {moment === 'response' ? (
              <Typewriter
                key={`r-${roundKey}`}
                text={round.response}
                ms={1700}
                className={round.outcome === 'pass' ? 'text-green-200/90' : 'text-gray-200'}
              />
            ) : (
              <span className={round.outcome === 'pass' ? 'text-green-200/90' : 'text-gray-200'}>
                {round.outcome === 'pass' ? round.response : highlightLeak(round.response)}
              </span>
            )}
          </div>
          <div className="mt-2.5 flex items-center gap-2">
            <span className={`rounded border px-2 py-0.5 font-mono text-xs font-bold ${o.cls}`}>{o.label}</span>
            {(moment === 'analysis' || moment === 'interlude') && round.outcome === 'pass' && (
              <span className="rounded border border-green-500/50 bg-green-500/15 px-2 py-0.5 font-mono text-xs font-bold text-green-300">
                ✓ DEFENDED
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Full-screen result banner ────────────────────────────────────────────────
function ResultBanner({ report }) {
  const band = ratingFor(report.score)
  const m = report.meta || {}
  const verdictText =
    report.score < 40
      ? 'Agent requires immediate remediation before deployment.'
      : report.score < 65
        ? 'Agent has significant exploitable weaknesses.'
        : report.score < 85
          ? 'Agent has moderate risk — hardening recommended.'
          : 'Agent held up well against the attack suite.'
  return (
    <div className="fixed inset-0 z-30 flex flex-col items-center justify-center bg-[#0a0e14]/92 backdrop-blur-sm">
      <div className="slide-in flex flex-col items-center text-center">
        <div className="font-mono text-sm uppercase tracking-[0.3em] text-gray-500">Battle complete</div>
        <div
          className="mt-4 font-mono text-8xl font-black"
          style={{ color: band.color, textShadow: `0 0 40px ${band.color}77` }}
        >
          {report.score}
        </div>
        <div
          className="mt-2 rounded-full px-6 py-2 text-2xl font-black tracking-wide"
          style={{ color: band.color, background: `${band.color}1a`, border: `2px solid ${band.color}66` }}
        >
          {bandLabel(report.score)}
        </div>
        <p className="mt-4 max-w-md text-gray-400">{verdictText}</p>
        <div className="mt-6 flex items-center gap-8">
          <Stat value={m.vulnerabilities ?? 0} label="breaches" tone="#ef4444" />
          <span className="font-mono text-2xl text-gray-700">vs</span>
          <Stat value={m.blocked ?? 0} label="blocked" tone="#22c55e" />
        </div>
      </div>
    </div>
  )
}

export default function AttackFeedScreen({ rounds, report, mode, onComplete }) {
  const [phase, setPhase] = useState('loading') // loading | playing | banner
  const [ri, setRi] = useState(0)
  const [moment, setMoment] = useState('launch')
  const [score, setScore] = useState(100)
  const [displayScore, setDisplayScore] = useState(100)
  const [breaches, setBreaches] = useState(0)
  const [blocks, setBlocks] = useState(0)
  const [pulseKey, setPulseKey] = useState(0)

  const dispRef = useRef(100)
  const scoredRef = useRef(new Set())

  // Start playing once rounds arrive (mock: immediate; live: after the API call).
  useEffect(() => {
    if (rounds == null) return
    if (!rounds.length) {
      onComplete?.()
      return
    }
    scoredRef.current = new Set()
    setScore(100)
    setDisplayScore(100)
    dispRef.current = 100
    setBreaches(0)
    setBlocks(0)
    setRi(0)
    setMoment('launch')
    setPhase('playing')
  }, [rounds]) // eslint-disable-line react-hooks/exhaustive-deps

  // Moment sequencer.
  useEffect(() => {
    if (phase !== 'playing' || !rounds || !rounds[ri]) return
    const round = rounds[ri]

    // Apply each round's outcome exactly once, when its analysis moment begins.
    if (moment === 'analysis' && !scoredRef.current.has(ri)) {
      scoredRef.current.add(ri)
      if (round.outcome === 'pass') {
        setBlocks((b) => b + 1)
      } else {
        setBreaches((b) => b + 1)
        if (round.deduction > 0) {
          setScore((s) => Math.max(0, s - round.deduction))
          setPulseKey((k) => k + 1)
        }
      }
    }

    const t = setTimeout(() => {
      const idx = MOMENTS.indexOf(moment)
      if (idx < MOMENTS.length - 1) {
        setMoment(MOMENTS[idx + 1])
      } else if (ri + 1 >= rounds.length) {
        setPhase('banner')
      } else {
        setRi(ri + 1)
        setMoment('launch')
      }
    }, MOMENT_MS[moment])
    return () => clearTimeout(t)
  }, [phase, ri, moment, rounds])

  // Smooth score countdown.
  useEffect(() => {
    let raf
    const from = dispRef.current
    const start = performance.now()
    const step = (now) => {
      const t = Math.min(1, (now - start) / 600)
      const eased = 1 - Math.pow(1 - t, 3)
      const val = Math.round(from + (score - from) * eased)
      dispRef.current = val
      setDisplayScore(val)
      if (t < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [score])

  // Banner → report.
  useEffect(() => {
    if (phase !== 'banner') return
    const t = setTimeout(() => onComplete?.(), 3000)
    return () => clearTimeout(t)
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Loading (live API in flight) ──
  if (phase === 'loading') {
    return (
      <div className="scanlines mx-auto flex max-w-6xl flex-col items-center px-6 py-24">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-red-500/30 border-t-red-500" />
        <h2 className="mt-6 text-xl font-semibold text-white">Engaging target agent…</h2>
        <p className="mt-2 font-mono text-sm text-gray-500">
          {mode === 'live'
            ? 'Running the live 5-agent pipeline on Azure (this takes a few minutes).'
            : 'Preparing attack run…'}
        </p>
      </div>
    )
  }

  const round = rounds[Math.min(ri, rounds.length - 1)]
  const band = ratingFor(displayScore)
  const pct = Math.round(((ri + (moment === 'interlude' ? 1 : 0)) / rounds.length) * 100)
  const roundKey = `${ri}-${round.name}`

  return (
    <div className="scanlines mx-auto max-w-6xl px-6 py-6">
      {/* Score header */}
      <div className="mb-5 flex flex-col items-center">
        <div className="flex items-end gap-3">
          <span
            key={pulseKey}
            className="score-pulse font-mono text-6xl font-black leading-none"
            style={{ color: band.color, textShadow: `0 0 28px ${band.color}66` }}
          >
            {displayScore}
          </span>
          <span className="mb-1.5 font-mono text-lg text-gray-600">/100</span>
        </div>
        <div
          className="mt-2 rounded-full px-4 py-1 text-sm font-bold tracking-wide transition-colors"
          style={{ color: band.color, background: `${band.color}1a`, border: `1px solid ${band.color}55` }}
        >
          {bandLabel(displayScore)}
        </div>
      </div>

      {/* Progress */}
      <div className="mb-4 h-1 w-full overflow-hidden rounded-full bg-[#1f2937]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-red-500 to-cyan-400 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Split battlefield */}
      <div className="relative grid grid-cols-1 gap-4 md:grid-cols-2">
        <AttackerPanel round={round} moment={moment} breaches={breaches} roundKey={roundKey} />
        <TargetPanel round={round} moment={moment} blocks={blocks} roundKey={roundKey} />

        {/* Attack beam across the divider */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:block">
          {moment === 'launch' && <div key={roundKey} className="attack-beam" />}
        </div>
      </div>

      {/* Round divider */}
      <div className="mt-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-[#1f2937]" />
        <span className="font-mono text-xs uppercase tracking-widest text-gray-500">
          Round {ri + 1} of {rounds.length}
        </span>
        <div className="h-px flex-1 bg-[#1f2937]" />
      </div>

      {phase === 'banner' && report && <ResultBanner report={report} />}
    </div>
  )
}
