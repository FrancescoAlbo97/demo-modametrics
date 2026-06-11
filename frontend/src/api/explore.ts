const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export interface PostListItem {
  post_id: string
  ownerUsername: string
  caption?: string
  likesCount: number
  commentsCount: number
  timestamp: string
  type?: string
  hashtags?: string[]
  thumbnail_url?: string
  latitude?: number | null
  longitude?: number | null
  locationName?: string | null
}

export interface PostListResponse {
  items: PostListItem[]
  total: number
  skip: number
  limit: number
}

export interface PoiItem {
  poi_id: string
  name: string
  segment: 'luxury' | 'traditional'
  latitude: number
  longitude: number
  city?: string
  province?: string
  category?: string
  sentiment_avg?: number | null
}

export interface PoiListResponse {
  items: PoiItem[]
  total: number
}

async function get<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    let message = `Errore ${res.status}`
    try {
      const err = await res.json()
      if (err.detail) message = err.detail
    } catch {}
    throw new Error(message)
  }
  return res.json() as Promise<T>
}

export function listPosts(
  params: { skip?: number; limit?: number; q?: string },
  token: string,
): Promise<PostListResponse> {
  const qs = new URLSearchParams()
  if (params.skip != null) qs.set('skip', String(params.skip))
  if (params.limit != null) qs.set('limit', String(params.limit))
  if (params.q) qs.set('q', params.q)
  const suffix = qs.toString() ? `?${qs.toString()}` : ''
  return get<PostListResponse>(`/api/posts${suffix}`, token)
}

export function listPoi(
  params: { segment?: 'luxury' | 'traditional' },
  token: string,
): Promise<PoiListResponse> {
  const qs = new URLSearchParams()
  if (params.segment) qs.set('segment', params.segment)
  const suffix = qs.toString() ? `?${qs.toString()}` : ''
  return get<PoiListResponse>(`/api/poi${suffix}`, token)
}
