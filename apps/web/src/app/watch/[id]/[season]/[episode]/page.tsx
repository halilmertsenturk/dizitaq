'use client'

import { useCallback } from 'react'
import { useTitleDetails } from '@/hooks/use-titles'
import { VideoPlayer } from '@/components/video/video-player'
import { CommentSection } from '@/components/video/comment-section'

export default function WatchEpisodePage({
  params,
}: {
  params: { id: string; season: string; episode: string }
}) {
  const watchmodeId = parseInt(params.id)
  const seasonNum = parseInt(params.season)
  const episodeNum = parseInt(params.episode)

  const { data, loading } = useTitleDetails(params.id)

  const season = data?.seasons?.find(s => s.season_number === seasonNum)
  const episode = season?.episodes?.find(e => e.episode_number === episodeNum)
  const seasonIndex = data?.seasons?.findIndex(s => s.season_number === seasonNum) ?? 0
  const episodeIndex = season?.episodes?.findIndex(e => e.episode_number === episodeNum) ?? 0
  const episodeId = episode?.id?.toString()

  const prevEpisode = season?.episodes?.[episodeIndex - 1]
  const nextEpisode = season?.episodes?.[episodeIndex + 1]

  const prevSeasonEpisode = seasonIndex > 0 && episodeIndex === 0
    ? data?.seasons?.[seasonIndex - 1]?.episodes?.slice(-1)[0]
    : null

  const nextSeasonEpisode = seasonIndex < (data?.seasons?.length ?? 1) - 1 &&
    episodeIndex === (season?.episodes?.length ?? 1) - 1
    ? data?.seasons?.[seasonIndex + 1]?.episodes?.[0]
    : null

  const handleWatch = useCallback(async () => {
    if (!episodeId) return
    try {
      await fetch('/api/watch-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          watchmodeId,
          episodeId: episodeId,
          completed: false,
        }),
      })
    } catch {}
  }, [watchmodeId, episodeId])

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl p-4">
        <div className="aspect-video w-full animate-pulse rounded-lg bg-zinc-900" />
      </div>
    )
  }

  if (!data || !episode) {
    return (
      <div className="mx-auto max-w-6xl p-4 text-center text-zinc-500">
        Episode not found
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl p-4">
      <div className="mb-4 flex items-center gap-3">
        <a
          href={`/title/${watchmodeId}`}
          className="rounded bg-zinc-800 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          &larr; {data.title}
        </a>
      </div>

      <div className="mb-2">
        <h1 className="text-lg font-bold text-zinc-100">
          S{String(seasonNum).padStart(2, '0')}E{String(episodeNum).padStart(2, '0')} — {episode.name}
        </h1>
        {episode.overview && (
          <p className="mt-1 text-sm text-zinc-400">{episode.overview}</p>
        )}
      </div>

      <VideoPlayer
        watchmodeId={watchmodeId}
        episodeId={episodeId}
        season={seasonNum}
        episode={episodeNum}
        title={`S${seasonNum}E${episodeNum} - ${episode.name}`}
        onWatch={handleWatch}
      />

      <div className="mt-4 flex items-center justify-between">
        <div>
          {(prevEpisode || prevSeasonEpisode) && (
            <a
              href={`/watch/${watchmodeId}/${prevSeasonEpisode ? seasonNum - 1 : seasonNum}/${prevSeasonEpisode ? prevSeasonEpisode.episode_number : prevEpisode!.episode_number}`}
              className="rounded bg-zinc-800 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 transition-colors"
            >
              &larr; Previous
            </a>
          )}
        </div>
        <div>
          {(nextEpisode || nextSeasonEpisode) && (
            <a
              href={`/watch/${watchmodeId}/${nextSeasonEpisode ? seasonNum + 1 : seasonNum}/${nextSeasonEpisode ? nextSeasonEpisode.episode_number : nextEpisode!.episode_number}`}
              className="rounded bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-500 transition-colors"
            >
              Next &rarr;
            </a>
          )}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-zinc-200">Comments</h2>
        <CommentSection watchmodeId={watchmodeId} />
      </div>
    </div>
  )
}
