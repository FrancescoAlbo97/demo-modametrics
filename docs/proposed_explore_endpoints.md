# Endpoint proposti per la sezione "Esplora"

Questo documento descrive 2 endpoint **non ancora presenti nello swagger** ma necessari al frontend per la sezione "Esplora dati". Sono al momento implementati come mock nel server di sviluppo `backend/server.js` per consentire il test della UI.

Quando questi endpoint saranno disponibili in produzione, il frontend non avrà bisogno di alcuna modifica: il client API (`frontend/src/api/explore.ts`) si aspetta esattamente lo schema descritto qui.

---

## 1. `GET /api/posts` — Lista post Instagram

Endpoint paginato per esplorare i post salvati in `instagram_posts`. Sostituisce la necessità di passare per il pipeline LLM solo per popolare una griglia.

### Query string
| Parametro | Tipo    | Default | Descrizione |
|-----------|---------|---------|-------------|
| `skip`    | integer | `0`     | Offset per la paginazione |
| `limit`   | integer | `60`    | Numero max di risultati (cap consigliato: 200) |
| `q`       | string  | —       | Full-text search su `caption`, `ownerUsername`, `hashtags` |
| `from`    | string (ISO 8601) | — | (opzionale) filtra `timestamp >= from` |
| `to`      | string (ISO 8601) | — | (opzionale) filtra `timestamp <= to` |
| `owner`   | string  | —       | (opzionale) filtra per `ownerUsername` esatto |

### Sicurezza
Bearer JWT obbligatorio (stesso meccanismo di `/api/pipeline`).

### Risposta `200`

```json
{
  "items": [
    {
      "post_id": "CfUqpZgqnPv",
      "ownerUsername": "luxury_car_division",
      "caption": "Lamborghini Urus knows no compromise…",
      "likesCount": 47,
      "commentsCount": 0,
      "timestamp": "2026-05-18T13:36:10.000Z",
      "type": "Sidecar",
      "hashtags": ["LuxuryCarRental", "sardegna"],
      "thumbnail_url": "/api/posts/CfUqpZgqnPv/images/1",
      "latitude": 41.13,
      "longitude": 9.54,
      "locationName": "Porto Cervo"
    }
  ],
  "total": 142,
  "skip": 0,
  "limit": 60
}
```

### Note d'implementazione
- `thumbnail_url` può puntare al primo `embedded_images` del post (`/api/posts/{post_id}/images/{index}`) oppure a un campo cached.
- `latitude` / `longitude` / `locationName` sono opzionali: se la coordinata non è disponibile nel documento Mongo, restituire `null`. Servono per una futura vista mappa sui post (oggi non usata).
- Ordinamento di default consigliato: `timestamp DESC`.
- Caching: questi dati non cambiano spesso → un `Cache-Control: private, max-age=60` è benvenuto.

---

## 2. `GET /api/poi` — Lista POI Datappeal

Endpoint per esplorare i POI in `poi_data` con coordinate per la vista mappa.

### Query string
| Parametro  | Tipo    | Default | Descrizione |
|------------|---------|---------|-------------|
| `segment`  | enum    | —       | `luxury` o `traditional`. Se omesso, restituisce tutti. |
| `province` | string  | —       | (opzionale) sigla provincia: `SS`, `NU`, `CA`, `OR` |
| `category` | string  | —       | (opzionale) categoria POI |

### Sicurezza
Bearer JWT obbligatorio.

### Risposta `200`

```json
{
  "items": [
    {
      "poi_id": "poi_001",
      "name": "Hotel Cala di Volpe",
      "segment": "luxury",
      "latitude": 41.13,
      "longitude": 9.5408,
      "city": "Porto Cervo",
      "province": "SS",
      "category": "Hotel 5★",
      "sentiment_avg": 0.82
    }
  ],
  "total": 12
}
```

### Note d'implementazione
- `latitude` / `longitude` sono **obbligatori** — i POI senza coordinate vanno esclusi dalla risposta (oppure restituiti ma marcati: dipende dal design preferito).
- `sentiment_avg` può essere derivato dalla media degli array di sentiment già embedded nel documento POI, oppure precalcolato — il frontend si aspetta un float `[-1, 1]` o `null`.
- Nessuna paginazione necessaria nella prima versione (il volume di POI per segmento è < 500).

---

## 3. Nota sul mock di `POST /api/pipeline/{id}/invideo`

L'endpoint reale esiste già nello swagger (operationId `create_invideo_video_api_pipeline__pipeline_id__invideo_post`). **Il mock di sviluppo in `backend/server.js` restituisce un URL fittizio** (`https://ai.invideo.io/ai/workspace`) perché il formato reale dell'URL InVideo MCP non è documentato.

Il frontend, prima di aprire il link in nuova tab, **copia il prompt completo negli appunti** così l'utente può incollarlo manualmente — un fallback che funziona anche quando l'MCP restituisce un URL valido.

Quando si testa contro il backend reale, il bottone "Apri su InVideo" passerà comunque dalla copia in clipboard (non rompe il flusso) e aprirà l'URL reale: nessuna modifica frontend necessaria.
