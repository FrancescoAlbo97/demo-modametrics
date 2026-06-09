import { FileText, Video } from 'lucide-react'

interface Props {
  mode: 'report' | 'video'
  onChange: (mode: 'report' | 'video') => void
  disabled?: boolean
}

export default function ModeToggle({ mode, onChange, disabled }: Props) {
  return (
    <div className="inline-flex rounded-lg border border-stone-200 bg-stone-100 p-1 gap-1">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('report')}
        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${
          mode === 'report'
            ? 'bg-white shadow text-brand-700 border border-stone-200'
            : 'text-stone-500 hover:text-stone-700'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <FileText className="w-4 h-4" />
        Report
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('video')}
        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${
          mode === 'video'
            ? 'bg-white shadow text-brand-700 border border-stone-200'
            : 'text-stone-500 hover:text-stone-700'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <Video className="w-4 h-4" />
        Video
      </button>
    </div>
  )
}
