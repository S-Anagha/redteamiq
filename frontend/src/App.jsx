import { useState, useCallback } from 'react'
import { Logo } from './components/ui.jsx'
import InputScreen from './components/InputScreen.jsx'
import AttackFeedScreen from './components/AttackFeedScreen.jsx'
import ReportScreen from './components/ReportScreen.jsx'
import { runAnalysis } from './api/client.js'

const STEPS = ['Configure', 'Battle', 'Report']

export default function App() {
  const [screen, setScreen] = useState('input') // input | feed | report
  const [mode, setMode] = useState('mock')
  const [endpoint, setEndpoint] = useState('')

  const [input, setInput] = useState(null)
  const [rounds, setRounds] = useState(null) // null = still loading (live API in flight)
  const [report, setReport] = useState(null)
  const [error, setError] = useState(null)

  const handleRun = useCallback(
    async (cfg) => {
      setInput(cfg)
      setRounds(null)
      setReport(null)
      setError(null)
      setScreen('feed')
      try {
        const { rounds: r, report: rep } = await runAnalysis(cfg, { mode, endpoint })
        setReport(rep)
        setRounds(r)
      } catch (e) {
        setError(e.message || 'Run failed')
      }
    },
    [mode, endpoint],
  )

  const reset = () => {
    setScreen('input')
    setRounds(null)
    setReport(null)
    setError(null)
  }

  const stepIndex = screen === 'input' ? 0 : screen === 'feed' ? 1 : 2

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
          <strong>Run failed:</strong> {error}{' '}
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
      {screen === 'feed' && (
        <AttackFeedScreen
          rounds={rounds}
          report={report}
          mode={mode}
          onComplete={() => setScreen('report')}
        />
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
