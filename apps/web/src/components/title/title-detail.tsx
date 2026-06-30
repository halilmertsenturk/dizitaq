'use client'

import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PlatformBadge } from '@/components/platform/platform-badge'
import { EpisodeList } from './episode-list'
import type { WatchmodeDetailResponse } from '@dizitaq/shared'
import { formatRating, formatYear } from '@/lib/utils'
import { Star, Film, Tv, Calendar, Plus, Check, Clock, Play } from 'lucide-react'

interface TitleDetailProps {
  data: WatchmodeDetailResponse | null
  loading: boolean
  error: string | null
  isInWatchlist: boolean
  onToggleWatchlist: () => void
}

export function TitleDetail({ data, loading, error, isInWatchlist, onToggleWatchlist }: TitleDetailProps) {
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <Skeleton className="w-full md:w-[350px] aspect-[2/3] rounded-lg" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-destructive text-lg mb-2">Failed to load title</p>
        <p className="text-muted-foreground text-sm">{error}</p>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Poster */}
        <div className="relative w-full md:w-[350px] aspect-[2/3] shrink-0">
          {data.poster ? (
            <Image
              src={data.poster}
              alt={data.title}
              fill
              className="object-cover rounded-lg"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-muted rounded-lg">
              <Film className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 space-y-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{data.title}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {data.rating && (
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-foreground">{formatRating(data.rating)}</span>
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatYear(data.year)}
              </span>
              <span className="flex items-center gap-1">
                {data.type === 'series' ? (
                  <Tv className="h-4 w-4" />
                ) : (
                  <Film className="h-4 w-4" />
                )}
                {data.type === 'series' ? 'TV Series' : 'Movie'}
              </span>
              {data.runtime_minutes && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {data.runtime_minutes} min
                </span>
              )}
              {data.us_rating && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                  {data.us_rating}
                </Badge>
              )}
              {data.network_names.length > 0 && (
                <span className="text-xs">{data.network_names.join(', ')}</span>
              )}
            </div>
            {data.trailer && (
              <a
                href={data.trailer}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 mt-2"
              >
                <Play className="h-4 w-4 fill-current" />
                Watch Trailer
              </a>
            )}
          </div>

          {/* Genres */}
          <div className="flex flex-wrap gap-2">
            {data.genres?.map((genre) => (
              <Badge key={genre} variant="secondary">{genre}</Badge>
            ))}
          </div>

          {/* Plot */}
          {data.plot && (
            <p className="text-muted-foreground leading-relaxed">{data.plot}</p>
          )}

          {/* Watchlist button */}
          <Button
            onClick={onToggleWatchlist}
            variant={isInWatchlist ? 'secondary' : 'default'}
            className="gap-2"
          >
            {isInWatchlist ? (
              <><Check className="h-4 w-4" /> In Watchlist</>
            ) : (
              <><Plus className="h-4 w-4" /> Add to Watchlist</>
            )}
          </Button>

          {/* Streaming platforms */}
          {data.sources && data.sources.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Where to Watch</h2>
              <div className="flex flex-wrap gap-3">
                {data.sources.map((source) => (
                  <PlatformBadge key={source.source_id} source={source} />
                ))}
              </div>
            </div>
          )}

          {/* Episodes */}
          {data.seasons && data.seasons.length > 0 && (
            <EpisodeList seasons={data.seasons} />
          )}
        </div>
      </div>
    </div>
  )
}
