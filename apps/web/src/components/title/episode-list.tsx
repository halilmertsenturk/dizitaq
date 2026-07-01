'use client'

import Image from 'next/image'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import type { WatchmodeSeason } from '@dizitaq/shared'
import { Film } from 'lucide-react'

interface EpisodeListProps {
  seasons: WatchmodeSeason[]
}

function formatEp(season: number, episode: number): string {
  return `S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')}`
}

export function EpisodeList({ seasons }: EpisodeListProps) {
  if (!seasons || seasons.length === 0) return null

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Seasons & Episodes</h2>
      <Accordion type="single" collapsible className="w-full">
        {seasons.map((season) => (
          <AccordionItem key={season.season_number} value={`season-${season.season_number}`}>
            <AccordionTrigger className="hover:no-underline">
              <span className="text-base font-medium">
                Season {season.season_number}
                <span className="text-muted-foreground text-sm ml-2">
                  ({season.episodes.length} episodes)
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 pt-2">
                {season.episodes.map((ep) => (
                  <div
                    key={ep.id}
                    className="flex gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    {ep.thumbnail_url ? (
                      <div className="relative w-20 h-14 shrink-0 rounded-md overflow-hidden bg-muted">
                        <Image
                          src={ep.thumbnail_url}
                          alt={ep.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </div>
                    ) : (
                      <div className="flex w-20 h-14 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Film className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-mono text-muted-foreground">
                        {formatEp(season.season_number, ep.episode_number)}
                      </span>
                      <p className="text-sm font-medium truncate">{ep.name}</p>
                      {ep.overview && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {ep.overview}
                        </p>
                      )}
                      {ep.release_date && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {ep.release_date}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
