import { useState, useEffect, useCallback } from 'react'
import type { WatchmodeSearchResponse, WatchmodeDetailResponse, TitleFilters } from '@dizitaq/shared'

interface UseTitlesOptions {
  initialPage?: number
  type?: 'movie' | 'series'
}

export function useTrending(options: UseTitlesOptions = {}) {
  const [data, setData] = useState<WatchmodeSearchResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(options.initialPage ?? 1)

  const fetchTitles = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (options.type) params.set('type', options.type)
      const res = await fetch(`/api/titles?${params}`)
      if (!res.ok) throw new Error('Failed to fetch titles')
      const json = await res.json()
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [page, options.type])

  useEffect(() => { fetchTitles() }, [fetchTitles])

  return { data, loading, error, page, setPage, refetch: fetchTitles }
}

export function useSearch(filters: TitleFilters) {
  const [data, setData] = useState<WatchmodeSearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!filters.query && !filters.genre && !filters.year) return

    const controller = new AbortController()
    setLoading(true)

    const params = new URLSearchParams()
    if (filters.query) params.set('query', filters.query)
    if (filters.genre) params.set('genre', filters.genre)
    if (filters.year) params.set('year', filters.year)
    if (filters.type) params.set('type', filters.type)
    if (filters['min-rating']) params.set('min-rating', String(filters['min-rating']))
    if (filters.page) params.set('page', String(filters.page))

    fetch(`/api/search?${params}`, { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error('Search failed')
        return res.json()
      })
      .then(setData)
      .catch(e => {
        if (e.name !== 'AbortError') setError(e.message)
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [filters.query, filters.genre, filters.year, filters.type, filters['min-rating'], filters.page])

  return { data, loading, error }
}

export function useTitleDetails(id: string | number) {
  const [data, setData] = useState<WatchmodeDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetch(`/api/titles?id=${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch title details')
        return res.json()
      })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  return { data, loading, error }
}
