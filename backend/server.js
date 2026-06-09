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

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[mock-server] in ascolto su http://localhost:${PORT}`)
})
