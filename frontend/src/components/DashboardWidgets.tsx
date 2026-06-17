import type {
  SocialDashboardResponse,
  PoiDashboardResponse,
} from '../api/dashboard'

export function KpiCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-4">
      <div className="text-xs uppercase tracking-wide text-stone-500">{label}</div>
      <div className="text-2xl font-semibold text-stone-800 mt-1">{value}</div>
      {hint && <div className="text-xs text-stone-400 mt-1">{hint}</div>}
    </div>
  )
}

export function HBarList({
  title,
  items,
  formatValue,
}: {
  title: string
  items: { label: string; value: number }[]
  formatValue?: (v: number) => string
}) {
  const max = Math.max(...items.map((i) => i.value), 1)
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-4">
      <div className="text-sm font-semibold text-stone-700 mb-3">{title}</div>
      {items.length === 0 ? (
        <div className="text-xs text-stone-400">Nessun dato.</div>
      ) : (
        <div className="space-y-2">
          {items.map((it) => (
            <div key={it.label} className="flex items-center gap-3 text-xs">
              <div className="w-32 truncate text-stone-600" title={it.label}>{it.label}</div>
              <div className="flex-1 bg-stone-100 rounded h-2 overflow-hidden">
                <div className="h-full bg-brand-500" style={{ width: `${Math.max(2, (it.value / max) * 100)}%` }} />
              </div>
              <div className="w-16 text-right text-stone-700 tabular-nums">
                {formatValue ? formatValue(it.value) : it.value.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function LineChart({
  data,
  series,
  height = 200,
}: {
  data: { date: string; [k: string]: number | string }[]
  series: { key: string; label: string; color: string }[]
  height?: number
}) {
  if (data.length === 0) return <div className="text-xs text-stone-400">Nessun dato.</div>
  const allValues = series.flatMap((s) => data.map((d) => Number(d[s.key]) || 0))
  const max = Math.max(...allValues, 1)
  const min = Math.min(...allValues, 0)
  const range = max - min || 1
  const w = 600
  const padding = { top: 10, right: 10, bottom: 24, left: 36 }
  const innerW = w - padding.left - padding.right
  const innerH = height - padding.top - padding.bottom

  const xFor = (i: number) => padding.left + (i / (data.length - 1 || 1)) * innerW
  const yFor = (v: number) => padding.top + innerH - ((v - min) / range) * innerH

  return (
    <div className="space-y-2">
      <svg viewBox={`0 0 ${w} ${height}`} className="w-full" preserveAspectRatio="none" style={{ height }}>
        <line x1={padding.left} x2={padding.left} y1={padding.top} y2={padding.top + innerH} stroke="#e7e5e4" />
        <line x1={padding.left} x2={padding.left + innerW} y1={padding.top + innerH} y2={padding.top + innerH} stroke="#e7e5e4" />
        <text x={padding.left - 4} y={padding.top + 4} fontSize="9" fill="#a8a29e" textAnchor="end">{max.toFixed(0)}</text>
        <text x={padding.left - 4} y={padding.top + innerH} fontSize="9" fill="#a8a29e" textAnchor="end">{min.toFixed(0)}</text>
        {series.map((s) => {
          const pts = data
            .map((d, i) => `${xFor(i)},${yFor(Number(d[s.key]) || 0)}`)
            .join(' ')
          return <polyline key={s.key} points={pts} fill="none" stroke={s.color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        })}
        {data.length > 1 && data.map((d, i) =>
          i === 0 || i === data.length - 1 || i === Math.floor(data.length / 2) ? (
            <text key={i} x={xFor(i)} y={height - 4} fontSize="9" fill="#a8a29e" textAnchor="middle">
              {String(d.date).slice(5)}
            </text>
          ) : null,
        )}
      </svg>
      <div className="flex flex-wrap gap-3 text-xs text-stone-600">
        {series.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-1.5 rounded" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export function SocialDashboardBody({ data }: { data: SocialDashboardResponse }) {
  if (data.no_data) {
    return <div className="bg-white border border-stone-200 rounded-xl p-8 text-center text-sm text-stone-500">Nessun dato nel periodo selezionato.</div>
  }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard label="Post totali" value={data.kpis.total_posts.toLocaleString()} />
        <KpiCard label="Like totali" value={data.kpis.total_likes.toLocaleString()} hint={`media ${data.kpis.avg_likes}/post`} />
        <KpiCard label="Commenti" value={data.kpis.total_comments.toLocaleString()} hint={`media ${data.kpis.avg_comments}/post`} />
        <KpiCard label="Account unici" value={data.kpis.unique_accounts} />
        <KpiCard label="Location uniche" value={data.kpis.unique_locations} />
      </div>

      <div className="bg-white border border-stone-200 rounded-xl p-4">
        <div className="text-sm font-semibold text-stone-700 mb-3">Andamento nel tempo</div>
        <LineChart
          data={data.timeline.map((t) => ({ date: t.date, posts: t.posts, likes: t.likes / 10, comments: t.comments }))}
          series={[
            { key: 'posts', label: 'Post', color: '#0ea5e9' },
            { key: 'likes', label: 'Like (÷10)', color: '#f59e0b' },
            { key: 'comments', label: 'Commenti', color: '#10b981' },
          ]}
        />
        <div className="text-[10px] text-stone-400 mt-1">N.B. la serie like è scalata visivamente per leggibilità.</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <HBarList
          title="Top hashtag"
          items={data.top_hashtags.map((h) => ({ label: `#${h.hashtag}`, value: h.count }))}
        />
        <HBarList
          title="Top location"
          items={data.top_locations.map((l) => ({ label: l.location, value: l.count }))}
        />
        <HBarList
          title="Top account"
          items={data.top_accounts.map((a) => ({ label: `@${a.username}`, value: a.total_likes }))}
          formatValue={(v) => `${v.toLocaleString()} like`}
        />
        <HBarList
          title="Tipologie di post"
          items={data.post_types.map((p) => ({ label: p.type, value: p.count }))}
        />
      </div>

      <HBarList
        title="Contenuto visivo (classificazione MLLM)"
        items={data.visual_content.map((v) => ({ label: v.label, value: v.image_count }))}
      />

      {data.by_pat.length > 0 && (
        <HBarList
          title="Per PAT"
          items={data.by_pat.map((p) => ({ label: p.pat_name, value: p.count }))}
        />
      )}
    </div>
  )
}

export function PoiDashboardBody({ data }: { data: PoiDashboardResponse }) {
  if (data.no_data) {
    return <div className="bg-white border border-stone-200 rounded-xl p-8 text-center text-sm text-stone-500">Nessun POI nel filtro selezionato.</div>
  }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard label="POI totali" value={data.kpis.total_poi} />
        <KpiCard label="Sentiment medio" value={data.kpis.avg_sentiment.toFixed(2)} hint={`min ${data.kpis.min_sentiment.toFixed(2)} · max ${data.kpis.max_sentiment.toFixed(2)}`} />
        <KpiCard label="Stelle medie" value={data.kpis.avg_stars.toFixed(1)} />
        <KpiCard label="Camere medie" value={data.kpis.avg_rooms.toFixed(0)} />
        <KpiCard label="Fascia prezzo media" value={data.kpis.avg_price_class.toFixed(1)} hint="scala 1–5" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <HBarList
          title="Per segmento"
          items={data.by_segment.map((s) => ({ label: s.segment, value: s.count }))}
        />
        <HBarList
          title="Per categoria"
          items={data.by_category.map((c) => ({ label: c.category, value: c.count }))}
        />
        <HBarList
          title="Per città"
          items={data.by_city.map((c) => ({ label: c.city, value: c.count }))}
        />
        <HBarList
          title="Distribuzione sentiment"
          items={data.sentiment_distribution.map((b) => ({ label: b.range, value: b.count }))}
        />
        <HBarList
          title="Stelle"
          items={data.stars_distribution.map((s) => ({ label: `${s.stars}★`, value: s.count }))}
        />
        <HBarList
          title="Fascia prezzo"
          items={data.price_class_distribution.map((p) => ({ label: `€${p.price_class}`, value: p.count }))}
        />
      </div>

      <div className="bg-white border border-stone-200 rounded-xl p-4">
        <div className="text-sm font-semibold text-stone-700 mb-3">Andamento prezzi OTA</div>
        <LineChart
          data={data.price_trend.map((p) => ({ date: p.date, min: p.avg_min_price, median: p.avg_median_price, max: p.avg_max_price }))}
          series={[
            { key: 'min', label: 'Min', color: '#10b981' },
            { key: 'median', label: 'Mediana', color: '#0ea5e9' },
            { key: 'max', label: 'Max', color: '#ef4444' },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <div className="text-sm font-semibold text-stone-700 mb-3">Tasso occupazione</div>
          <LineChart
            data={data.occupancy_trend.map((o) => ({ date: o.date, occupancy: o.avg_occupancy_rate * 100 }))}
            series={[{ key: 'occupancy', label: 'Occupazione %', color: '#0ea5e9' }]}
            height={160}
          />
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <div className="text-sm font-semibold text-stone-700 mb-3">Popolarità digitale</div>
          <LineChart
            data={data.popularity_trend.map((p) => ({ date: p.date, popularity: p.avg_popularity * 100 }))}
            series={[{ key: 'popularity', label: 'Popolarità %', color: '#f59e0b' }]}
            height={160}
          />
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4 lg:col-span-2">
          <div className="text-sm font-semibold text-stone-700 mb-3">Andamento sentiment</div>
          <LineChart
            data={data.sentiment_trend.map((s) => ({ date: s.date, sentiment: s.avg_sentiment, reviews: s.total_reviews }))}
            series={[
              { key: 'sentiment', label: 'Sentiment medio', color: '#10b981' },
              { key: 'reviews', label: 'Recensioni totali', color: '#a78bfa' },
            ]}
          />
        </div>
      </div>
    </div>
  )
}
