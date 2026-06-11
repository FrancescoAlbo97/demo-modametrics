import { useState } from 'react'
import { Upload, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  ingestPosts,
  ingestVisualAnalysis,
  ingestDatappeal,
  ingestPatPosts,
  ingestPatDescription,
} from '../api/ingest'

type FormKey = 'posts' | 'visual' | 'datappeal' | 'pat_posts' | 'pat_desc'

interface FormState {
  loading: boolean
  result: unknown | null
  error: string | null
}

const initialState: FormState = { loading: false, result: null, error: null }

export default function IngestPage() {
  const { token } = useAuth()
  const [state, setState] = useState<Record<FormKey, FormState>>({
    posts: initialState,
    visual: initialState,
    datappeal: initialState,
    pat_posts: initialState,
    pat_desc: initialState,
  })

  const wrap = async (key: FormKey, fn: () => Promise<unknown>) => {
    setState((s) => ({ ...s, [key]: { loading: true, result: null, error: null } }))
    try {
      const result = await fn()
      setState((s) => ({ ...s, [key]: { loading: false, result, error: null } }))
    } catch (err) {
      setState((s) => ({
        ...s,
        [key]: {
          loading: false,
          result: null,
          error: err instanceof Error ? err.message : 'Errore sconosciuto',
        },
      }))
    }
  }

  if (!token) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-stone-800">Carica dati</h1>
        <p className="text-sm text-stone-500 mt-1">
          Carica nuovi dati Instagram, analisi MLLM e dataset Datappeal nelle relative collezioni.
        </p>
      </div>

      <IngestCard
        title="Post Instagram"
        description="JSON con array di post + ZIP opzionale di immagini (jpg/jpeg/png/webp)."
        state={state.posts}
        onSubmit={(form) =>
          wrap('posts', () => {
            const jsonFile = (form.elements.namedItem('json_file') as HTMLInputElement).files?.[0]
            const imagesZip = (form.elements.namedItem('images_zip') as HTMLInputElement).files?.[0]
            if (!jsonFile) throw new Error('json_file obbligatorio')
            return ingestPosts(jsonFile, imagesZip, token)
          })
        }
      >
        <FileField name="json_file" label="JSON post" accept="application/json,.json" required />
        <FileField name="images_zip" label="ZIP immagini (opzionale)" accept=".zip" />
      </IngestCard>

      <IngestCard
        title="Analisi visiva MLLM"
        description="visual_analysis_clean.json prodotto dal pipeline MLLM."
        state={state.visual}
        onSubmit={(form) =>
          wrap('visual', () => {
            const jsonFile = (form.elements.namedItem('json_file') as HTMLInputElement).files?.[0]
            if (!jsonFile) throw new Error('json_file obbligatorio')
            return ingestVisualAnalysis(jsonFile, token)
          })
        }
      >
        <FileField name="json_file" label="visual_analysis_clean.json" accept="application/json,.json" required />
      </IngestCard>

      <IngestCard
        title="Datappeal POI"
        description="ZIP con i 5 CSV Datappeal + identificatore di segmento."
        state={state.datappeal}
        onSubmit={(form) =>
          wrap('datappeal', () => {
            const segment = (form.elements.namedItem('segment') as HTMLSelectElement).value
            const csvZip = (form.elements.namedItem('csv_zip') as HTMLInputElement).files?.[0]
            if (!csvZip) throw new Error('csv_zip obbligatorio')
            return ingestDatappeal(segment, csvZip, token)
          })
        }
      >
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">Segmento</label>
          <select
            name="segment"
            required
            className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="luxury">luxury</option>
            <option value="traditional">traditional</option>
          </select>
        </div>
        <FileField name="csv_zip" label="ZIP con i 5 CSV Datappeal" accept=".zip" required />
      </IngestCard>

      <IngestCard
        title="PAT — Post Instagram"
        description="JSON post + ZIP opzionale immagini, associati a un PAT specifico."
        state={state.pat_posts}
        onSubmit={(form) =>
          wrap('pat_posts', () => {
            const patName = (form.elements.namedItem('pat_name') as HTMLInputElement).value
            const jsonFile = (form.elements.namedItem('json_file') as HTMLInputElement).files?.[0]
            const imagesZip = (form.elements.namedItem('images_zip') as HTMLInputElement).files?.[0]
            if (!patName) throw new Error('pat_name obbligatorio')
            if (!jsonFile) throw new Error('json_file obbligatorio')
            return ingestPatPosts(patName, jsonFile, imagesZip, token)
          })
        }
      >
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">Nome PAT</label>
          <input
            name="pat_name"
            type="text"
            required
            placeholder="es. anice_di_castignano"
            className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <FileField name="json_file" label="JSON post PAT" accept="application/json,.json" required />
        <FileField name="images_zip" label="ZIP immagini (opzionale)" accept=".zip" />
      </IngestCard>

      <IngestCard
        title="PAT — Descrizioni MLLM"
        description="analysis_normalized.json con descrizioni testuali per immagini PAT."
        state={state.pat_desc}
        onSubmit={(form) =>
          wrap('pat_desc', () => {
            const jsonFile = (form.elements.namedItem('json_file') as HTMLInputElement).files?.[0]
            if (!jsonFile) throw new Error('json_file obbligatorio')
            return ingestPatDescription(jsonFile, token)
          })
        }
      >
        <FileField name="json_file" label="analysis_normalized.json" accept="application/json,.json" required />
      </IngestCard>
    </div>
  )
}

function FileField({
  name,
  label,
  accept,
  required,
}: {
  name: string
  label: string
  accept?: string
  required?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-stone-500 mb-1">{label}</label>
      <input
        name={name}
        type="file"
        accept={accept}
        required={required}
        className="block w-full text-sm text-stone-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer"
      />
    </div>
  )
}

interface CardProps {
  title: string
  description: string
  state: FormState
  onSubmit: (form: HTMLFormElement) => void
  children: React.ReactNode
}

function IngestCard({ title, description, state, onSubmit, children }: CardProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(e.currentTarget)
      }}
      className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 space-y-4"
    >
      <div>
        <h2 className="font-semibold text-stone-800 text-sm">{title}</h2>
        <p className="text-xs text-stone-500 mt-0.5">{description}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>

      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="submit"
          disabled={state.loading}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-4 py-2 rounded-lg transition text-sm"
        >
          {state.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {state.loading ? 'Caricamento…' : 'Carica'}
        </button>

        {state.result != null && !state.error && (
          <div className="flex items-center gap-1.5 text-xs text-green-700">
            <CheckCircle2 className="w-4 h-4" />
            Upload completato
          </div>
        )}
        {state.error && (
          <div className="flex items-center gap-1.5 text-xs text-red-600">
            <AlertCircle className="w-4 h-4" />
            {state.error}
          </div>
        )}
      </div>

      {state.result != null && !state.error && (
        <pre className="bg-stone-50 border border-stone-200 rounded-lg p-3 text-xs text-stone-700 overflow-auto max-h-64">
          {JSON.stringify(state.result, null, 2)}
        </pre>
      )}
    </form>
  )
}
