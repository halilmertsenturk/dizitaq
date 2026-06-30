'use client'

import { useSession } from 'next-auth/react'
import { useWatchlist } from '@/hooks/use-watchlist'
import { TitleGrid } from '@/components/title/title-grid'
import { Button } from '@/components/ui/button'
import { List, LogIn } from 'lucide-react'
import Link from 'next/link'
import type { WatchmodeTitle } from '@dizitaq/shared'

export default function WatchlistPage() {
  const { data: session } = useSession()
  const { items, loading } = useWatchlist()

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <List className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h1 className="text-2xl font-bold mb-2">Your Watchlist</h1>
        <p className="text-muted-foreground mb-6">Sign in to save and track your watchlist</p>
        <Link href="/auth/login">
          <Button className="gap-2">
            <LogIn className="h-4 w-4" /> Sign In
          </Button>
        </Link>
      </div>
    )
  }

  const titles: WatchmodeTitle[] = items.map((item) => ({
    id: item.title.watchmodeId,
    title: item.title.title,
    type: item.title.type as 'movie' | 'series',
    year: item.title.year,
    poster: item.title.poster,
    rating: item.title.rating,
    plot: null,
    genres: item.title.genres,
    imdb_id: item.title.imdbId,
    tmdb_id: item.title.tmdbId,
    release_date: null,
  }))

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-8">
        <List className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Your Watchlist</h1>
        {!loading && <span className="text-muted-foreground">({items.length})</span>}
      </div>

      <TitleGrid titles={titles} loading={loading} />
    </div>
  )
}
