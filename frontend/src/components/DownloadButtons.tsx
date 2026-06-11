import { useState } from 'react'
import { Download, FileText, FileType, File, AlertCircle } from 'lucide-react'
import { downloadMarkdown, downloadFromApi } from '../utils/download'
import { useAuth } from '../context/AuthContext'

interface Props {
  content: string
  mode: 'report' | 'video'
  pipelineId?: string
}

export default function DownloadButtons({ content, mode, pipelineId }: Props) {
  const { token } = useAuth()
  const [loading, setLoading] = useState<'docx' | 'pdf' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const filename = `modametrics_${mode}_${pipelineId ?? Date.now()}`

  const handleApiDownload = async (format: 'docx' | 'pdf') => {
    if (!pipelineId || !token) {
      setError('Pipeline ID o autenticazione mancanti')
      return
    }
    setLoading(format)
    setError(null)
    try {
      await downloadFromApi(pipelineId, format, filename, token)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante il download')
    } finally {
      setLoading(null)
    }
  }

  const apiDisabled = !pipelineId

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-stone-500 font-medium flex items-center gap-1">
          <Download className="w-4 h-4" /> Scarica:
        </span>

        <button
          onClick={() => downloadMarkdown(content, filename)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-stone-300 hover:border-brand-400 hover:text-brand-700 transition bg-white"
        >
          <File className="w-3.5 h-3.5" /> .md
        </button>

        <button
          onClick={() => handleApiDownload('docx')}
          disabled={apiDisabled || loading !== null}
          title={apiDisabled ? 'Pipeline ID non disponibile' : undefined}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-stone-300 hover:border-brand-400 hover:text-brand-700 transition bg-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileText className="w-3.5 h-3.5" />
          {loading === 'docx' ? 'Generazione…' : '.docx'}
        </button>

        <button
          onClick={() => handleApiDownload('pdf')}
          disabled={apiDisabled || loading !== null}
          title={apiDisabled ? 'Pipeline ID non disponibile' : undefined}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-stone-300 hover:border-brand-400 hover:text-brand-700 transition bg-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileType className="w-3.5 h-3.5" />
          {loading === 'pdf' ? 'Generazione…' : '.pdf'}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-600">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </div>
      )}
    </div>
  )
}
