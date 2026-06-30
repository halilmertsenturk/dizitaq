'use client'

import { TitleCard } from './title-card'
import { Skeleton } from '@/components/ui/skeleton'
import type { WatchmodeTitle } from '@dizitaq/shared'

interface TitleGridProps {
  titles: WatchmodeTitle[]
  loading?: boolean
  error?: string | null
}

export function TitleGrid({ titles, loading, error }: TitleGridProps) {
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-destructive text-lg mb-2">Something went wrong</p>
        <p className="text-muted-foreground text-sm">{error}</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="aspect-[2/3]">
            <Skeleton className="h-full w-full rounded-lg" />
          </div>
        ))}
      </div>
    )
  }

  if (!titles || titles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground text-lg">No titles found</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {titles.map((title, i) => (
        <TitleCard key={title.id} title={title} priority={i < 6} />
      ))}
    </div>
  )
}
