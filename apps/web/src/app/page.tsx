'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TitleGrid } from '@/components/title/title-grid'
import { TitleCard } from '@/components/title/title-card'
import { Button } from '@/components/ui/button'
import { useTrending } from '@/hooks/use-titles'
import { ChevronRight, TrendingUp, Flame, Tv, Film, Play, Clock, Star } from 'lucide-react'
import Link from 'next/link'

const GENRE_CATEGORIES = [
  { name: 'Action', icon: '🔥', slug: 'action' },
  { name: 'Comedy', icon: '😂', slug: 'comedy' },
  { name: 'Drama', icon: '🎭', slug: 'drama' },
  { name: 'Horror', icon: '👻', slug: 'horror' },
  { name: 'Sci-Fi', icon: '🚀', slug: 'science-fiction' },
  { name: 'Romance', icon: '💕', slug: 'romance' },
  { name: 'Thriller', icon: '🔪', slug: 'thriller' },
  { name: 'Documentary', icon: '📽️', slug: 'documentary' },
]

interface HistoryEntry {
  title: {
    watchmodeId: number
    title: string
    poster: string | null
    type: string
  }
  episode: { epNum: number; title: string } | null
  timestamp: number
  completed: boolean
  watchedAt: string
}

export default function HomePage() {
  const [type, setType] = useState<'movie' | 'series' | undefined>(undefined)
  const { data: session } = useSession()
  const { data, loading, error, page, setPage } = useTrending({ type })
  const [history, setHistory] = useState<HistoryEntry[]>([])

  useEffect(() => {
    if (session) {
      fetch('/api/watch-history')
        .then(res => res.ok ? res.json() : [])
        .then(data => setHistory(data.filter((h: HistoryEntry) => !h.completed).slice(0, 6)))
        .catch(() => {})
    }
  }, [session])

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero section */}
      <section className="mb-10 text-center py-12 md:py-20">
        <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-emerald-500 via-green-400 to-teal-300 bg-clip-text text-transparent">
          Watch Free Movies & TV
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Stream your favorite movies and TV shows instantly. No sign-up required for most content.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/search">
            <Button size="lg" className="gap-2 bg-emerald-600 hover:bg-emerald-500">
              Browse All
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/trending">
            <Button size="lg" variant="outline" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Trending
            </Button>
          </Link>
        </div>
      </section>

      {/* Continue Watching */}
      {session && history.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-emerald-400" />
            <h2 className="text-xl font-bold">Continue Watching</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {history.map((h) => (
              <Link
                key={`${h.title.watchmodeId}-${h.episode?.epNum ?? ''}`}
                href={`/watch/${h.title.watchmodeId}`}
                className="group relative aspect-[2/3] overflow-hidden rounded-lg bg-zinc-900"
              >
                {h.title.poster ? (
                  <img
                    src={h.title.poster}
                    alt={h.title.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-zinc-800">
                    <span className="text-3xl font-bold text-zinc-700">
                      {h.title.title.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                  <div className="flex items-center gap-1 text-emerald-400 mb-1">
                    <Play className="h-4 w-4 fill-current" />
                    <span className="text-xs font-medium">Resume</span>
                  </div>
                  <p className="text-xs text-zinc-300 truncate">{h.title.title}</p>
                  {h.episode && (
                    <p className="text-[10px] text-zinc-500">
                      S{String(h.episode.epNum).padStart(2, '0')}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Browse by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
          {GENRE_CATEGORIES.map(cat => (
            <Link
              key={cat.slug}
              href={`/search?genre=${cat.slug}`}
              className="flex flex-col items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 p-4 hover:bg-zinc-800 hover:border-zinc-700 transition-colors"
            >
              <span className="text-2xl">{cat.icon}</span>
              <span className="text-xs font-medium text-zinc-300">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-emerald-500" />
            <h2 className="text-2xl font-bold">Trending Now</h2>
          </div>

          <Tabs
            value={type ?? 'all'}
            onValueChange={(v) => setType(v === 'all' ? undefined : v as 'movie' | 'series')}
          >
            <TabsList>
              <TabsTrigger value="all" className="gap-1">
                <Flame className="h-4 w-4" /> All
              </TabsTrigger>
              <TabsTrigger value="movie" className="gap-1">
                <Film className="h-4 w-4" /> Movies
              </TabsTrigger>
              <TabsTrigger value="series" className="gap-1">
                <Tv className="h-4 w-4" /> TV Shows
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <TitleGrid
          titles={data?.titles ?? []}
          loading={loading}
          error={error}
        />

        {data && data.total_pages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <Button
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {data.total_pages}
            </span>
            <Button
              variant="outline"
              disabled={page >= data.total_pages}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </section>
    </div>
  )
}
