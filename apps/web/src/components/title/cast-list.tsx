import type { WatchmodeCastMember } from '@dizitaq/shared'

interface CastListProps {
  cast: WatchmodeCastMember[]
}

export function CastList({ cast }: CastListProps) {
  if (cast.length === 0) return null

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Cast</h2>
      <div className="flex flex-wrap gap-x-6 gap-y-3">
        {cast.map((actor) => (
          <div key={actor.id} className="min-w-0 flex-1 basis-[calc(50%-0.75rem)] sm:basis-[calc(33%-1rem)] lg:basis-[calc(25%-1.125rem)]">
            <p className="text-sm font-medium truncate">{actor.name}</p>
            {actor.role && (
              <p className="text-xs text-muted-foreground truncate">{actor.role}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
