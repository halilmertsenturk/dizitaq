'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import type { WatchmodeTitle } from '@dizitaq/shared'
import { formatRating, formatYear } from '@/lib/utils'
import { Star, Film, Tv, Play } from 'lucide-react'

interface TitleCardProps {
  title: WatchmodeTitle
  priority?: boolean
}

const PLACEHOLDER_GRADIENTS = [
  'from-red-900 via-red-800 to-orange-900',
  'from-blue-900 via-indigo-800 to-purple-900',
  'from-green-900 via-emerald-800 to-teal-900',
  'from-purple-900 via-violet-800 to-pink-900',
  'from-yellow-900 via-amber-800 to-orange-900',
  'from-pink-900 via-rose-800 to-red-900',
  'from-indigo-900 via-blue-800 to-cyan-900',
  'from-gray-900 via-slate-800 to-zinc-900',
]

function getPlaceholderGradient(id: number): string {
  return PLACEHOLDER_GRADIENTS[id % PLACEHOLDER_GRADIENTS.length]
}

export function TitleCard({ title, priority = false }: TitleCardProps) {
  return (
    <Link href={`/title/${title.id}`} className="title-card group block aspect-[2/3] relative">
      <div className="relative h-full w-full">
        {title.poster ? (
          <Image
            src={title.poster}
            alt={title.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover"
            priority={priority}
          />
        ) : (
          <div className={`flex h-full items-center justify-center bg-gradient-to-br ${getPlaceholderGradient(title.id)}`}>
            <span className="text-5xl font-bold text-white/30 select-none">
              {title.title.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        <div className="title-card-overlay">
          <a
            href={title.type === 'movie' ? `/watch/${title.id}` : `/title/${title.id}`}
            className="mb-2 inline-flex items-center gap-1.5 rounded bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 transition-colors w-fit"
            onClick={e => e.stopPropagation()}
          >
            <Play className="h-3 w-3 fill-current" />
            Watch
          </a>
          <h3 className="text-sm font-semibold text-white line-clamp-2 mb-1">
            {title.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-gray-300">
            {title.rating && (
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                {formatRating(title.rating)}
              </span>
            )}
            <span>{formatYear(title.year)}</span>
            <span className="flex items-center gap-1">
              {title.type === 'series' ? (
                <Tv className="h-3 w-3" />
              ) : (
                <Film className="h-3 w-3" />
              )}
              {title.type === 'series' ? 'TV' : 'Movie'}
            </span>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {title.genres?.slice(0, 2).map((genre) => (
              <Badge key={genre} variant="secondary" className="text-[10px] px-1.5 py-0">
                {genre}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </Link>
  )
}
