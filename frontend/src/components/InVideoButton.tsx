import { useState } from 'react'
import { Film, ExternalLink, AlertCircle, Check } from 'lucide-react'
import { createInVideoLink } from '../api/pipeline'
import { useAuth } from '../context/AuthContext'
import type { InVideoRequest } from '../api/types'

interface Props {
  pipelineId?: string
  prompt: string
}

const PLATFORMS: InVideoRequest['platform'][] = ['youtube', 'instagram', 'tiktok', 'facebook']

export default function InVideoButton({ pipelineId, prompt }: Props) {
  const { token } = useAuth()
  const [platform, setPlatform] = useState<NonNullable<InVideoRequest['platform']>>('youtube')
  const [vibe, setVibe] = useState('cinematic, emotional, professional')
  const [audience, setAudience] = useState('general audience')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const disabled = !pipelineId || !token

  const handleClick = async () => {
    if (!pipelineId || !token) {
      setError('Pipeline ID o autenticazione mancanti')
      return
    }
    setLoading(true)
    setError(null)
    setCopied(false)
    try {
      const fullPrompt = `${prompt}\n\nVibe: ${vibe}\nTarget audience: ${audience}\nPlatform: ${platform}`
      try {
        await navigator.clipboard.writeText(fullPrompt)
        setCopied(true)
        setTimeout(() => setCopied(false), 4000)
      } catch {
        // clipboard può fallire se non c'è permesso o contesto non sicuro — ignoriamo
      }

      const { invideo_url } = await createInVideoLink(
        pipelineId,
        { vibe, target_audience: audience, platform },
        token,
      )
      window.open(invideo_url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore InVideo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2 text-stone-700 font-medium text-sm">
        <Film className="w-4 h-4 text-brand-500" />
        Genera video con InVideo
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">Piattaforma</label>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as NonNullable<InVideoRequest['platform']>)}
            disabled={loading}
            className="w-full px-2 py-1.5 border border-stone-300 rounded-md text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
          >
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">Vibe</label>
          <input
            type="text"
            value={vibe}
            onChange={(e) => setVibe(e.target.value)}
            disabled={loading}
            className="w-full px-2 py-1.5 border border-stone-300 rounded-md text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">Target audience</label>
          <input
            type="text"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            disabled={loading}
            className="w-full px-2 py-1.5 border border-stone-300 rounded-md text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
          />
        </div>
      </div>

      <div>
        <button
          onClick={handleClick}
          disabled={disabled || loading}
          title={disabled ? 'Pipeline ID non disponibile' : undefined}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-4 py-2 rounded-lg transition text-xs"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          {loading ? 'Generazione link…' : 'Apri su InVideo'}
        </button>
      </div>

      {copied && (
        <div className="flex items-center gap-1.5 text-xs text-green-700">
          <Check className="w-3.5 h-3.5" />
          Prompt copiato negli appunti — incollalo nella casella di InVideo
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-600">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </div>
      )}
    </div>
  )
}
