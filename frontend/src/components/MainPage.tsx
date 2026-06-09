import { useState, type FormEvent } from 'react'
import { Send, LogOut, BarChart2, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { runPipeline } from '../api/pipeline'
import type { PipelineResponse } from '../api/types'
import ModeToggle from './ModeToggle'
import LoadingSpinner from './LoadingSpinner'
import ResultPanel from './ResultPanel'

export default function MainPage() {
  const { token, logout } = useAuth()
  const [userInput, setUserInput] = useState('')
  const [mode, setMode] = useState<'report' | 'video'>('report')
  const [context, setContext] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PipelineResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!userInput.trim() || !token) return

    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const response = await runPipeline(
        {
          user_input: userInput.trim(),
          mode,
          context: context.trim() || null,
        },
        token!,
      )
      setResult(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Navbar */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BarChart2 className="w-5 h-5 text-brand-600" />
            <span className="font-bold text-stone-800 tracking-tight">ModaMetrics</span>
            <span className="text-stone-400 text-sm hidden sm:block">· Turismo di lusso in Sardegna</span>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 transition px-3 py-1.5 rounded-lg hover:bg-stone-100"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:block">Esci</span>
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Query form */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 space-y-4">
          <h1 className="text-lg font-semibold text-stone-800">Nuova analisi</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Text input */}
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1.5">
                Richiesta in linguaggio naturale
              </label>
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                disabled={loading}
                rows={3}
                placeholder="Es. Mostra i post del mese scorso con più di 100 like pubblicati da account con oltre 10k follower…"
                className="w-full px-4 py-3 border border-stone-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition disabled:opacity-50 disabled:bg-stone-50"
              />
            </div>

            {/* Mode toggle */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-stone-600 mb-1.5">Formato output</p>
                <ModeToggle mode={mode} onChange={setMode} disabled={loading} />
              </div>

              {/* Advanced toggle */}
              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                className="text-sm text-stone-500 hover:text-stone-700 flex items-center gap-1 transition"
              >
                Opzioni avanzate
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {/* Advanced options */}
            {showAdvanced && (
              <div className="bg-stone-50 rounded-lg border border-stone-200 p-4 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-1">
                    Contesto extra per LLM
                  </label>
                  <input
                    type="text"
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    disabled={loading}
                    placeholder="Es. Concentrati sui livelli di coinvolgimento"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition disabled:opacity-50"
                  />
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !userInput.trim()}
              className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-lg transition text-sm"
            >
              <Send className="w-4 h-4" />
              {loading ? 'Elaborazione…' : 'Avvia analisi'}
            </button>
          </form>
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm">
            <LoadingSpinner />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-700 text-sm">Errore durante l'elaborazione</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
            <h2 className="text-base font-semibold text-stone-800 mb-4">
              Risultato · {result.mode === 'report' ? 'Report' : 'Prompt Video'}
            </h2>
            <ResultPanel response={result} />
          </div>
        )}
      </main>
    </div>
  )
}
