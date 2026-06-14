import { useState } from 'react'
import { TOOLS, DEMO_TARGET, HARDENED_TARGET } from '../data/tools.js'
import { Panel, Tag } from './ui.jsx'

export default function InputScreen({ onRun, mode, setMode, endpoint, setEndpoint }) {
  const [systemPrompt, setSystemPrompt] = useState('')
  const [tools, setTools] = useState([])

  const toggleTool = (id) =>
    setTools((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]))

  // Load a demo target: fills the prompt + tools, points at its real local endpoint,
  // and switches to Live so RedTeamIQ attacks the real running service.
  const loadTarget = (target) => {
    setSystemPrompt(target.system_prompt)
    setTools(target.tools)
    if (target.endpoint) {
      setEndpoint(target.endpoint)
      setMode('live')
    }
  }

  const canRun = systemPrompt.trim().length > 0 && tools.length > 0

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Red-team your AI agent.
        </h1>
        <p className="mt-2 text-gray-400">
          Paste a target agent's system prompt and tools. RedTeamIQ runs 7 tiers of
          adversarial attacks, scores the result, and writes a security report.
        </p>
      </div>

      <Panel className="p-6">
        <div className="mb-2 flex items-center justify-between">
          <label className="font-mono text-sm font-medium text-gray-300">
            Target system prompt
          </label>
          <div className="flex gap-1.5">
            <button
              onClick={() => loadTarget(DEMO_TARGET)}
              className="rounded-md border border-red-500/40 bg-red-500/10 px-2.5 py-1 text-xs text-red-300 transition hover:border-red-500/70"
            >
              ⚡ Vulnerable demo (AcmeBot)
            </button>
            <button
              onClick={() => loadTarget(HARDENED_TARGET)}
              className="rounded-md border border-cyan-500/40 bg-cyan-500/10 px-2.5 py-1 text-xs text-cyan-300 transition hover:border-cyan-500/70"
            >
              🛡 Hardened demo (Nexus)
            </button>
          </div>
        </div>
        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          rows={8}
          placeholder="You are a helpful assistant that..."
          className="w-full resize-y rounded-lg border border-[#1f2937] bg-[#0a0e14] p-3.5 font-mono text-sm text-gray-200 outline-none transition placeholder:text-gray-600 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30"
        />

        <div className="mt-6">
          <label className="font-mono text-sm font-medium text-gray-300">
            Tools the agent can access
          </label>
          <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {TOOLS.map((t) => {
              const active = tools.includes(t.id)
              return (
                <button
                  key={t.id}
                  onClick={() => toggleTool(t.id)}
                  className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition ${
                    active
                      ? 'border-red-500/60 bg-red-500/10'
                      : 'border-[#1f2937] bg-[#0f1521] hover:border-[#374151]'
                  }`}
                >
                  <span className="text-lg">{t.icon}</span>
                  <span className="flex flex-col">
                    <span
                      className={`text-sm font-medium ${active ? 'text-white' : 'text-gray-300'}`}
                    >
                      {t.label}
                    </span>
                    <span className="text-[11px] text-gray-500">{t.hint}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Data-source toggle */}
        <div className="mt-6 rounded-lg border border-[#1f2937] bg-[#0a0e14] p-3.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-gray-400">Data source</span>
            <div className="flex rounded-md border border-[#1f2937] p-0.5">
              {['mock', 'live'].map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`rounded px-3 py-1 text-xs font-medium transition ${
                    mode === m ? 'bg-red-500/90 text-white' : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {m === 'mock' ? 'Mock (demo)' : 'Live API'}
                </button>
              ))}
            </div>
          </div>
          {mode === 'live' && (
            <div className="mt-3 rounded-md border border-cyan-500/30 bg-cyan-500/[0.04] p-3">
              <label className="font-mono text-xs font-medium text-cyan-300">
                Target agent endpoint <span className="text-gray-500">(optional)</span>
              </label>
              <input
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="Your agent endpoint URL — e.g. https://your-agent.azurewebsites.net/chat"
                className="mt-1.5 w-full rounded-md border border-[#1f2937] bg-[#0a0e14] px-3 py-2 font-mono text-xs text-gray-200 outline-none focus:border-cyan-500/60"
              />
              <p className="mt-2 text-[11px] leading-relaxed text-gray-400">
                Connect your real deployed agent for <span className="text-cyan-300">authentic results</span> —
                RedTeamIQ sends real attacks to it over HTTP. Without an endpoint, RedTeamIQ uses
                behavioral simulation. Demo endpoints: <span className="font-mono">localhost:5002/chat</span> (vulnerable),
                <span className="font-mono"> localhost:5003/chat</span> (hardened).
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="flex flex-wrap gap-1.5">
            <Tag>7 attack tiers</Tag>
            <Tag>OWASP LLM + Agentic</Tag>
            <Tag>Foundry IQ KB</Tag>
          </div>
          <button
            disabled={!canRun}
            onClick={() => onRun({ system_prompt: systemPrompt, tools, endpoint })}
            className="rounded-lg bg-red-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition enabled:hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Launch attack run →
          </button>
        </div>
      </Panel>
    </div>
  )
}
