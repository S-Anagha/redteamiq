import { useState } from 'react'
import { CAMPAIGNS, TOOL_INFO } from '../data/campaigns.js'

export default function CampaignSelect({ tools = [], onStart }) {
  const [selected, setSelected] = useState(1)
  const campaign = CAMPAIGNS.find((c) => c.id === selected)
  const roundCount = (tools.length || 2) + 2
  const toolLabels = (tools.length ? tools : ['email', 'database']).map(
    (t) => TOOL_INFO[t]?.label || t,
  )

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-7 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-white">Choose your attack</h1>
        <p className="mt-2 text-gray-400">
          Pick a red-team campaign. Each runs a different multi-round strategy against the target —
          across every tool you selected.
        </p>
      </div>

      {/* 5 campaign cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {CAMPAIGNS.map((c) => {
          const active = c.id === selected
          return (
            <button
              key={c.id}
              onClick={() => setSelected(c.id)}
              className={`flex flex-col rounded-xl border p-4 text-left transition ${
                active
                  ? 'border-red-500/70 bg-red-500/10 shadow-[0_0_24px_-8px_rgba(239,68,68,0.7)]'
                  : 'border-[#1f2937] bg-[#111722] hover:border-[#374151]'
              }`}
            >
              <div className="text-2xl">{c.icon}</div>
              <div className="mt-2 font-mono text-[10px] uppercase tracking-wider text-gray-500">
                Campaign {c.id}
              </div>
              <div className="mt-0.5 text-sm font-bold text-white">{c.name}</div>
              <div className="mt-1 text-[11px] text-red-300">{c.tag}</div>
            </button>
          )
        })}
      </div>

      {/* Preview panel */}
      <div className="mt-6 rounded-xl border border-[#1f2937] bg-[#111722]/80 p-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{campaign.icon}</span>
          <div>
            <h2 className="text-xl font-bold text-white">{campaign.name}</h2>
            <span className="font-mono text-xs text-red-300">{campaign.tag}</span>
          </div>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-gray-300">{campaign.plainEnglish}</p>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Info label="How many rounds">
            <span className="font-mono text-lg text-white">{roundCount} rounds</span>
            <div className="text-xs text-gray-500">{campaign.roundsDesc}</div>
          </Info>
          <Info label="Tools it will target">
            <div className="flex flex-wrap gap-1.5">
              {toolLabels.map((t) => (
                <span key={t} className="rounded bg-[#0f1521] px-2 py-0.5 font-mono text-[11px] text-cyan-300">
                  {t}
                </span>
              ))}
            </div>
          </Info>
          <Info label="What a breach looks like">
            <div className="text-xs text-gray-300">{campaign.breachLooksLike}</div>
          </Info>
        </div>

        <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/[0.05] px-3 py-2 text-xs text-amber-200/90">
          <span className="font-semibold">📰 Real incident:</span> {campaign.realIncident}
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        <button
          onClick={() => onStart(campaign.id)}
          className="rounded-lg bg-red-500 px-8 py-3 text-base font-bold text-white shadow-lg shadow-red-500/25 transition hover:bg-red-400"
        >
          ⚔ START CAMPAIGN →
        </button>
      </div>
    </div>
  )
}

function Info({ label, children }) {
  return (
    <div className="rounded-lg border border-[#1f2937] bg-[#0a0e14] p-3">
      <div className="font-mono text-[10px] uppercase tracking-wider text-gray-500">{label}</div>
      <div className="mt-1.5">{children}</div>
    </div>
  )
}
