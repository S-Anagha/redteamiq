import { useEffect, useState } from 'react'
import { ratingFor } from '../data/scoring.js'

// Animated circular gauge for the 0–100 security score.
export default function ScoreGauge({ score }) {
  const band = ratingFor(score)
  const [shown, setShown] = useState(0)

  useEffect(() => {
    let raf
    const start = performance.now()
    const dur = 900
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur)
      const eased = 1 - Math.pow(1 - t, 3)
      setShown(Math.round(eased * score))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [score])

  const r = 70
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - shown / 100)

  return (
    <div className="relative flex flex-col items-center">
      <svg width="180" height="180" viewBox="0 0 180 180" className="-rotate-90">
        <circle cx="90" cy="90" r={r} fill="none" stroke="#1f2937" strokeWidth="12" />
        <circle
          cx="90"
          cy="90"
          r={r}
          fill="none"
          stroke={band.color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.1s linear', filter: `drop-shadow(0 0 8px ${band.color}66)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-5xl font-bold text-white">{shown}</span>
        <span className="text-xs text-gray-500">/ 100</span>
      </div>
      <span
        className="mt-3 rounded-full px-4 py-1 text-sm font-semibold tracking-wide"
        style={{ color: band.color, background: `${band.color}1a`, border: `1px solid ${band.color}55` }}
      >
        {band.rating}
      </span>
    </div>
  )
}
