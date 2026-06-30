'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import type { WatchmodeSeason } from '@dizitaq/shared'

interface EpisodeListProps {
  seasons: WatchmodeSeason[]
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
              <div className="space-y-2">
                {season.episodes.map((ep) => (
                  <div
                    key={ep.ep_num}
                    className="flex gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                      {ep.ep_num}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{ep.title}</p>
                      {ep.synopsis && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {ep.synopsis}
                        </p>
                      )}
                      {ep.air_date && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {ep.air_date}
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
