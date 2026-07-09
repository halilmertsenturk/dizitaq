export interface WatchmodeTitle {
  id: number
  title: string
  type: 'movie' | 'series'
  year: number | null
  poster: string | null
  rating: number | null
  plot: string | null
  genres: string[]
  imdb_id: string | null
  tmdb_id: number | null
  release_date: string | null
  runtime_minutes: number | null
  us_rating: string | null
  network_names: string[]
  trailer: string | null
  backdrop: string | null
}

export interface WatchmodeSource {
  source_id: number
  name: string
  type: string
  region: string
  ios_url: string | null
  android_url: string | null
  web_url: string | null
  format: string
  price: number | null
  quality: string
}

export interface WatchmodeEpisode {
  id: number
  season_number: number
  episode_number: number
  name: string
  overview: string | null
  thumbnail_url: string | null
  release_date: string | null
  runtime_minutes: number | null
  tmdb_id: number | null
  imdb_id: string | null
}

export interface WatchmodeSeason {
  season_number: number
  episodes: WatchmodeEpisode[]
}

export interface WatchmodeSearchResponse {
  titles: WatchmodeTitle[]
  total: number
  current_page: number
  total_pages: number
}

export interface WatchmodeCastMember {
  id: number
  name: string
  role: string | null
  type: 'cast' | 'crew'
}

export interface WatchmodeDetailResponse extends WatchmodeTitle {
  sources: WatchmodeSource[]
  seasons?: WatchmodeSeason[]
  cast: WatchmodeCastMember[]
}

export interface TitleFilters {
  query?: string
  genre?: string
  year?: string
  type?: 'movie' | 'series' | 'both'
  'min-rating'?: number
  page?: number
  limit?: number
}

export interface CachedTitleData {
  id: string
  watchmodeId: number
  title: string
  type: 'movie' | 'series'
  year: number | null
  genres: string[]
  poster: string | null
  rating: number | null
  plot: string | null
  imdbId: string | null
  tmdbId: number | null
  sources: CachedSourceData[]
  seasons: CachedSeasonData[]
  cachedAt: Date
}

export interface CachedSourceData {
  sourceId: number
  name: string
  type: string
  region: string
  iosUrl: string | null
  androidUrl: string | null
  webUrl: string | null
  format: string
  price: number | null
  quality: string
}

export interface CachedSeasonData {
  seasonNumber: number
  episodes: {
    epNum: number
    title: string
    synopsis: string | null
    airDate: string | null
    image: string | null
  }[]
}

export interface WatchlistEntry {
  id: string
  userId: string
  titleId: string
  title: CachedTitleData
  addedAt: Date
}

export const PLATFORM_COLORS: Record<string, string> = {
  Netflix: '#E50914',
  'Disney+': '#113CCF',
  'Amazon Prime': '#FF9900',
  'Apple TV': '#555555',
  'HBO Max': '#5822B4',
  Hulu: '#1CE783',
  'Paramount+': '#0064FF',
  Peacock: '#FCC23B',
  Tubi: '#9C27B0',
  'Apple TV+': '#555555',
}

export const PLATFORM_LOGOS: Record<string, string> = {
  Netflix: '/icons/netflix.svg',
  'Disney+': '/icons/disney-plus.svg',
  'Amazon Prime': '/icons/amazon-prime.svg',
  'Apple TV': '/icons/apple-tv.svg',
}

export const GENRES = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary',
  'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music', 'Mystery',
  'Romance', 'Science Fiction', 'Thriller', 'War', 'Western',
]
