import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Clock, Database, Coins, Video } from 'lucide-react'
import type { PipelineResponse } from '../api/types'
import DownloadButtons from './DownloadButtons'
import InVideoButton from './InVideoButton'

interface Props {
  response: PipelineResponse
}

export default function ResultPanel({ response }: Props) {
  const isReport = response.mode === 'report'

  return (
    <div className="space-y-4">
      {/* Meta info */}
      <div className="flex flex-wrap gap-4 text-xs text-stone-500">
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {(response.duration_ms / 1000).toFixed(1)}s
        </span>
        <span className="flex items-center gap-1">
          <Coins className="w-3.5 h-3.5" />
          {response.tokens_used.toLocaleString()} token
        </span>
        <span className="flex items-center gap-1">
          <Database className="w-3.5 h-3.5" />
          {response.raw_data.length} post recuperati
        </span>
        <span className="font-mono bg-stone-100 px-2 py-0.5 rounded text-stone-500">
          {response.mongo_query.collection}
        </span>
      </div>

      {/* Result content */}
      {isReport ? (
        <div className="bg-white border border-stone-200 rounded-xl p-6">
          <div className="prose prose-stone prose-sm max-w-none prose-headings:font-semibold prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-a:text-brand-600">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {response.result}
            </ReactMarkdown>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-stone-600 font-medium text-sm">
            <Video className="w-4 h-4 text-brand-500" />
            Prompt per la generazione video
          </div>
          <div className="prose prose-stone prose-sm max-w-none prose-headings:font-semibold prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-a:text-brand-600 bg-stone-50 border border-stone-200 rounded-lg p-4">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {response.result}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* InVideo (only for video mode) */}
      {!isReport && <InVideoButton pipelineId={response.pipeline_id} prompt={response.result} />}

      {/* Download */}
      <div className="pt-1">
        <DownloadButtons
          content={response.result}
          mode={response.mode}
          pipelineId={response.pipeline_id}
        />
      </div>
    </div>
  )
}
