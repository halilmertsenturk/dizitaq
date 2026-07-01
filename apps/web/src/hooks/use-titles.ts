import { useState, useEffect, useCallback, useRef } from 'react'
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
  const typeRef = useRef(options.type)
  typeRef.current = options.type

  const abortRef = useRef<AbortController | null>(null)

  const fetchTitles = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const currentType = typeRef.current
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (currentType) params.set('type', currentType)
      const res = await fetch(`/api/titles?${params}`, { signal: controller.signal })
      if (!res.ok) throw new Error('Failed to fetch titles')
      const json = await res.json()
      if (controller.signal.aborted) return
      setData(json)
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchTitles()
    return () => abortRef.current?.abort()
  }, [fetchTitles])

  return { data, loading, error, page, setPage, refetch: fetchTitles }
}

export function useSearch(filters: TitleFilters) {
  const [data, setData] = useState<WatchmodeSearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestIdRef = useRef(0)

  useEffect(() => {
    if (!filters.query && !filters.genre && !filters.year && !filters.type && !filters['min-rating']) return

    const controller = new AbortController()
    const requestId = ++requestIdRef.current
    setLoading(true)
    setError(null)

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
      .then(json => {
        if (requestId === requestIdRef.current) setData(json)
      })
      .catch(e => {
        if (e.name === 'AbortError') return
        if (requestId === requestIdRef.current) setError(e.message)
      })
      .finally(() => {
        if (requestId === requestIdRef.current) setLoading(false)
      })

    return () => controller.abort()
  }, [filters.query, filters.genre, filters.year, filters.type, filters['min-rating'], filters.page])

  return { data, loading, error }
}

export function useTitleDetails(id: string | number) {
  const [data, setData] = useState<WatchmodeDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const requestIdRef = useRef(0)

  useEffect(() => {
    if (!id) return

    const requestId = ++requestIdRef.current
    setLoading(true)
    setError(null)

    fetch(`/api/titles?id=${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch title details')
        return res.json()
      })
      .then(json => {
        if (requestId === requestIdRef.current) setData(json)
      })
      .catch(e => {
        if (requestId === requestIdRef.current) setError(e.message)
      })
      .finally(() => {
        if (requestId === requestIdRef.current) setLoading(false)
      })
  }, [id])

  return { data, loading, error, refetch: () => {} }
}
