import { useEffect, useMemo, useState } from 'react'
import { Grid3x3, List, Map as MapIcon, Search, AlertCircle, Loader2, Heart, MessageCircle } from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useAuth } from '../context/AuthContext'
import { listPosts, listPoi, type PostListItem, type PoiItem } from '../api/explore'

// Fix Leaflet default icon path (Vite non risolve gli asset di default)
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

type Tab = 'posts' | 'poi'
type PostView = 'grid' | 'list'

export default function EsploraPage() {
  const { token } = useAuth()
  const [tab, setTab] = useState<Tab>('posts')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-stone-800">Esplora dati</h1>
        <p className="text-sm text-stone-500 mt-1">
          Naviga i post Instagram e i POI Datappeal.
        </p>
      </div>

      <div className="inline-flex rounded-lg border border-stone-200 bg-white p-1">
        <button
          onClick={() => setTab('posts')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
            tab === 'posts' ? 'bg-brand-600 text-white' : 'text-stone-600 hover:text-stone-800'
          }`}
        >
          Post Instagram
        </button>
        <button
          onClick={() => setTab('poi')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
            tab === 'poi' ? 'bg-brand-600 text-white' : 'text-stone-600 hover:text-stone-800'
          }`}
        >
          POI Datappeal
        </button>
      </div>

      {tab === 'posts' && token && <PostsTab token={token} />}
      {tab === 'poi' && token && <PoiTab token={token} />}
    </div>
  )
}

function PostsTab({ token }: { token: string }) {
  const [view, setView] = useState<PostView>('grid')
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [items, setItems] = useState<PostListItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 300)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    listPosts({ limit: 60, q: debounced || undefined }, token)
      .then((res) => {
        if (cancelled) return
        setItems(res.items)
        setTotal(res.total)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Errore')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [debounced, token])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cerca per caption, username, hashtag…"
            className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="inline-flex rounded-lg border border-stone-200 bg-white p-1">
          <button
            onClick={() => setView('grid')}
            title="Griglia"
            className={`p-1.5 rounded-md transition ${
              view === 'grid' ? 'bg-stone-100 text-stone-800' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <Grid3x3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView('list')}
            title="Lista"
            className={`p-1.5 rounded-md transition ${
              view === 'list' ? 'bg-stone-100 text-stone-800' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>

        <div className="text-xs text-stone-500">
          {loading ? 'Caricamento…' : `${items.length} di ${total} post`}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {loading && items.length === 0 && (
        <div className="bg-white border border-stone-200 rounded-xl p-8 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="bg-white border border-stone-200 rounded-xl p-8 text-center text-sm text-stone-500">
          Nessun post trovato.
        </div>
      )}

      {view === 'grid' ? <PostGrid items={items} /> : <PostList items={items} />}
    </div>
  )
}

function PostGrid({ items }: { items: PostListItem[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((p) => (
        <div key={p.post_id} className="bg-white border border-stone-200 rounded-xl overflow-hidden flex flex-col">
          {p.thumbnail_url ? (
            <img src={p.thumbnail_url} alt={p.caption ?? ''} className="w-full aspect-square object-cover bg-stone-100" loading="lazy" />
          ) : (
            <div className="w-full aspect-square bg-stone-100 flex items-center justify-center text-stone-400 text-xs">
              No image
            </div>
          )}
          <div className="p-3 space-y-2 text-xs">
            <div className="font-medium text-stone-700">@{p.ownerUsername}</div>
            <div className="text-stone-500 line-clamp-2">{p.caption ?? '—'}</div>
            <div className="flex items-center gap-3 text-stone-500">
              <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {p.likesCount}</span>
              <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {p.commentsCount}</span>
              <span className="ml-auto text-stone-400">{new Date(p.timestamp).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function PostList({ items }: { items: PostListItem[] }) {
  return (
    <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-stone-50 text-stone-600 text-xs uppercase tracking-wide">
          <tr>
            <th className="text-left px-4 py-2.5">Account</th>
            <th className="text-left px-4 py-2.5">Caption</th>
            <th className="text-right px-4 py-2.5">Like</th>
            <th className="text-right px-4 py-2.5">Commenti</th>
            <th className="text-left px-4 py-2.5">Data</th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr key={p.post_id} className="border-t border-stone-100 hover:bg-stone-50">
              <td className="px-4 py-2.5 font-medium text-stone-700">@{p.ownerUsername}</td>
              <td className="px-4 py-2.5 text-stone-600 max-w-md truncate">{p.caption ?? '—'}</td>
              <td className="px-4 py-2.5 text-right text-stone-700">{p.likesCount}</td>
              <td className="px-4 py-2.5 text-right text-stone-700">{p.commentsCount}</td>
              <td className="px-4 py-2.5 text-stone-500">{new Date(p.timestamp).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PoiTab({ token }: { token: string }) {
  const [segment, setSegment] = useState<'' | 'luxury' | 'traditional'>('')
  const [items, setItems] = useState<PoiItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<'map' | 'list'>('map')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    listPoi({ segment: segment || undefined }, token)
      .then((res) => {
        if (!cancelled) setItems(res.items)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Errore')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [segment, token])

  const center = useMemo<[number, number]>(() => {
    if (items.length === 0) return [40.12, 9.01] // centro Sardegna
    const avgLat = items.reduce((s, p) => s + p.latitude, 0) / items.length
    const avgLng = items.reduce((s, p) => s + p.longitude, 0) / items.length
    return [avgLat, avgLng]
  }, [items])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={segment}
          onChange={(e) => setSegment(e.target.value as '' | 'luxury' | 'traditional')}
          className="px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">Tutti i segmenti</option>
          <option value="luxury">luxury</option>
          <option value="traditional">traditional</option>
        </select>

        <div className="inline-flex rounded-lg border border-stone-200 bg-white p-1">
          <button
            onClick={() => setView('map')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition ${
              view === 'map' ? 'bg-stone-100 text-stone-800' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" /> Mappa
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition ${
              view === 'list' ? 'bg-stone-100 text-stone-800' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <List className="w-3.5 h-3.5" /> Lista
          </button>
        </div>

        <div className="text-xs text-stone-500">
          {loading ? 'Caricamento…' : `${items.length} POI`}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {view === 'map' ? (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden" style={{ height: 500 }}>
          <MapContainer center={center} zoom={9} style={{ height: '100%', width: '100%' }} key={`${center[0]}-${center[1]}`}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {items.map((p) => (
              <Marker key={p.poi_id} position={[p.latitude, p.longitude]}>
                <Popup>
                  <div className="text-xs space-y-1">
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-stone-500">{p.city ?? ''}{p.province ? ` (${p.province})` : ''}</div>
                    <div className="text-stone-500">
                      <span className="inline-block px-1.5 py-0.5 rounded bg-stone-100 mr-1">{p.segment}</span>
                      {p.category && <span>{p.category}</span>}
                    </div>
                    {p.sentiment_avg != null && (
                      <div className="text-stone-500">Sentiment: <strong>{p.sentiment_avg.toFixed(2)}</strong></div>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-stone-600 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-2.5">Nome</th>
                <th className="text-left px-4 py-2.5">Segmento</th>
                <th className="text-left px-4 py-2.5">Categoria</th>
                <th className="text-left px-4 py-2.5">Città</th>
                <th className="text-right px-4 py-2.5">Sentiment</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.poi_id} className="border-t border-stone-100 hover:bg-stone-50">
                  <td className="px-4 py-2.5 font-medium text-stone-700">{p.name}</td>
                  <td className="px-4 py-2.5 text-stone-600">{p.segment}</td>
                  <td className="px-4 py-2.5 text-stone-600">{p.category ?? '—'}</td>
                  <td className="px-4 py-2.5 text-stone-600">{p.city ?? '—'}</td>
                  <td className="px-4 py-2.5 text-right text-stone-700">{p.sentiment_avg?.toFixed(2) ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
