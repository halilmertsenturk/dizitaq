'use client'

import { Badge } from '@/components/ui/badge'
import { ExternalLink } from 'lucide-react'
import type { WatchmodeSource } from '@dizitaq/shared'
import { PLATFORM_COLORS } from '@dizitaq/shared'

interface PlatformBadgeProps {
  source: WatchmodeSource
}

export function PlatformBadge({ source }: PlatformBadgeProps) {
  const color = PLATFORM_COLORS[source.name] ?? '#666666'
  const isAvailable = source.type === 'sub' || source.type === 'free' || source.type === 'buy'

  return (
    <a
      href={source.web_url ?? '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block"
    >
      <Badge
        variant="platform"
        className="gap-2 px-3 py-1.5 text-xs cursor-pointer hover:opacity-80 transition-opacity"
        style={{ backgroundColor: color }}
      >
        {source.name}
        {source.type === 'sub' && ' (Subscription)'}
        {source.type === 'free' && ' (Free)'}
        {source.type === 'buy' && ` (Buy${source.price ? ` $${source.price}` : ''})`}
        {source.type === 'rent' && ` (Rent${source.price ? ` $${source.price}` : ''})`}
        {isAvailable && source.web_url && (
          <ExternalLink className="h-3 w-3 ml-1" />
        )}
      </Badge>
    </a>
  )
}
