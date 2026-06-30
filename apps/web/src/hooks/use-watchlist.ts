'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from '@/components/ui/use-toast'

interface WatchlistEntry {
  id: string
  titleId: string
  addedAt: string
  title: {
    id: string
    watchmodeId: number
    title: string
    poster: string | null
    type: string
    year: number | null
    rating: number | null
    genres: string[]
    imdbId: string | null
    tmdbId: number | null
  }
}

export function useWatchlist() {
  const { data: session } = useSession()
  const [items, setItems] = useState<WatchlistEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [watchmodeIds, setWatchmodeIds] = useState<Set<number>>(new Set())

  const fetchWatchlist = useCallback(async () => {
    if (!session) return
    setLoading(true)
    try {
      const res = await fetch('/api/watchlist')
      if (res.ok) {
        const data = await res.json()
        setItems(data)
        setWatchmodeIds(new Set(data.map((e: WatchlistEntry) => e.title.watchmodeId)))
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => { fetchWatchlist() }, [fetchWatchlist])

  const addToWatchlist = async (watchmodeId: number) => {
    if (!session) {
      toast({ title: 'Sign in required', description: 'Please sign in to save to your watchlist', variant: 'destructive' })
      return
    }
    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ watchmodeId }),
      })
      if (res.ok) {
        setWatchmodeIds(prev => new Set(prev).add(watchmodeId))
        toast({ title: 'Added to watchlist' })
        fetchWatchlist()
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error ?? 'Failed to add', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to add to watchlist', variant: 'destructive' })
    }
  }

  const removeFromWatchlist = async (watchmodeId: number) => {
    try {
      const res = await fetch(`/api/watchlist?watchmodeId=${watchmodeId}`, { method: 'DELETE' })
      if (res.ok) {
        setWatchmodeIds(prev => { const next = new Set(prev); next.delete(watchmodeId); return next })
        toast({ title: 'Removed from watchlist' })
        fetchWatchlist()
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to remove from watchlist', variant: 'destructive' })
    }
  }

  const isInWatchlist = (watchmodeId: number) => watchmodeIds.has(watchmodeId)

  return { items, loading, addToWatchlist, removeFromWatchlist, isInWatchlist, refetch: fetchWatchlist }
}
