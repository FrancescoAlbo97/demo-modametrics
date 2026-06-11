import type {
  PipelineRequest,
  PipelineResponse,
  InVideoRequest,
  InVideoResponse,
} from './types'
import { mockRunPipeline } from './mock'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export async function runPipeline(
  request: PipelineRequest,
  token: string,
): Promise<PipelineResponse> {
  if (USE_MOCK) return mockRunPipeline(request)

  const res = await fetch(`${BASE_URL}/api/pipeline`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  })

  if (!res.ok) {
    let message = `Errore ${res.status}`
    try {
      const err = await res.json()
      if (err.detail) message = err.detail
    } catch {}
    throw new Error(message)
  }

  return res.json() as Promise<PipelineResponse>
}

export async function exportPipeline(
  pipelineId: string,
  format: 'docx' | 'pdf',
  token: string,
): Promise<Blob> {
  const res = await fetch(
    `${BASE_URL}/api/pipeline/${encodeURIComponent(pipelineId)}/export?format=${format}`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    },
  )

  if (!res.ok) {
    let message = `Errore ${res.status}`
    try {
      const err = await res.json()
      if (err.detail) message = err.detail
    } catch {}
    throw new Error(message)
  }

  return res.blob()
}

export async function createInVideoLink(
  pipelineId: string,
  request: InVideoRequest,
  token: string,
): Promise<InVideoResponse> {
  const res = await fetch(
    `${BASE_URL}/api/pipeline/${encodeURIComponent(pipelineId)}/invideo`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    },
  )

  if (!res.ok) {
    let message = `Errore ${res.status}`
    try {
      const err = await res.json()
      if (err.detail) message = err.detail
    } catch {}
    throw new Error(message)
  }

  return res.json() as Promise<InVideoResponse>
}
