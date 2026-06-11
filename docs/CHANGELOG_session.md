# Changelog — sessione

Cronologia ordinata delle modifiche, raggruppate per commit logico. Ogni gruppo è pensato per essere un commit indipendente; l'ordine va rispettato per mantenere il repo sempre buildable.

---

## Commit 1 — `feat(export): download docx/pdf via API gateway`

Sostituisce la generazione client-side di docx/pdf (che riformattava il markdown lato browser perdendo tabelle/liste annidate) con una chiamata diretta a `GET /api/pipeline/{pipeline_id}/export?format=docx|pdf` autenticata col Bearer JWT.

**File toccati:**
- `frontend/src/api/types.ts` — aggiunti tipi `InVideoRequest` / `InVideoResponse` (usati nel commit 2, ma il tipo viaggia col cambio API).
- `frontend/src/api/pipeline.ts` — nuove funzioni `exportPipeline(pipelineId, format, token)` e `createInVideoLink(...)`.
- `frontend/src/utils/download.ts` — ridotto a `downloadMarkdown` (client-side) + `downloadFromApi`. Rimossa la dipendenza da `jspdf` e `docx` a livello di codice.
- `frontend/src/components/DownloadButtons.tsx` — usa il token via `useAuth()`, gestisce loading per format, mostra errore inline; bottoni docx/pdf disabilitati se manca `pipelineId`.

**Cleanup non automatico:** `docx` e `jspdf` in `package.json` non sono più referenziati dal codice. Eliminarli con `npm uninstall docx jspdf` quando si vuole snellire `node_modules`.

---

## Commit 2 — `feat(video): bottone InVideo + render markdown del prompt`

Risolve due problemi insieme perché toccano lo stesso componente (`ResultPanel`).

**Problema A** — il prompt video veniva renderizzato dentro `<pre className="font-mono">`, quindi markdown grezzo a video.
**Fix:** ramo video di `ResultPanel` ora usa `<ReactMarkdown remarkPlugins={[remarkGfm]}>` come il ramo report, dentro un wrapper `prose` con sfondo `stone-50` per distinguerlo visivamente.

**Problema B** — manca un modo per inviare il prompt a InVideo.
**Fix:** nuovo `InVideoButton` che chiama `POST /api/pipeline/{id}/invideo` con `vibe` / `target_audience` / `platform`, e prima di aprire l'URL in nuova tab copia il prompt negli appunti (toast "Prompt copiato"). Il fallback clipboard è importante perché l'URL del mock non pre-carica il prompt — vedi `docs/proposed_explore_endpoints.md` §3.

**File toccati:**
- `frontend/src/components/ResultPanel.tsx`
- `frontend/src/components/InVideoButton.tsx` (nuovo)

---

## Commit 3 — `chore(dev): tasks.json per avvio one-click`

Aggiunge `.vscode/tasks.json` con 3 task:
- `Backend: dev` — `npm run dev` in `backend/`
- `Frontend: vite` — `npx vite` in `frontend/` (non usa lo script `dev` di frontend per evitare il doppio backend lanciato da `concurrently`)
- `Dev: start all` — compound che lancia entrambi in parallelo, marcato come default build task (`Ctrl+Shift+B`)

---

## Commit 4 — `feat(backend): mock /export e /invideo`

Aggiunge al mock server gli endpoint mancanti che il frontend già stava chiamando:
- `GET /api/pipeline/:id/export?format=docx|pdf` — recupera il run da Mongo, restituisce un blob con il `Content-Type` corretto e header `Content-Disposition`. Il contenuto è il markdown grezzo prefissato con `[MOCK PDF]` / `[MOCK DOCX]` — sufficiente per testare il flusso, **non è un PDF/DOCX reale**.
- `POST /api/pipeline/:id/invideo` — verifica modalità video, valida `platform`, restituisce `https://ai.invideo.io/ai/workspace` (vedi nota in `docs/proposed_explore_endpoints.md` §3).

**File toccati:** `backend/server.js`

---

## Commit 5 — `feat(nav): routing + tab Analisi/Esplora/Carica dati`

Refactor strutturale: l'app passa da single-page a multi-route per ospitare le nuove sezioni.

- `react-router-dom` (già in dipendenze) è ora attivo.
- `frontend/src/main.tsx` — wrappa l'app in `<BrowserRouter>`.
- `frontend/src/App.tsx` — definisce le route. Se non c'è token, qualsiasi path → `LoginPage`. Se autenticato, il layout monta `AppLayout` con `<Outlet />`.
- `frontend/src/components/AppLayout.tsx` (nuovo) — header con logo + nav tabs (`NavLink`) + bottone logout. Layout responsive uguale al precedente, con tab persistenti.
- `frontend/src/pages/AnalisiPage.tsx` (nuovo, contenuto del vecchio `MainPage`) — solo la card form + risultato, senza header (ora nel layout).
- `frontend/src/components/MainPage.tsx` — **eliminato**.

---

## Commit 6 — `feat(ingest): pagina caricamento dati`

Nuova sezione `/ingest` con 5 card form, una per endpoint:

| Endpoint                             | Form                                          |
|--------------------------------------|-----------------------------------------------|
| `POST /api/ingest/posts`             | JSON post + ZIP opzionale immagini            |
| `POST /api/ingest/visual-analysis`   | JSON analisi MLLM                             |
| `POST /api/ingest/datappeal`         | select segmento + ZIP CSV                     |
| `POST /api/ingest/pat/posts`         | input `pat_name` + JSON post + ZIP opzionale  |
| `POST /api/ingest/pat/description`   | JSON descrizioni MLLM                         |

Ogni card mostra: bottone "Carica" con spinner durante l'upload, badge verde a successo con JSON di summary collapsabile, badge rosso con messaggio d'errore in caso di fallimento.

**File toccati:**
- `frontend/src/api/ingest.ts` (nuovo) — wrapper `postMultipart` riusabile.
- `frontend/src/pages/IngestPage.tsx` (nuovo).
- `backend/server.js` — mock dei 5 endpoint che ritornano una `IngestResponse` plausibile (non parsano il body, vedi `docs/proposed_explore_endpoints.md`).

---

## Commit 7 — `feat(esplora): griglia/lista post + mappa POI`

Nuova sezione `/esplora` con 2 sotto-tab:

**Post Instagram** — griglia o lista, search debounced (300ms) su caption/username/hashtag, contatore "X di Y post".

**POI Datappeal** — filtro per segmento (luxury/traditional/tutti), toggle Mappa/Lista. La mappa usa `react-leaflet` + OpenStreetMap, centrata sulla media delle coordinate, con popup per ogni POI (nome, città, segmento, categoria, sentiment).

**Dipendenze aggiunte:** `leaflet`, `react-leaflet`, `@types/leaflet`.

**File toccati:**
- `frontend/src/api/explore.ts` (nuovo) — client per `GET /api/posts` e `GET /api/poi`.
- `frontend/src/pages/EsploraPage.tsx` (nuovo).
- `backend/server.js` — mock `GET /api/posts` (filtra/pagina i `MOCK_POSTS` aggiungendo `thumbnail_url`, lat/lng fake) e `GET /api/poi` (12 POI hardcoded in Sardegna, divisi tra luxury e traditional).

**Importante:** `GET /api/posts` e `GET /api/poi` **non esistono nello swagger reale**. La spec proposta per il team backend è in `docs/proposed_explore_endpoints.md`.

---

## Commit 8 — `docs: spec endpoint esplora + changelog sessione`

Aggiunge i due documenti:
- `docs/proposed_explore_endpoints.md` — spec dettagliata di `GET /api/posts`, `GET /api/poi` e nota sull'URL fittizio dell'InVideo mock.
- `docs/CHANGELOG_session.md` — questo file.
