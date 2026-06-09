import type { PipelineRequest, PipelineResponse } from './types'

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

export async function mockRunPipeline(request: PipelineRequest): Promise<PipelineResponse> {
  await new Promise((res) => setTimeout(res, 2500))

  return {
    pipeline_id: `mock-${Date.now()}`,
    mode: request.mode,
    mongo_query: {
      collection: 'instagram_posts',
      filter: {
        likesCount: { $gte: 5 },
        timestamp: {
          $gte: '2026-05-01T00:00:00.000Z',
          $lte: '2026-05-31T23:59:59.000Z',
        },
      },
      sort: { likesCount: -1 },
      limit: 100,
    },
    raw_data: Array.from({ length: 42 }, (_, i) => ({
      post_id: `mock_post_${i}`,
      ownerUsername: `mock_account_${i % 5}`,
      likesCount: Math.floor(Math.random() * 1200) + 5,
      commentsCount: Math.floor(Math.random() * 90),
      timestamp: '2026-05-18T13:36:10.000Z',
    })),
    result: request.mode === 'report' ? MOCK_REPORT : MOCK_VIDEO_PROMPT,
    tokens_used: 1248,
    duration_ms: 2487,
  }
}
