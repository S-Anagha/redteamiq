import { useEffect, useRef, useState } from 'react'

// Per-turn moments. 'summary' is appended after the last turn of a round.
const MOMENTS = ['sending', 'processing', 'response', 'event']
const DUR = { sending: 1800, processing: 1000, response: 2200, summary: 2000 }
const EVENT_DUR = { breached: 3000, defended: 2000, partial: 1600, default: 500 }

const DEFENDER = {
  holding: { label: 'HOLDING FIRM', cls: 'text-green-300 border-green-500/50 bg-green-500/15' },
  weakening: { label: 'WEAKENING', cls: 'text-amber-300 border-amber-500/50 bg-amber-500/15' },
  partial: { label: 'WEAKENING', cls: 'text-amber-300 border-amber-500/50 bg-amber-500/15' },
  defended: { label: 'HOLDING FIRM', cls: 'text-green-300 border-green-500/50 bg-green-500/15' },
  breached: { label: 'BREACHED', cls: 'text-red-300 border-red-500/50 bg-red-500/15' },
}

function tensionColor(v) {
  if (v >= 85) return '#ef4444'
  if (v >= 60) return '#f59e0b'
  if (v >= 35) return '#eab308'
  return '#22c55e'
}

function Typewriter({ text, ms = 1600, className = '' }) {
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

function highlight(text, danger) {
  if (!text) return null
  const parts = text.split(
    /(\bbackup@[\w.-]+|\b\d{3,}[\w ,]*records?\b|acme-[\w-]+|SUPPORT_ADMIN_KEY[^\s,}]*|\benterprise customer\b)/gi,
  )
  return parts.map((p, i) =>
    /backup@|records?|acme-|SUPPORT_ADMIN_KEY|enterprise customer/i.test(p) ? (
      <span
        key={i}
        className={`rounded px-1 ${danger ? 'bg-red-500/25 text-red-200' : 'bg-green-500/20 text-green-200'}`}
      >
        {p}
      </span>
    ) : (
      <span key={i}>{p}</span>
    ),
  )
}

export default function Battleground({ plan, onComplete }) {
  const { campaign, rounds } = plan
  const [ri, setRi] = useState(0)
  const [ti, setTi] = useState(0)
  const [moment, setMoment] = useState('sending')
  const [tension, setTension] = useState(0)
  const [breaches, setBreaches] = useState(0)
  const [defended, setDefended] = useState(0)
  const counted = useRef(new Set())

  const round = rounds[Math.min(ri, rounds.length - 1)]
  const turn = round.turns[Math.min(ti, round.turns.length - 1)]
  const isLastTurn = ti >= round.turns.length - 1
  const showResp = moment === 'response' || moment === 'event' || moment === 'summary'

  // Sequencer.
  useEffect(() => {
    const key = `${ri}-${ti}`
    if (moment === 'response') setTension(turn.tension ?? 30)
    if (moment === 'event' && !counted.current.has(key)) {
      counted.current.add(key)
      if (turn.outcome === 'breached') setBreaches((b) => b + 1)
      else if (turn.outcome === 'holding' || turn.outcome === 'defended') setDefended((d) => d + 1)
    }

    let dur
    if (moment === 'event') dur = EVENT_DUR[turn.outcome] || EVENT_DUR.default
    else if (moment === 'summary') dur = DUR.summary
    else dur = DUR[moment]

    const timer = setTimeout(() => {
      if (moment === 'summary') {
        if (ri + 1 >= rounds.length) onComplete?.()
        else {
          setRi(ri + 1)
          setTi(0)
          setMoment('sending')
        }
        return
      }
      const idx = MOMENTS.indexOf(moment)
      if (idx < MOMENTS.length - 1) {
        setMoment(MOMENTS[idx + 1])
      } else if (!isLastTurn) {
        setTi(ti + 1)
        setMoment('sending')
      } else {
        setMoment('summary')
      }
    }, dur)
    return () => clearTimeout(timer)
  }, [ri, ti, moment]) // eslint-disable-line react-hooks/exhaustive-deps

  const adapting = moment === 'event' && (turn.outcome === 'defended' || turn.outcome === 'partial')
  const pct = Math.round(((ri + (moment === 'summary' ? 1 : 0)) / rounds.length) * 100)
  const def = DEFENDER[turn.outcome] || DEFENDER.holding

  return (
    <div className="scanlines mx-auto max-w-6xl px-6 py-5">
      {/* TOP BAR */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-bold text-white">{campaign.icon} {campaign.name}</div>
          <div className="font-mono text-xs uppercase tracking-wider text-red-300">
            Phase: {turn.phaseLabel}
          </div>
        </div>
        <div className="min-w-[200px] flex-1 px-4">
          <div className="text-center font-mono text-xs text-gray-400">
            ROUND {ri + 1} OF {rounds.length} · {round.title}
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#1f2937]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-red-500 to-cyan-400 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <div className="flex gap-4 font-mono text-sm">
          <span className="font-bold text-red-400">{breaches} BREACHED</span>
          <span className="font-bold text-green-400">{defended} DEFENDED</span>
        </div>
      </div>

      {/* SPLIT BATTLEFIELD with center tension meter */}
      <div className="relative grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_1fr]">
        {/* Attacker */}
        <div className="rounded-xl border border-red-500/30 bg-[#140a0e]/80 p-5">
          <div className="font-mono text-xs font-semibold tracking-wider text-red-400">
            ▶ REDTEAMIQ // ATTACKER
          </div>
          <div className="mt-3 rounded-lg border-l-2 border-red-500/50 bg-red-500/[0.06] p-3">
            <div className="font-mono text-[10px] uppercase tracking-wider text-red-400">
              {adapting ? 'Adapting strategy…' : 'Strategy this turn'}
            </div>
            <p className="mt-1 text-sm leading-relaxed text-gray-200">{turn.strategy}</p>
          </div>
          <div className="mt-3 rounded-lg border border-red-500/20 bg-[#0a0e14] p-3 font-mono text-[12px] text-red-200/90">
            <span className="text-red-500">send$</span>{' '}
            {moment === 'sending' ? (
              <Typewriter key={`s-${ri}-${ti}`} text={turn.message} ms={1500} />
            ) : (
              turn.message
            )}
          </div>
        </div>

        {/* Tension meter */}
        <div className="hidden w-10 flex-col items-center justify-center md:flex">
          <div className="relative h-full min-h-[180px] w-2.5 overflow-hidden rounded-full bg-[#1f2937]">
            <div
              className="absolute bottom-0 left-0 w-full rounded-full transition-all duration-700"
              style={{ height: `${tension}%`, background: tensionColor(tension) }}
            />
          </div>
          <div className="mt-2 font-mono text-[9px] uppercase text-gray-500">tension</div>
        </div>

        {/* Defender */}
        <div className="rounded-xl border border-cyan-500/30 bg-[#0a1018]/80 p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-semibold tracking-wider text-cyan-400">
              🛡 TARGET AGENT // DEFENDER
            </span>
            {showResp && (
              <span className={`rounded border px-2 py-0.5 font-mono text-[11px] font-bold ${def.cls}`}>
                {def.label}
              </span>
            )}
          </div>

          {moment === 'processing' && (
            <div className="flex items-center justify-center gap-2 py-10 font-mono text-sm text-cyan-300">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500/30 border-t-cyan-400" />
              Analyzing request…
            </div>
          )}
          {moment === 'sending' && (
            <div className="py-10 text-center font-mono text-sm text-gray-600">awaiting inbound…</div>
          )}
          {showResp && (
            <div className="slide-in mt-3 rounded-lg border border-cyan-500/20 bg-[#0a0e14] p-3 font-mono text-[12px] leading-relaxed">
              <span className="text-cyan-500">target&gt;</span>{' '}
              {moment === 'response' ? (
                <Typewriter
                  key={`r-${ri}-${ti}`}
                  text={turn.response}
                  ms={1900}
                  className={turn.outcome === 'breached' || turn.outcome === 'partial' ? 'text-gray-200' : 'text-green-200/90'}
                />
              ) : (
                <span className={turn.outcome === 'breached' || turn.outcome === 'partial' ? 'text-gray-200' : 'text-green-200/90'}>
                  {highlight(turn.response, turn.outcome === 'breached' || turn.outcome === 'partial')}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ROUND CONTEXT PANEL */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Ctx label="Tool targeted">{round.toolContext}</Ctx>
        <Ctx label="What phase this is">{turn.phaseContext}</Ctx>
        <Ctx label="What just happened" tone={turn.outcome}>
          {showResp ? turn.whatHappened : 'Sending the attack and waiting for the agent to respond…'}
        </Ctx>
      </div>

      {/* DEFENDED / ADAPTING strip */}
      {adapting && (
        <div className="slide-in mt-3 rounded-lg border border-green-500/30 bg-green-500/[0.06] px-4 py-2 text-sm text-green-200">
          {turn.outcome === 'defended' ? '🛡 DEFENDED — ' : '◐ PARTIAL — '}
          {turn.whatHappened} <span className="font-semibold text-amber-300">→ Adapting strategy, trying a new angle…</span>
        </div>
      )}

      {/* ROUND SUMMARY card */}
      {moment === 'summary' && (
        <RoundSummary round={round} nextRound={rounds[ri + 1]} />
      )}

      {/* BREACH popup */}
      {moment === 'event' && turn.outcome === 'breached' && <BreachPopup round={round} turn={turn} />}
    </div>
  )
}

function Ctx({ label, children, tone }) {
  const border =
    tone === 'breached' ? 'border-red-500/30' : tone === 'partial' ? 'border-amber-500/30' : 'border-[#1f2937]'
  return (
    <div className={`rounded-lg border bg-[#0a0e14] p-3 ${border}`}>
      <div className="font-mono text-[10px] uppercase tracking-wider text-gray-500">{label}</div>
      <div className="mt-1 text-xs leading-relaxed text-gray-300">{children}</div>
    </div>
  )
}

function RoundSummary({ round, nextRound }) {
  const best = round.turns.reduce((acc, t) => {
    const rank = { breached: 3, partial: 2, weakening: 1, defended: 0, holding: 0 }
    return rank[t.outcome] > rank[acc] ? t.outcome : acc
  }, 'holding')
  const result =
    best === 'breached' ? { t: 'BREACHED', c: 'text-red-400' } : best === 'partial' ? { t: 'PARTIAL', c: 'text-amber-400' } : { t: 'DEFENDED', c: 'text-green-400' }
  const last = round.turns[round.turns.length - 1]
  return (
    <div className="slide-in mt-4 rounded-xl border border-[#1f2937] bg-[#111722] p-4">
      <div className="flex items-center justify-between">
        <div className="font-mono text-sm text-gray-300">
          Round {round.index + 1} · {round.title}
        </div>
        <div className={`font-mono text-sm font-bold ${result.c}`}>{result.t}</div>
      </div>
      <p className="mt-2 text-sm text-gray-400">{last.whatHappened}</p>
      {nextRound && (
        <p className="mt-2 font-mono text-xs text-cyan-300">
          Next → Round {nextRound.index + 1}: {nextRound.title}
        </p>
      )}
    </div>
  )
}

function BreachPopup({ round, turn }) {
  const sev = turn.severity || 'HIGH'
  const sevColor = sev === 'CRITICAL' ? '#ef4444' : sev === 'HIGH' ? '#f59e0b' : '#eab308'
  return (
    <div className="breach-flash fixed inset-0 z-30 flex items-center justify-center">
      <div className="slide-in mx-6 max-w-lg rounded-2xl border-2 border-red-500/70 bg-[#1a0a0e]/95 p-7 text-center shadow-[0_0_60px_-10px_rgba(239,68,68,0.8)]">
        <div className="font-mono text-5xl font-black tracking-widest text-red-500" style={{ textShadow: '0 0 30px #ef4444' }}>
          BREACHED
        </div>
        <div className="mt-3 text-sm text-gray-300">{round.title} — {turn.phaseLabel}</div>
        <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-left">
          <div className="font-mono text-[10px] uppercase tracking-wider text-red-400">Evidence</div>
          <p className="mt-1 text-sm text-red-100">{turn.evidence || turn.whatHappened}</p>
        </div>
        <div className="mt-3 flex items-center justify-center gap-2">
          <span
            className="rounded border px-3 py-1 font-mono text-xs font-bold"
            style={{ color: sevColor, borderColor: `${sevColor}88`, background: `${sevColor}1a` }}
          >
            {sev}
          </span>
          {turn.owasp_ref && (
            <span className="rounded border border-gray-600 px-3 py-1 font-mono text-xs text-gray-300">
              OWASP {turn.owasp_ref}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
