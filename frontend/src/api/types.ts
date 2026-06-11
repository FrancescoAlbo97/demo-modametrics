export interface PipelineRequest {
  user_input: string
  mode: 'report' | 'video'
  collection_hint?: string | null
  context?: string | null
}

export interface MongoQueryResult {
  collection: string
  filter: Record<string, unknown>
  projection?: Record<string, unknown> | null
  sort?: Record<string, unknown> | null
  limit?: number | null
}

export interface PipelineResponse {
  pipeline_id?: string
  mode: 'report' | 'video'
  mongo_query: MongoQueryResult
  raw_data: Record<string, unknown>[]
  result: string
  tokens_used: number
  duration_ms: number
}

export interface ErrorDetail {
  detail: string
}

export interface InVideoRequest {
  vibe?: string
  target_audience?: string
  platform?: 'youtube' | 'instagram' | 'tiktok' | 'facebook'
}

export interface InVideoResponse {
  invideo_url: string
  platform: string
}
