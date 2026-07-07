'use client'

interface Source {
  id: string
  embedUrl: string
  sourceName: string
  quality: string | null
  language: string
}

interface SourceSelectorProps {
  sources: Source[]
  activeSource: string
  onSelect: (sourceId: string) => void
}

export function SourceSelector({ sources, activeSource, onSelect }: SourceSelectorProps) {
  if (sources.length <= 1) return null

  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="text-xs text-zinc-500">Source:</span>
      <div className="flex flex-wrap gap-1">
        {sources.map(s => (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              s.id === activeSource
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            {s.sourceName}
            {s.quality && <span className="ml-1 opacity-70">{s.quality}</span>}
          </button>
        ))}
      </div>
    </div>
  )
}
