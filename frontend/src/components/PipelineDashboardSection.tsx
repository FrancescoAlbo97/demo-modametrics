import { useEffect, useState } from 'react'
import { Loader2, AlertCircle, BarChart2 } from 'lucide-react'
import {
  getPipelineSocialDashboard,
  getPipelinePoiDashboard,
  type SocialDashboardResponse,
  type PoiDashboardResponse,
} from '../api/dashboard'
import { SocialDashboardBody, PoiDashboardBody } from './DashboardWidgets'

type Kind = 'social' | 'poi' | 'unsupported'

function kindFor(collection?: string): Kind {
  if (collection === 'instagram_posts' || collection === 'pat_posts') return 'social'
  if (collection === 'poi_data') return 'poi'
  return 'unsupported'
}

export default function PipelineDashboardSection({
  pipelineId,
  collection,
  token,
}: {
  pipelineId?: string
  collection?: string
  token: string
}) {
  const kind = kindFor(collection)
  const [open, setOpen] = useState(false)
  const [social, setSocial] = useState<SocialDashboardResponse | null>(null)
  const [poi, setPoi] = useState<PoiDashboardResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !pipelineId || kind === 'unsupported') return
    let cancelled = false
    setLoading(true)
    setError(null)
    const promise =
      kind === 'social'
        ? getPipelineSocialDashboard(pipelineId, token).then((d) => { if (!cancelled) setSocial(d) })
        : getPipelinePoiDashboard(pipelineId, token).then((d) => { if (!cancelled) setPoi(d) })
    promise
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Errore') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [open, pipelineId, kind, token])

  if (kind === 'unsupported' || !pipelineId) return null

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-stone-800 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-brand-600" />
          Dashboard del risultato
        </h2>
        <button
          onClick={() => setOpen((v) => !v)}
          className="text-sm text-brand-600 hover:text-brand-700"
        >
          {open ? 'Nascondi' : 'Mostra'}
        </button>
      </div>

      {!open && (
        <p className="text-sm text-stone-500">
          Visualizza metriche aggregate della collection <code className="text-xs bg-stone-100 px-1.5 py-0.5 rounded">{collection}</code> usata da questa pipeline.
        </p>
      )}

      {open && error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {open && loading && (
        <div className="flex justify-center p-6">
          <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
        </div>
      )}

      {open && !loading && social && <SocialDashboardBody data={social} />}
      {open && !loading && poi && <PoiDashboardBody data={poi} />}
    </div>
  )
}
