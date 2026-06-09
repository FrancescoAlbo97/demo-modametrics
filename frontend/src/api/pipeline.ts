import type { PipelineRequest, PipelineResponse } from './types'
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
