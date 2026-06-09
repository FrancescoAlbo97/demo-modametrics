import { useState } from 'react'
import { Download, FileText, FileType, File } from 'lucide-react'
import { downloadMarkdown, downloadDocx, downloadPdf } from '../utils/download'

interface Props {
  content: string
  mode: 'report' | 'video'
  pipelineId?: string
}

export default function DownloadButtons({ content, mode, pipelineId }: Props) {
  const [loadingDocx, setLoadingDocx] = useState(false)
  const filename = `modametrics_${mode}_${pipelineId ?? Date.now()}`

  const handleDocx = async () => {
    setLoadingDocx(true)
    try {
      await downloadDocx(content, filename)
    } finally {
      setLoadingDocx(false)
    }
  }

  return (
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
        onClick={handleDocx}
        disabled={loadingDocx}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-stone-300 hover:border-brand-400 hover:text-brand-700 transition bg-white disabled:opacity-50"
      >
        <FileText className="w-3.5 h-3.5" />
        {loadingDocx ? 'Generazione…' : '.docx'}
      </button>

      <button
        onClick={() => downloadPdf(content, filename)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-stone-300 hover:border-brand-400 hover:text-brand-700 transition bg-white"
      >
        <FileType className="w-3.5 h-3.5" /> .pdf
      </button>
    </div>
  )
}
