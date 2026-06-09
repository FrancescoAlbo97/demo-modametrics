# ModaMetrics — Demo Chat

Interfaccia web per l'analisi di post Instagram relativi al turismo di lusso in Sardegna.
L'utente inserisce una richiesta in linguaggio naturale; il sistema la traduce in una query MongoDB, recupera i post rilevanti e genera tramite LLM un **report analitico** o un **video prompt** scaricabile.

---

## Struttura del repository

```
demo-chat/
├── frontend/          # App React + TypeScript + Tailwind (Vite)
│   ├── src/
│   ├── Dockerfile     # Build multi-stage Node → nginx
│   └── package.json
├── backend/           # Mock server Express (JWT auth + pipeline)
│   ├── server.js
│   └── Dockerfile     # Node 22 alpine
├── docs/              # Specifiche API (Swagger/OpenAPI)
│   └── swagger_api_gateway_auth.json
├── docker-compose.yml # Orchestrazione completa (frontend + backend + MongoDB)
├── .gitignore
└── README.md
```

---

## Prerequisiti

- [Node.js](https://nodejs.org/) ≥ 20
- [Docker](https://www.docker.com/)

---

## Sviluppo locale

### 1. Installa le dipendenze

```bash
# Frontend
cd frontend
npm install

# Backend (mock server)
cd ../backend
npm install
```

### 2. Configura le variabili d'ambiente

Crea `frontend/.env.local` (già nel `.gitignore`):

```env
VITE_API_BASE_URL=http://localhost:8999
```

> Se `VITE_API_BASE_URL` è vuoto, le chiamate usano percorsi relativi (utile con un reverse proxy).

### 3. Avvia l'app

```bash
cd frontend
npm run dev
```

Questo comando avvia in parallelo:
- **Vite** su `http://localhost:9000` — app React
- **Mock server** su `http://localhost:8999` — API Express con JWT

### Credenziali mock

| Campo    | Valore     |
|----------|------------|
| Username | qualsiasi  |
| Password | `password` |

Il token JWT è valido 60 minuti. Tutte le chiamate al pipeline lo inviano automaticamente come `Authorization: Bearer <token>`.

---

## Docker

Ogni servizio ha il proprio `Dockerfile`. Il `docker-compose.yml` in root li orchestra tutti insieme.

### Avvio completo (frontend + backend + MongoDB)

```bash
docker compose up --build
```

`VITE_API_BASE_URL` ha come default `http://localhost:8999` (backend esposto sull'host). Per puntare a un API gateway reale:

```bash
VITE_API_BASE_URL=http://<host>:<porta> docker compose up --build
```

> **Nota:** `VITE_API_BASE_URL` viene incorporato nel bundle al momento della build. Qualsiasi modifica richiede `--build`.

| Servizio  | URL                       |
|-----------|---------------------------|
| Frontend  | http://localhost:3000     |
| Backend   | http://localhost:8999     |
| MongoDB   | mongodb://localhost:27017 |

### Build separata delle immagini

```bash
# Frontend
docker build \
  --build-arg VITE_API_BASE_URL=http://localhost:8999 \
  -t modametrics-frontend \
  ./frontend

# Backend
docker build -t modametrics-backend ./backend
```

---

## API

Il frontend comunica esclusivamente con l'**API Gateway**. La specifica completa è in [`docs/swagger_api_gateway_auth.json`](docs/swagger_api_gateway_auth.json).

| Metodo | Endpoint            | Auth     | Descrizione                        |
|--------|---------------------|----------|------------------------------------|
| POST   | `/api/auth/login`   | —        | Login → JWT Bearer token           |
| POST   | `/api/pipeline`     | Bearer   | Pipeline NL → MongoDB → LLM       |
| GET    | `/api/pipeline/:id` | Bearer   | Recupera risultato precedente      |
| GET    | `/health`           | —        | Stato dei servizi                  |
