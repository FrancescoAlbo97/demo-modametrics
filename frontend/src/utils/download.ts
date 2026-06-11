import { exportPipeline } from '../api/pipeline'

export function downloadMarkdown(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  triggerDownload(blob, `${filename}.md`)
}

export async function downloadFromApi(
  pipelineId: string,
  format: 'docx' | 'pdf',
  filename: string,
  token: string,
) {
  const blob = await exportPipeline(pipelineId, format, token)
  triggerDownload(blob, `${filename}.${format}`)
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
