import { SEVERITY_STYLE } from '../data/scoring.js'

export function Logo({ size = 28 }) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M12 2L4 5v6c0 5 3.4 9.2 8 11 4.6-1.8 8-6 8-11V5l-8-3z" fill="#ef4444" />
        <path
          d="M9 12l2 2 4-4"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="font-mono text-lg font-semibold tracking-tight">
        RedTeam<span className="text-red-500">IQ</span>
      </span>
    </div>
  )
}

export function SeverityBadge({ severity }) {
  const s = SEVERITY_STYLE[severity] ?? SEVERITY_STYLE.LOW
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-semibold tracking-wide"
      style={{ color: s.text, background: s.bg, border: `1px solid ${s.border}` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.dot }} />
      {severity}
    </span>
  )
}

export function Tag({ children }) {
  return (
    <span className="rounded border border-[#1f2937] bg-[#0f1521] px-2 py-0.5 font-mono text-[11px] text-gray-400">
      {children}
    </span>
  )
}

export function Panel({ children, className = '' }) {
  return (
    <div
      className={`rounded-xl border border-[#1f2937] bg-[#111722]/80 backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  )
}
