import { useState, useCallback } from 'react'
import { Logo } from './components/ui.jsx'
import InputScreen from './components/InputScreen.jsx'
import CampaignSelect from './components/CampaignSelect.jsx'
import Battleground from './components/Battleground.jsx'
import ReportScreen from './components/ReportScreen.jsx'
import { buildCampaign, campaignReport, buildLivePlan, campaignById } from './data/campaigns.js'
import { runAnalysisLive } from './api/client.js'

const STEPS = ['Configure', 'Choose Attack', 'Battle', 'Report']

export default function App() {
  const [screen, setScreen] = useState('input') // input | campaign | battle | report
  const [mode, setMode] = useState('mock')
  const [endpoint, setEndpoint] = useState('')

  const [input, setInput] = useState(null)
  const [plan, setPlan] = useState(null) // { campaign, rounds } — null while a live scan is in flight
  const [report, setReport] = useState(null)
  const [error, setError] = useState(null)

  // Screen 1 → Screen 1.5
  const handleRun = useCallback((cfg) => {
    setInput(cfg)
    setError(null)
    setScreen('campaign')
  }, [])

  // Screen 1.5 → Screen 2.  MOCK = scripted plan.  LIVE = real backend /scan, mapped to the battle.
  const handleStartCampaign = useCallback(
    async (campaignId) => {
      const campaign = campaignById(campaignId)
      setError(null)

      if (mode === 'live') {
        setPlan(null) // triggers the Battleground loader while the live scan runs
        setReport(null)
        setScreen('battle')
        try {
          const { report: rep } = await runAnalysisLive(
            { system_prompt: input.system_prompt, tools: input.tools, endpoint: input.endpoint },
            { endpoint },
          )
          setReport(rep)
          setPlan(buildLivePlan(campaign, rep))
        } catch (e) {
          setError(e.message || 'Live scan failed')
        }
        return
      }

      // Mock (unchanged)
      const built = buildCampaign(campaignId, input?.tools || [], input?.system_prompt || '')
      setPlan(built)
      setReport(campaignReport(built.campaign, built.rounds))
      setScreen('battle')
    },
    [mode, endpoint, input],
  )

  const reset = () => {
    setScreen('input')
    setPlan(null)
    setReport(null)
    setError(null)
  }

  const stepIndex =
    screen === 'input' ? 0 : screen === 'campaign' ? 1 : screen === 'battle' ? 2 : 3

  return (
    <div className="relative z-10 min-h-full">
      <header className="sticky top-0 z-20 border-b border-[#1f2937] bg-[#0a0e14]/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <Logo />
          <nav className="hidden items-center gap-1.5 font-mono text-xs sm:flex">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-1.5">
                <span
                  className={`rounded px-2 py-1 transition ${
                    i === stepIndex
                      ? 'bg-red-500/15 text-red-300'
                      : i < stepIndex
                        ? 'text-gray-400'
                        : 'text-gray-600'
                  }`}
                >
                  {i + 1}. {s}
                </span>
                {i < STEPS.length - 1 && <span className="text-gray-700">›</span>}
              </div>
            ))}
          </nav>
        </div>
      </header>

      {error && (
        <div className="mx-auto mt-4 max-w-3xl rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <strong>Live scan failed:</strong> {error}{' '}
          <button onClick={reset} className="ml-2 underline">
            back to start
          </button>
        </div>
      )}

      {screen === 'input' && (
        <InputScreen
          onRun={handleRun}
          mode={mode}
          setMode={setMode}
          endpoint={endpoint}
          setEndpoint={setEndpoint}
        />
      )}
      {screen === 'campaign' && (
        <CampaignSelect tools={input?.tools || []} onStart={handleStartCampaign} />
      )}
      {screen === 'battle' && !error && (
        <Battleground plan={plan} mode={mode} onComplete={() => setScreen('report')} />
      )}
      {screen === 'report' && report && (
        <ReportScreen report={report} input={input} onReset={reset} />
      )}

      <footer className="mx-auto max-w-6xl px-6 py-8 text-center font-mono text-xs text-gray-600">
        RedTeamIQ · Microsoft Agents League 2026 · Reasoning Agents track
      </footer>
    </div>
  )
}
