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

const genreNameToId: Record<string, number> = {}
let genresLoaded = false

async function ensureGenres() {
  if (genresLoaded) return
  const genres = await fetchFromWatchmode<Array<{ id: number; name: string }>>(
    '/genres', {}, 'genres', CACHE_TTL.GENRES
  )
  for (const g of genres) {
    genreNameToId[g.name.toLowerCase()] = g.id
  }
  genresLoaded = true
}

function mapWatchmodeType(type: string): 'movie' | 'series' {
  return (type === 'tv_series' || type === 'tv_miniseries' || type === 'tv_special' || type === 'tv_movie'
    ? 'series'
    : 'movie') as 'movie' | 'series'
}

async function fetchPosterForTitle(id: number): Promise<string | null> {
  try {
    const details = await fetchFromWatchmode<{ poster: string | null }>(
      `/title/${id}/details`,
      {},
      'details',
      CACHE_TTL.DETAILS
    )
    return details.poster ?? null
  } catch {
    return null
  }
}

async function enrichWithPosters(titles: WatchmodeTitle[]): Promise<WatchmodeTitle[]> {
  const posterResults = await Promise.allSettled(
    titles.map(t => fetchPosterForTitle(t.id))
  )
  return titles.map((t, i) => {
    const poster = posterResults[i].status === 'fulfilled' ? posterResults[i].value : null
    return poster ? { ...t, poster } : t
  })
}

function mapTitleResult(t: { id: number; title?: string; name?: string; type: string; year: number | null; imdb_id: string | null; tmdb_id: number | null }): WatchmodeTitle {
  return {
    id: t.id,
    title: t.title ?? t.name ?? '',
    type: mapWatchmodeType(t.type),
    year: t.year,
    poster: null,
    rating: null,
    plot: null,
    genres: [],
    imdb_id: t.imdb_id,
    tmdb_id: t.tmdb_id,
    release_date: null,
    runtime_minutes: null,
    us_rating: null,
    network_names: [],
    trailer: null,
    backdrop: null,
  }
}

export async function searchTitles(
  filters: TitleFilters
): Promise<WatchmodeSearchResponse> {
  const { query, genre, year, type, 'min-rating': minRating, page = 1, limit = 20 } = filters

  if (query) {
    const params: Record<string, string | number | undefined> = {
      search_field: 'name',
      search_value: query,
      types: type && type !== 'both' ? (type === 'series' ? 'tv_series' : 'movie') : undefined,
      page,
      limit,
    }

    const raw = await fetchFromWatchmode<{
      title_results: Array<{
        id: number
        name: string
        type: string
        year: number | null
        imdb_id: string | null
        tmdb_id: number | null
      }>
    }>('/search', params, 'search', CACHE_TTL.SEARCH)

    return {
      titles: await enrichWithPosters(raw.title_results.map(mapTitleResult)),
      total: 0,
      current_page: 0,
      total_pages: 0,
    }
  }

  const listParams: Record<string, string | number | undefined> = {
    sort_by: 'popularity_desc',
    page,
    limit,
  }

  if (type && type !== 'both') {
    listParams.types = type === 'series' ? 'tv_series' : 'movie'
  }

  if (genre) {
    await ensureGenres()
    const id = genreNameToId[genre.toLowerCase()]
    if (id) listParams.genres = String(id)
  }

  if (year) {
    listParams.release_date_start = `${year}0101`
    listParams.release_date_end = `${year}1231`
  }

  if (minRating) {
    listParams['user_rating_low'] = minRating
  }

  const raw = await fetchFromWatchmode<{
    titles: Array<{
      id: number
      title: string
      year: number | null
      type: string
      imdb_id: string | null
      tmdb_id: number | null
    }>
    page: number
    total_pages: number
    total_results: number
  }>('/list-titles', listParams, 'browse', CACHE_TTL.BROWSE)

  return {
    titles: await enrichWithPosters(raw.titles.map(mapTitleResult)),
    total: raw.total_results,
    current_page: raw.page,
    total_pages: raw.total_pages,
  }
}

export async function getTrending(
  page: number = 1,
  limit: number = 20,
  type?: 'movie' | 'series'
): Promise<WatchmodeSearchResponse> {
  const params: Record<string, string | number | undefined> = {
    sort_by: 'popularity_desc',
    limit,
    page,
  }

  if (type) {
    params.types = type === 'series' ? 'tv_series' : 'movie'
  }

  const raw = await fetchFromWatchmode<{
    titles: Array<{
      id: number
      title: string
      year: number | null
      type: string
      imdb_id: string | null
      tmdb_id: number | null
    }>
    page: number
    total_pages: number
    total_results: number
  }>('/list-titles', params, `trending${type ? `:${type}` : ''}`, CACHE_TTL.TRENDING)

  return {
    titles: await enrichWithPosters(raw.titles.map(mapTitleResult)),
    total: raw.total_results,
    current_page: raw.page,
    total_pages: raw.total_pages,
  }
}

export async function getTitleDetails(
  id: number
): Promise<WatchmodeTitle> {
  const raw = await fetchFromWatchmode<{
    id: number
    title: string
    plot_overview: string | null
    user_rating: number | null
    genre_names: string[] | null
    poster: string | null
    release_date: string | null
    type: string
    year: number | null
    imdb_id: string | null
    tmdb_id: number | null
    runtime_minutes: number | null
    us_rating: string | null
    networks: number[] | null
    network_names: string[] | null
    similar_titles: number[] | null
    original_language: string | null
    trailer: string | null
    backdrop: string | null
  }>(
    `/title/${id}/details`,
    {},
    'details',
    CACHE_TTL.DETAILS
  )

  return {
    id: raw.id,
    title: raw.title,
    type: mapWatchmodeType(raw.type),
    year: raw.year,
    poster: raw.poster,
    rating: raw.user_rating,
    plot: raw.plot_overview,
    genres: raw.genre_names ?? [],
    imdb_id: raw.imdb_id,
    tmdb_id: raw.tmdb_id,
    release_date: raw.release_date,
    runtime_minutes: raw.runtime_minutes,
    us_rating: raw.us_rating,
    network_names: raw.network_names ?? [],
    trailer: raw.trailer,
    backdrop: raw.backdrop,
  }
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
