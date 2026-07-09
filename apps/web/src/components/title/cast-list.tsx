import type { WatchmodeCastMember } from '@dizitaq/shared'

interface CastListProps {
  cast: WatchmodeCastMember[]
}

export function CastList({ cast }: CastListProps) {
  if (cast.length === 0) return null

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Cast</h2>
      <div className="flex flex-wrap gap-4">
        {cast.map((actor) => (
          <div key={actor.id} className="flex items-center gap-3 w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33%-0.75rem)]">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-zinc-800">
              {actor.headshot_url ? (
                <img
                  src={actor.headshot_url}
                  alt={actor.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm font-medium text-zinc-500">
                  {actor.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{actor.name}</p>
              {actor.role && (
                <p className="text-xs text-muted-foreground truncate">{actor.role}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
