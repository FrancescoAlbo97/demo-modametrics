'use strict'

const express = require('express')
const cors = require('cors')
const { MongoClient, ObjectId } = require('mongodb')

const PORT = 8999
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017'
const DB_NAME = 'modametrics_mock'

const app = express()
app.use(cors())
app.use(express.json())

// MongoDB client — optional, server starts even if Mongo is down
let db = null
MongoClient.connect(MONGO_URL)
  .then((client) => {
    db = client.db(DB_NAME)
    console.log(`[mongo] connesso a ${MONGO_URL}/${DB_NAME}`)
  })
  .catch((err) => {
    console.warn(`[mongo] non disponibile (${err.message}) — proseguo senza persistenza`)
  })

// In-memory token store: token → { username, expiresAt }
const activeTokens = new Map()

// ─── Auth middleware ───────────────────────────────────────────────────────────
function requireBearer(req, res, next) {
  const auth = req.headers['authorization']
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'Authorization header mancante o non Bearer' })
  }
  const token = auth.slice(7)
  const session = activeTokens.get(token)
  if (!session) {
    return res.status(401).json({ detail: 'Token non valido o scaduto' })
  }
  if (Date.now() > session.expiresAt) {
    activeTokens.delete(token)
    return res.status(401).json({ detail: 'Token scaduto' })
  }
  req.user = session.username
  next()
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_POSTS = Array.from({ length: 42 }, (_, i) => ({
  post_id: `CfUqpZgqn${i.toString().padStart(2, '0')}`,
  ownerUsername: ['sardinia_luxury', 'costa_smeralda_life', 'luxury_car_division', 'arzachena_estates', 'porto_cervo_official'][i % 5],
  caption: `Post di esempio ${i + 1} — turismo di lusso in Sardegna #sardegna #luxurytravel`,
  likesCount: Math.floor(Math.random() * 1200) + 5,
  commentsCount: Math.floor(Math.random() * 90),
  hashtags: ['sardegna', 'costasmeralda', 'luxurytravel', 'portocervo'],
  timestamp: `2026-05-${String(1 + (i % 31)).padStart(2, '0')}T${String(8 + (i % 14)).padStart(2, '0')}:00:00.000Z`,
  type: i % 3 === 0 ? 'Sidecar' : i % 3 === 1 ? 'Reel' : 'GraphImage',
  embedded_images: [{ filename: `${i}_1.jpg`, image_index: 1, file_size_bytes: 84210 }],
}))

const MOCK_REPORT = `# Report Analisi Instagram — Turismo di Lusso in Sardegna

## Sommario

Sono stati analizzati **42 post** pubblicati tra il 1 e il 31 maggio 2026 da account relativi al turismo di lusso in Sardegna, con un minimo di 5 mi piace ciascuno. Il periodo ha registrato un incremento del **23% nel coinvolgimento** rispetto al mese precedente.

## Top Post per Engagement

| Account | Like | Commenti | Tipo |
|---|---|---|---|
| @sardinia_luxury | 1.243 | 87 | Carosello |
| @costa_smeralda_life | 987 | 64 | Reel |
| @luxury_car_division | 834 | 41 | Immagine |
| @arzachena_estates | 712 | 38 | Carosello |
| @porto_cervo_official | 698 | 55 | Immagine |

## Hashtag Più Utilizzati

I tag dominanti nella finestra temporale analizzata sono stati:

- **#sardegna** (38 occorrenze)
- **#costasmeralda** (31 occorrenze)
- **#luxurytravel** (28 occorrenze)
- **#portocervo** (22 occorrenze)
- **#sardinalife** (19 occorrenze)

## Analisi per Tipo di Contenuto

I **caroselli** hanno generato in media il **34% di engagement in più** rispetto alle immagini singole. I reel, pur meno numerosi (7 su 42), hanno ottenuto la copertura organica più alta.

## Conclusioni

Il picco di attività si concentra nei **weekend** (venerdì–domenica), con orari di pubblicazione ottimali tra le **18:00 e le 21:00**. Si raccomanda di incrementare la produzione di contenuti video per massimizzare la reach nella stagione estiva.
`

const MOCK_VIDEO_PROMPT = `Cinematic aerial drone footage over the crystal-clear turquoise waters of Costa Smeralda, Sardinia.
Golden hour lighting, luxury yachts anchored in a secluded cove.
Slow dolly-in toward a clifftop villa with infinity pool overlooking the Mediterranean.
Color grade: warm teal-and-orange LUT, high contrast.
Music: ambient cinematic, subtle string arrangement.
Duration: 30 seconds. Aspect ratio: 9:16 (vertical for Instagram Reels).
End card: logo overlay bottom-center, fade to white.`

// ─── Routes ───────────────────────────────────────────────────────────────────

// Mock credentials — qualsiasi username con password "password" viene accettato
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body
  if (!username || !password) {
    return res.status(422).json({ detail: 'username e password obbligatori' })
  }
  if (password !== 'password') {
    return res.status(401).json({ detail: 'Credenziali non valide' })
  }
  const token = `mock-jwt-${Date.now()}-${Math.random().toString(36).slice(2)}`
  const expiresInMinutes = 60
  activeTokens.set(token, { username, expiresAt: Date.now() + expiresInMinutes * 60 * 1000 })
  console.log(`[auth] login OK — utente: ${username}`)
  res.json({ access_token: token, token_type: 'bearer', expires_in_minutes: expiresInMinutes })
})

app.get('/health', async (_req, res) => {
  const mongoStatus = db ? 'ok' : 'unavailable'
  res.json({
    status: mongoStatus === 'ok' ? 'ok' : 'degraded',
    services: {
      'mock-server': 'ok',
      mongodb: mongoStatus,
      'query-service': 'ok (mock)',
      'llm-service': 'ok (mock)',
    },
  })
})

app.post('/api/pipeline', requireBearer, async (req, res) => {
  const { user_input, mode, context } = req.body

  if (!user_input || !mode) {
    return res.status(400).json({ detail: 'user_input e mode sono obbligatori' })
  }
  if (mode !== 'report' && mode !== 'video') {
    return res.status(400).json({ detail: 'mode deve essere "report" o "video"' })
  }

  // Simulate processing delay (1.5–3s)
  const delay = 1500 + Math.random() * 1500
  await new Promise((r) => setTimeout(r, delay))

  const pipeline_id = new ObjectId().toHexString()
  const result = mode === 'report' ? MOCK_REPORT : MOCK_VIDEO_PROMPT
  const tokensUsed = mode === 'report' ? 1248 : 312
  const durationMs = Math.round(delay + 800)

  const payload = {
    pipeline_id,
    mode,
    mongo_query: {
      collection: 'instagram_posts',
      filter: {
        likesCount: { $gte: 5 },
        timestamp: { $gte: '2026-05-01T00:00:00.000Z', $lte: '2026-05-31T23:59:59.000Z' },
      },
      sort: { likesCount: -1 },
      limit: 100,
    },
    raw_data: MOCK_POSTS,
    result,
    tokens_used: tokensUsed,
    duration_ms: durationMs,
  }

  // Persist to MongoDB if available
  if (db) {
    try {
      await db.collection('pipeline_runs').insertOne({
        ...payload,
        user_input,
        context: context ?? null,
        created_at: new Date(),
      })
    } catch (err) {
      console.error('[mongo] errore salvataggio pipeline run:', err.message)
    }
  }

  res.json(payload)
})

app.get('/api/pipeline/:pipeline_id', requireBearer, async (req, res) => {
  if (!db) return res.status(503).json({ detail: 'MongoDB non disponibile' })
  const doc = await db.collection('pipeline_runs').findOne({ pipeline_id: req.params.pipeline_id })
  if (!doc) return res.status(404).json({ detail: 'Pipeline ID non trovato' })
  res.json(doc)
})

app.get('/api/pipeline/:pipeline_id/export', requireBearer, async (req, res) => {
  if (!db) return res.status(503).json({ detail: 'MongoDB non disponibile' })
  const doc = await db.collection('pipeline_runs').findOne({ pipeline_id: req.params.pipeline_id })
  if (!doc) return res.status(404).json({ detail: 'Pipeline ID non trovato' })

  const format = (req.query.format || 'pdf').toString()
  if (format !== 'docx' && format !== 'pdf') {
    return res.status(400).json({ detail: 'format deve essere "docx" o "pdf"' })
  }

  const content = doc.result || ''
  const filename = `modametrics_${doc.mode}_${doc.pipeline_id}.${format}`

  // Mock: serviamo un file di testo con estensione corretta — sufficiente per testare il download
  const contentType =
    format === 'pdf'
      ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

  res.setHeader('Content-Type', contentType)
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  res.send(Buffer.from(`[MOCK ${format.toUpperCase()}]\n\n${content}`, 'utf-8'))
})

app.post('/api/pipeline/:pipeline_id/invideo', requireBearer, async (req, res) => {
  if (!db) return res.status(503).json({ detail: 'MongoDB non disponibile' })
  const doc = await db.collection('pipeline_runs').findOne({ pipeline_id: req.params.pipeline_id })
  if (!doc) return res.status(404).json({ detail: 'Pipeline ID non trovato' })
  if (doc.mode !== 'video') {
    return res.status(400).json({ detail: 'La pipeline non è in modalità video' })
  }

  const { vibe = 'cinematic, emotional, professional', target_audience = 'general audience', platform = 'youtube' } = req.body || {}
  const validPlatforms = ['youtube', 'instagram', 'tiktok', 'facebook']
  if (!validPlatforms.includes(platform)) {
    return res.status(400).json({ detail: `platform deve essere uno di: ${validPlatforms.join(', ')}` })
  }

  // Mock: l'URL reale dell'InVideo MCP non è replicabile — apriamo l'AI workspace
  // e il frontend si occupa di copiare il prompt in clipboard.
  void vibe; void target_audience
  const invideo_url = 'https://ai.invideo.io/ai/workspace'

  console.log(`[invideo] mock link generato per pipeline ${req.params.pipeline_id} (${platform})`)
  res.json({ invideo_url, platform })
})

// ─── Ingest mocks ─────────────────────────────────────────────────────────────
// I 5 endpoint di ingest in produzione accettano multipart/form-data; il mock
// non parsa i body (servirebbe multer) e si limita a restituire una risposta
// coerente con lo swagger.

app.post('/api/ingest/posts', requireBearer, (_req, res) => {
  res.json({
    ingest_id: new ObjectId().toHexString(),
    summary: {
      posts_inserted: 42,
      posts_updated: 3,
      posts_unchanged: 12,
      posts_skipped_empty: 1,
      images_inserted: 38,
      images_skipped: 2,
    },
    duration_ms: 2150,
  })
})

app.post('/api/ingest/visual-analysis', requireBearer, (_req, res) => {
  res.json({
    ingest_id: new ObjectId().toHexString(),
    classification_model: 'mock-mllm-v1',
    summary: { total_results: 50, classifications_updated: 46, skipped_error_status: 2, not_found: 2 },
    duration_ms: 1820,
  })
})

app.post('/api/ingest/datappeal', requireBearer, (_req, res) => {
  res.json({
    ingest_id: new ObjectId().toHexString(),
    segment: 'luxury',
    summary: { pois_upserted: 18, pois_matched: 7 },
    duration_ms: 3400,
  })
})

app.post('/api/ingest/pat/posts', requireBearer, (_req, res) => {
  res.json({
    ingest_id: new ObjectId().toHexString(),
    summary: {
      posts_inserted: 22,
      posts_updated: 1,
      posts_unchanged: 5,
      posts_skipped_empty: 0,
      images_inserted: 19,
      images_skipped: 1,
    },
    duration_ms: 1620,
  })
})

app.post('/api/ingest/pat/description', requireBearer, (_req, res) => {
  res.json({
    ingest_id: new ObjectId().toHexString(),
    description_model: 'mock-mllm-v1',
    summary: { total_results: 30, descriptions_updated: 28, skipped_error_status: 1, not_found: 1 },
    duration_ms: 1450,
  })
})

// ─── Exploration endpoints (NON nello swagger — vedi docs/proposed_explore_endpoints.md) ─
const MOCK_POI = [
  { poi_id: 'poi_001', name: 'Hotel Cala di Volpe',          segment: 'luxury',      latitude: 41.1300, longitude: 9.5408, city: 'Porto Cervo',     province: 'SS', category: 'Hotel 5★',    sentiment_avg: 0.82 },
  { poi_id: 'poi_002', name: 'Hotel Pitrizza',                segment: 'luxury',      latitude: 41.1402, longitude: 9.5301, city: 'Porto Cervo',     province: 'SS', category: 'Hotel 5★',    sentiment_avg: 0.79 },
  { poi_id: 'poi_003', name: 'Forte Village Resort',          segment: 'luxury',      latitude: 38.9920, longitude: 8.9080, city: 'Santa Margherita',province: 'CA', category: 'Resort',      sentiment_avg: 0.74 },
  { poi_id: 'poi_004', name: 'Hotel Romazzino',               segment: 'luxury',      latitude: 41.1175, longitude: 9.5482, city: 'Porto Cervo',     province: 'SS', category: 'Hotel 5★',    sentiment_avg: 0.77 },
  { poi_id: 'poi_005', name: 'Villa del Golfo Lifestyle',     segment: 'luxury',      latitude: 41.1990, longitude: 9.4080, city: 'Cannigione',      province: 'SS', category: 'Boutique',    sentiment_avg: 0.71 },
  { poi_id: 'poi_006', name: 'Agriturismo Sa Mandara',        segment: 'traditional', latitude: 40.4380, longitude: 9.4040, city: 'Orgosolo',        province: 'NU', category: 'Agriturismo', sentiment_avg: 0.68 },
  { poi_id: 'poi_007', name: 'B&B Su Gologone',               segment: 'traditional', latitude: 40.2750, longitude: 9.4670, city: 'Oliena',          province: 'NU', category: 'B&B',         sentiment_avg: 0.72 },
  { poi_id: 'poi_008', name: 'Hotel Su Lithu',                segment: 'traditional', latitude: 40.4790, longitude: 9.6280, city: 'Bitti',           province: 'NU', category: 'Hotel 3★',    sentiment_avg: 0.60 },
  { poi_id: 'poi_009', name: 'Pizzeria Trattoria Sa Domu',    segment: 'traditional', latitude: 39.2238, longitude: 9.1217, city: 'Cagliari',        province: 'CA', category: 'Ristorante',  sentiment_avg: 0.65 },
  { poi_id: 'poi_010', name: 'Trattoria Lillicu',             segment: 'traditional', latitude: 39.2147, longitude: 9.1140, city: 'Cagliari',        province: 'CA', category: 'Ristorante',  sentiment_avg: 0.74 },
  { poi_id: 'poi_011', name: 'Ristorante Su Gologone',        segment: 'luxury',      latitude: 40.2720, longitude: 9.4720, city: 'Oliena',          province: 'NU', category: 'Ristorante',  sentiment_avg: 0.85 },
  { poi_id: 'poi_012', name: 'Hotel La Coluccia',             segment: 'luxury',      latitude: 41.2240, longitude: 9.2030, city: 'Santa Teresa',    province: 'SS', category: 'Hotel 4★',    sentiment_avg: 0.69 },
]

app.get('/api/posts', requireBearer, async (req, res) => {
  const skip = Math.max(0, parseInt(req.query.skip ?? '0', 10) || 0)
  const limit = Math.min(200, Math.max(1, parseInt(req.query.limit ?? '60', 10) || 60))
  const q = (req.query.q || '').toString().trim().toLowerCase()

  let items = MOCK_POSTS.map((p, i) => ({
    ...p,
    thumbnail_url: `https://picsum.photos/seed/mm${i}/400/400`,
    latitude: 40.0 + (i % 10) * 0.15,
    longitude: 9.0 + (i % 8) * 0.18,
    locationName: ['Porto Cervo', 'Costa Smeralda', 'Cagliari', 'Alghero', 'Olbia'][i % 5],
  }))

  if (q) {
    items = items.filter(
      (p) =>
        p.caption.toLowerCase().includes(q) ||
        p.ownerUsername.toLowerCase().includes(q) ||
        (p.hashtags || []).some((h) => h.toLowerCase().includes(q)),
    )
  }

  const total = items.length
  const page = items.slice(skip, skip + limit)
  res.json({ items: page, total, skip, limit })
})

app.get('/api/poi', requireBearer, (req, res) => {
  const segment = req.query.segment
  let items = MOCK_POI
  if (segment === 'luxury' || segment === 'traditional') {
    items = items.filter((p) => p.segment === segment)
  }
  res.json({ items, total: items.length })
})

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[mock-server] in ascolto su http://localhost:${PORT}`)
})
