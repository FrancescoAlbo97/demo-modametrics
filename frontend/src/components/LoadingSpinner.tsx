import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

const STEPS = [
  'Analisi della richiesta…',
  'Generazione query MongoDB…',
  'Recupero post Instagram…',
  'Elaborazione con LLM…',
  'Finalizzazione output…',
]

export default function LoadingSpinner() {
  const [stepIndex, setStepIndex] = useState(0)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, STEPS.length - 1))
    }, 6000)
    const tick = setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => { clearInterval(stepInterval); clearInterval(tick) }
  }, [])

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-brand-100 border-t-brand-500 animate-spin" />
        <Loader2 className="absolute inset-0 m-auto w-6 h-6 text-brand-500 animate-spin" style={{ animationDuration: '1.5s' }} />
      </div>
      <div className="text-center space-y-1">
        <p className="text-stone-700 font-medium">{STEPS[stepIndex]}</p>
        <p className="text-stone-400 text-sm">{elapsed}s · tempo stimato ~30s</p>
      </div>
      <div className="w-64 bg-stone-200 rounded-full h-1.5">
        <div
          className="bg-brand-500 h-1.5 rounded-full transition-all duration-1000"
          style={{ width: `${Math.min((elapsed / 30) * 100, 95)}%` }}
        />
      </div>
    </div>
  )
}
