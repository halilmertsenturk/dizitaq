'use client'

import { useState, useEffect, useRef } from 'react'
import { SourceSelector } from './source-selector'
import { ReportButton } from './report-button'

interface Source {
  id: string
  embedUrl: string
  sourceName: string
  quality: string | null
  language: string
  isActive?: boolean
}

interface VideoPlayerProps {
  watchmodeId: number
  episodeId?: string
  season?: number
  episode?: number
  title: string
  onWatch?: () => void
}

export function VideoPlayer({ watchmodeId, episodeId, season, episode, title, onWatch }: VideoPlayerProps) {
  const [sources, setSources] = useState<Source[]>([])
  const [activeSource, setActiveSource] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [watchLogged, setWatchLogged] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const params = new URLSearchParams({ watchmodeId: watchmodeId.toString() })
    if (season !== undefined && episode !== undefined) {
      params.set('season', String(season))
      params.set('episode', String(episode))
    }

    fetch(`/api/video?${params}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load sources')
        return res.json()
      })
      .then(data => {
        const active = data.sources?.filter((s: Source) => s.isActive !== false) ?? []
        setSources(active)
        if (active.length > 0) setActiveSource(active[0].id)
        setLoading(false)
      })
      .catch(() => {
        setError('No video sources available for this title')
        setLoading(false)
      })
  }, [watchmodeId, episodeId])

  const currentSource = sources.find(s => s.id === activeSource)

  useEffect(() => {
    if (currentSource && !watchLogged && onWatch) {
      onWatch()
      setWatchLogged(true)
    }
  }, [currentSource, watchLogged, onWatch])

  if (loading) {
    return (
      <div className="aspect-video w-full rounded-lg bg-zinc-900 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    )
  }

  if (error || !currentSource) {
    return (
      <div className="aspect-video w-full rounded-lg bg-zinc-900 flex flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-zinc-400">{error || 'No video sources available'}</p>
        <p className="text-xs text-zinc-600">Check back later or try another title</p>
      </div>
    )
  }

  return (
    <div>
      <SourceSelector
        sources={sources}
        activeSource={activeSource!}
        onSelect={setActiveSource}
      />
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
        <iframe
          ref={iframeRef}
          src={currentSource.embedUrl}
          className="absolute inset-0 h-full w-full"
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-same-origin allow-forms"
          title={title}
        />
      </div>
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
            {currentSource.sourceName}
          </span>
          {currentSource.quality && (
            <span className="text-xs text-zinc-600">{currentSource.quality}</span>
          )}
        </div>
        <ReportButton sourceId={currentSource.id} />
      </div>
    </div>
  )
}
