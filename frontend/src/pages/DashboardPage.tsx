import { useEffect, useState } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  getSocialDashboard,
  getPoiDashboard,
  type SocialCollection,
  type PoiSegment,
  type SocialDashboardResponse,
  type PoiDashboardResponse,
} from '../api/dashboard'
import { SocialDashboardBody, PoiDashboardBody } from '../components/DashboardWidgets'

type Tab = 'social' | 'poi'

export default function DashboardPage() {
  const { token } = useAuth()
  const [tab, setTab] = useState<Tab>('social')

  if (!token) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-stone-800">Dashboard</h1>
        <p className="text-sm text-stone-500 mt-1">
          Visualizzazione aggregata di metriche social e POI.
        </p>
      </div>

      <div className="inline-flex rounded-lg border border-stone-200 bg-white p-1">
        <button
          onClick={() => setTab('social')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
            tab === 'social' ? 'bg-brand-600 text-white' : 'text-stone-600 hover:text-stone-800'
          }`}
        >
          Social
        </button>
        <button
          onClick={() => setTab('poi')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
            tab === 'poi' ? 'bg-brand-600 text-white' : 'text-stone-600 hover:text-stone-800'
          }`}
        >
          Strutture (POI)
        </button>
      </div>

      {tab === 'social' && <SocialTab token={token} />}
      {tab === 'poi' && <PoiTab token={token} />}
    </div>
  )
}

function SocialTab({ token }: { token: string }) {
  const [collection, setCollection] = useState<SocialCollection>('instagram_posts')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [data, setData] = useState<SocialDashboardResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getSocialDashboard(
      {
        collection,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
      },
      token,
    )
      .then((res) => { if (!cancelled) setData(res) })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Errore') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [collection, fromDate, toDate, token])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 bg-white border border-stone-200 rounded-xl p-3">
        <div className="flex flex-col">
          <label className="text-xs text-stone-500 mb-1">Sorgente</label>
          <select
            value={collection}
            onChange={(e) => setCollection(e.target.value as SocialCollection)}
            className="px-3 py-1.5 border border-stone-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="instagram_posts">Instagram</option>
            <option value="pat_posts">Post PAT</option>
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-stone-500 mb-1">Dal</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-3 py-1.5 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-stone-500 mb-1">Al</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-3 py-1.5 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        {(fromDate || toDate) && (
          <button
            onClick={() => { setFromDate(''); setToDate('') }}
            className="text-xs text-stone-500 hover:text-stone-700 px-2 py-1"
          >
            Rimuovi filtri
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {loading && !data && (
        <div className="bg-white border border-stone-200 rounded-xl p-8 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
        </div>
      )}

      {data && <SocialDashboardBody data={data} />}
    </div>
  )
}

function PoiTab({ token }: { token: string }) {
  const [segment, setSegment] = useState<'' | PoiSegment>('')
  const [data, setData] = useState<PoiDashboardResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getPoiDashboard({ segment: segment || undefined }, token)
      .then((res) => { if (!cancelled) setData(res) })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Errore') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [segment, token])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 bg-white border border-stone-200 rounded-xl p-3">
        <div className="flex flex-col">
          <label className="text-xs text-stone-500 mb-1">Segmento</label>
          <select
            value={segment}
            onChange={(e) => setSegment(e.target.value as '' | PoiSegment)}
            className="px-3 py-1.5 border border-stone-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Tutti</option>
            <option value="luxury">luxury</option>
            <option value="traditional">traditional</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {loading && !data && (
        <div className="bg-white border border-stone-200 rounded-xl p-8 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
        </div>
      )}

      {data && <PoiDashboardBody data={data} />}
    </div>
  )
}
