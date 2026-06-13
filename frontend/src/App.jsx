import { useState, useCallback } from 'react'
import { Logo } from './components/ui.jsx'
import InputScreen from './components/InputScreen.jsx'
import CampaignSelect from './components/CampaignSelect.jsx'
import Battleground from './components/Battleground.jsx'
import ReportScreen from './components/ReportScreen.jsx'
import { buildCampaign, campaignReport } from './data/campaigns.js'

const STEPS = ['Configure', 'Choose Attack', 'Battle', 'Report']

export default function App() {
  const [screen, setScreen] = useState('input') // input | campaign | battle | report
  const [mode, setMode] = useState('mock')
  const [endpoint, setEndpoint] = useState('')

  const [input, setInput] = useState(null)
  const [plan, setPlan] = useState(null) // { campaign, rounds }
  const [report, setReport] = useState(null)

  // Screen 1 → Screen 1.5
  const handleRun = useCallback((cfg) => {
    setInput(cfg)
    setScreen('campaign')
  }, [])

  // Screen 1.5 → Screen 2 (mock plan; live campaign streaming is Phase 2)
  const handleStartCampaign = useCallback(
    (campaignId) => {
      const built = buildCampaign(campaignId, input?.tools || [])
      setPlan(built)
      setReport(campaignReport(built.campaign, built.rounds))
      setScreen('battle')
    },
    [input],
  )

  const reset = () => {
    setScreen('input')
    setPlan(null)
    setReport(null)
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
      {screen === 'battle' && plan && (
        <Battleground plan={plan} onComplete={() => setScreen('report')} />
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
