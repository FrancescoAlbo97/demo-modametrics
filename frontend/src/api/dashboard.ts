const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export type SocialCollection = 'instagram_posts' | 'pat_posts'
export type PoiSegment = 'luxury' | 'traditional'

export interface SocialKpis {
  total_posts: number
  total_likes: number
  total_comments: number
  avg_likes: number
  avg_comments: number
  max_likes: number
  max_comments: number
  unique_accounts: number
  unique_locations: number
}

export interface TimelineEntry {
  date: string
  posts: number
  likes: number
  comments: number
}

export interface HashtagEntry {
  hashtag: string
  count: number
}

export interface AccountEntry {
  username: string
  posts: number
  total_likes: number
  total_comments: number
}

export interface LocationEntry {
  location: string
  count: number
}

export interface PostTypeEntry {
  type: string
  count: number
}

export interface VisualContentEntry {
  label: string
  image_count: number
}

export interface PatEntry {
  pat_name: string
  count: number
  total_likes: number
}

export interface SocialDashboardResponse {
  collection: string
  no_data: boolean
  kpis: SocialKpis
  timeline: TimelineEntry[]
  top_hashtags: HashtagEntry[]
  top_accounts: AccountEntry[]
  top_locations: LocationEntry[]
  post_types: PostTypeEntry[]
  visual_content: VisualContentEntry[]
  by_pat: PatEntry[]
}

export interface PoiKpis {
  total_poi: number
  avg_sentiment: number
  min_sentiment: number
  max_sentiment: number
  avg_stars: number
  avg_rooms: number
  avg_price_class: number
}

export interface SegmentEntry {
  segment: string
  count: number
  avg_sentiment: number
  avg_stars: number
  avg_price_class: number
}

export interface CategoryEntry {
  category: string
  count: number
  avg_sentiment: number
}

export interface CityEntry {
  city: string
  count: number
  avg_sentiment: number
}

export interface IndustryEntry {
  industry: string
  count: number
}

export interface StarsEntry {
  stars: number
  count: number
}

export interface PriceClassEntry {
  price_class: number
  count: number
}

export interface SentimentBucketEntry {
  range: string
  count: number
}

export interface PriceTrendEntry {
  date: string
  avg_median_price: number
  avg_min_price: number
  avg_max_price: number
  total_offers: number
}

export interface OccupancyTrendEntry {
  date: string
  avg_occupancy_rate: number
}

export interface PopularityTrendEntry {
  date: string
  avg_popularity: number
}

export interface SentimentTrendEntry {
  date: string
  avg_sentiment: number
  total_reviews: number
}

export interface PoiDashboardResponse {
  collection: string
  no_data: boolean
  kpis: PoiKpis
  by_segment: SegmentEntry[]
  by_category: CategoryEntry[]
  by_city: CityEntry[]
  by_industry: IndustryEntry[]
  stars_distribution: StarsEntry[]
  price_class_distribution: PriceClassEntry[]
  sentiment_distribution: SentimentBucketEntry[]
  price_trend: PriceTrendEntry[]
  occupancy_trend: OccupancyTrendEntry[]
  popularity_trend: PopularityTrendEntry[]
  sentiment_trend: SentimentTrendEntry[]
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
    const e = new Error(message) as Error & { status?: number }
    e.status = res.status
    throw e
  }
  return res.json() as Promise<T>
}

export function getSocialDashboard(
  params: { collection?: SocialCollection; from_date?: string; to_date?: string },
  token: string,
): Promise<SocialDashboardResponse> {
  const qs = new URLSearchParams()
  if (params.collection) qs.set('collection', params.collection)
  if (params.from_date) qs.set('from_date', params.from_date)
  if (params.to_date) qs.set('to_date', params.to_date)
  const suffix = qs.toString() ? `?${qs.toString()}` : ''
  return get<SocialDashboardResponse>(`/api/dashboard/social${suffix}`, token)
}

export function getPoiDashboard(
  params: { segment?: PoiSegment },
  token: string,
): Promise<PoiDashboardResponse> {
  const qs = new URLSearchParams()
  if (params.segment) qs.set('segment', params.segment)
  const suffix = qs.toString() ? `?${qs.toString()}` : ''
  return get<PoiDashboardResponse>(`/api/dashboard/poi${suffix}`, token)
}

export function getPipelineSocialDashboard(
  pipelineId: string,
  token: string,
): Promise<SocialDashboardResponse> {
  return get<SocialDashboardResponse>(`/api/pipeline/${pipelineId}/dashboard/social`, token)
}

export function getPipelinePoiDashboard(
  pipelineId: string,
  token: string,
): Promise<PoiDashboardResponse> {
  return get<PoiDashboardResponse>(`/api/pipeline/${pipelineId}/dashboard/poi`, token)
}
