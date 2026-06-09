# Frontend — Documentazione tecnica

App React per l'interfaccia utente di ModaMetrics. Permette di inviare richieste in linguaggio naturale alla pipeline NL→MongoDB→LLM e visualizzare/scaricare il risultato.

---

## Stack

| Tecnologia | Versione | Ruolo |
|---|---|---|
| React | 19 | UI framework |
| TypeScript | 5.8 | Type safety |
| Vite | 6 | Dev server e bundler |
| Tailwind CSS | 3 | Styling |
| `@tailwindcss/typography` | 0.5 | Rendering Markdown (classe `prose`) |
| `react-markdown` + `remark-gfm` | 9 / 4 | Parsing Markdown nel report |
| `lucide-react` | — | Icone SVG |
| `docx` | 9 | Generazione `.docx` lato client |
| `jsPDF` | 2.5 | Generazione `.pdf` lato client |

---

## Struttura dei file

```
src/
├── api/
│   ├── types.ts          # Tipi TypeScript allineati allo Swagger
│   ├── pipeline.ts       # Chiamata POST /api/pipeline
│   └── mock.ts           # Dati mock in-memory (VITE_USE_MOCK=true)
├── context/
│   └── AuthContext.tsx   # Stato JWT: login, logout, token in sessionStorage
├── components/
│   ├── LoginPage.tsx     # Form login (username + password)
│   ├── MainPage.tsx      # Pagina principale: form query + risultato
│   ├── ModeToggle.tsx    # Toggle Report / Video
│   ├── ResultPanel.tsx   # Visualizzazione risultato + metadati pipeline
│   ├── DownloadButtons.tsx # Pulsanti download .md / .docx / .pdf
│   └── LoadingSpinner.tsx  # Spinner con step progressivi e progress bar
└── utils/
    └── download.ts       # Logica generazione file (Markdown, DOCX, PDF)
```

---

## Architettura

### Autenticazione

`AuthContext` (`src/context/AuthContext.tsx`) gestisce l'intero ciclo di vita del token:

- Al login chiama `POST /api/auth/login` con `{ username, password }`
- Salva il JWT in `sessionStorage` (chiave `mm_jwt`) — si azzera alla chiusura del tab
- Espone `{ token, login, logout }` tramite React Context
- `App.tsx` usa `token` per decidere se mostrare `LoginPage` o `MainPage`

### Flusso pipeline

```
MainPage (form submit)
  └─ runPipeline(request, token)          # src/api/pipeline.ts
       └─ POST /api/pipeline
            Authorization: Bearer <token>
            Body: { user_input, mode, context? }
  └─ PipelineResponse → ResultPanel
       ├─ metadati (durata, token usati, n° post)
       ├─ report Markdown → ReactMarkdown (mode: report)
       ├─ prompt video → <pre> monospace (mode: video)
       └─ DownloadButtons (.md / .docx / .pdf)
```

### Modalità mock

Se `VITE_USE_MOCK=true`, `pipeline.ts` chiama `mockRunPipeline()` da `mock.ts` invece di fare fetch, simulando un delay di 2.5s e restituendo dati statici. Il login passa comunque per il mock server HTTP reale.

### Download lato client

Tutti i formati sono generati nel browser senza round-trip al server:

| Formato | Libreria | Strategia |
|---|---|---|
| `.md` | nativa | `Blob` + `URL.createObjectURL` |
| `.docx` | `docx` | Parsing riga per riga dei titoli Markdown → `HeadingLevel`, testo normale → `TextRun` |
| `.pdf` | `jsPDF` | Rendering riga per riga con font-size e stile per livello di heading; paginazione automatica |

### Loading state

`LoadingSpinner` mostra 5 step progressivi (uno ogni 6s) con un timer e una progress bar che avanza fino al 95% in 30s (tempo stimato della pipeline reale).

---

## Variabili d'ambiente

Tutti i file `.env*` sono in `.gitignore`. Per sviluppo locale crea `frontend/.env.local`:

| Variabile | Default | Descrizione |
|---|---|---|
| `VITE_API_BASE_URL` | `""` (percorsi relativi) | Base URL dell'API Gateway |
| `VITE_USE_MOCK` | `false` | Se `true`, bypassa le chiamate HTTP per il pipeline |

> `VITE_*` vengono incorporati nel bundle a build time da Vite. Modificarli richiede un rebuild.

---

## Tema Tailwind

Il colore `brand` è una scala di ambra/oro caldo definita in `tailwind.config.js`:

```
brand-500 → #d4842a  (colore principale)
brand-600 → #b86820  (hover, navbar)
brand-700 → #964f1d  (testo attivo toggle)
```

Il font di default è **Inter** con fallback su `system-ui`.

---

## Script disponibili

Eseguiti da `frontend/`:

| Comando | Descrizione |
|---|---|
| `npm run dev` | Avvia Vite (porta 9000) + mock server (porta 8999) in parallelo |
| `npm run build` | Type-check TypeScript + build produzione in `dist/` |
| `npm run preview` | Anteprima della build di produzione |
