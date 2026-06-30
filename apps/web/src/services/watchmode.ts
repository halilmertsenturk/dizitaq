import { getCached, setCache, CACHE_TTL } from './cache'
import type {
  WatchmodeSearchResponse,
  WatchmodeTitle,
  WatchmodeSource,
  WatchmodeEpisode,
  WatchmodeDetailResponse,
  TitleFilters,
} from '@dizitaq/shared'

const BASE_URL = 'https://api.watchmode.com/v1'
const API_KEY = process.env.WATCHMODE_API_KEY

class WatchmodeAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public endpoint?: string
  ) {
    super(message)
    this.name = 'WatchmodeAPIError'
  }
}

async function fetchFromWatchmode<T>(
  endpoint: string,
  params: Record<string, string | number | undefined> = {},
  cachePrefix?: string,
  cacheTTL?: number
): Promise<T> {
  const query = new URLSearchParams()
  query.set('apiKey', API_KEY ?? '')

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      query.set(key, String(value))
    }
  }

  const url = `${BASE_URL}${endpoint}?${query.toString()}`

  // Try cache first
  if (cachePrefix) {
    const cacheKey = endpoint + '?' + query.toString()
    const cached = await getCached<T>(cachePrefix, cacheKey)
    if (cached) return cached
  }

  if (!API_KEY) {
    throw new WatchmodeAPIError(
      'WATCHMODE_API_KEY is not configured',
      500,
      endpoint
    )
  }

  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    next: { revalidate: cacheTTL ?? 86400 },
  })

  if (!response.ok) {
    throw new WatchmodeAPIError(
      `Watchmode API error: ${response.statusText}`,
      response.status,
      endpoint
    )
  }

  const data: T = await response.json()

  // Cache the response
  if (cachePrefix) {
    const cacheKey = endpoint + '?' + query.toString()
    await setCache(cachePrefix, cacheKey, data, cacheTTL)
  }

  return data
}

export async function searchTitles(
  filters: TitleFilters
): Promise<WatchmodeSearchResponse> {
  const params: Record<string, string | number | undefined> = {
    search_field: 'name',
    search_value: filters.query,
    genres: filters.genre,
    year: filters.year,
    type: filters.type === 'both' ? undefined : filters.type,
    'min-rating': filters['min-rating'],
    page: filters.page ?? 1,
    limit: filters.limit ?? 20,
  }

  return fetchFromWatchmode<WatchmodeSearchResponse>(
    '/search',
    params,
    'search',
    CACHE_TTL.SEARCH
  )
}

export async function getTrending(
  page: number = 1,
  limit: number = 20,
  type?: 'movie' | 'series'
): Promise<WatchmodeSearchResponse> {
  const params: Record<string, string | number | undefined> = {
    page,
    limit,
    type,
    sort_by: 'popularity_desc',
  }

  return fetchFromWatchmode<WatchmodeSearchResponse>(
    '/search',
    params,
    `trending${type ? `:${type}` : ''}`,
    CACHE_TTL.TRENDING
  )
}

export async function getTitleDetails(
  id: number
): Promise<WatchmodeTitle> {
  return fetchFromWatchmode<WatchmodeTitle>(
    `/title/${id}/details`,
    {},
    'details',
    CACHE_TTL.DETAILS
  )
}

export async function getTitleSources(
  id: number
): Promise<WatchmodeSource[]> {
  return fetchFromWatchmode<WatchmodeSource[]>(
    `/title/${id}/sources`,
    {},
    'sources',
    CACHE_TTL.SOURCES
  )
}

export async function getTitleEpisodes(
  id: number
): Promise<WatchmodeEpisode[]> {
  return fetchFromWatchmode<WatchmodeEpisode[]>(
    `/title/${id}/episodes`,
    {},
    'episodes',
    CACHE_TTL.EPISODES
  )
}

export async function getFullTitleDetails(
  id: number
): Promise<WatchmodeDetailResponse> {
  const [details, sources, episodesRaw] = await Promise.all([
    getTitleDetails(id),
    getTitleSources(id),
    getTitleEpisodes(id).catch(() => []),
  ])

  // Group episodes by season
  const seasonMap = new Map<number, WatchmodeEpisode[]>()
  for (const ep of episodesRaw) {
    const existing = seasonMap.get(ep.season_num) ?? []
    existing.push(ep)
    seasonMap.set(ep.season_num, existing)
  }

  const seasons = Array.from(seasonMap.entries())
    .map(([seasonNumber, episodes]) => ({
      season_number: seasonNumber,
      episodes: episodes.sort((a, b) => a.ep_num - b.ep_num),
    }))
    .sort((a, b) => a.season_number - b.season_number)

  return {
    ...details,
    sources,
    seasons,
  }
}

export { WatchmodeAPIError }
