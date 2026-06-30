'use client'

import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { TitleGrid } from '@/components/title/title-grid'
import { Button } from '@/components/ui/button'
import { useTrending } from '@/hooks/use-titles'
import { ChevronRight, TrendingUp, Flame, Tv, Film } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  const [type, setType] = useState<'movie' | 'series' | undefined>(undefined)

  const { data, loading, error, page, setPage } = useTrending({ type })

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero section */}
      <section className="mb-12 text-center py-12 md:py-20">
        <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-red-600 via-red-400 to-orange-300 bg-clip-text text-transparent">
          Discover What to Watch
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Find where your favorite movies and TV shows are streaming. Search across Netflix, Disney+, Amazon Prime, and more.
        </p>
        <Link href="/search">
          <Button size="lg" className="gap-2">
            Start Exploring
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </section>

      {/* Trending section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-red-500" />
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

        {/* Pagination */}
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
