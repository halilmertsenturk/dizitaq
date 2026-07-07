'use client'

import { useCallback } from 'react'
import { useTitleDetails } from '@/hooks/use-titles'
import { VideoPlayer } from '@/components/video/video-player'
import { ReviewSection } from '@/components/video/review-section'
import { CommentSection } from '@/components/video/comment-section'
import { useSession } from 'next-auth/react'

export default function WatchMoviePage({ params }: { params: { id: string } }) {
  const watchmodeId = parseInt(params.id)
  const { data, loading } = useTitleDetails(params.id)
  const { data: session } = useSession()

  const handleWatch = useCallback(async () => {
    try {
      await fetch('/api/watch-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ watchmodeId }),
      })
    } catch {}
  }, [watchmodeId])

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl p-4">
        <div className="aspect-video w-full animate-pulse rounded-lg bg-zinc-900" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-6xl p-4 text-center text-zinc-500">
        Title not found
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl p-4">
      <div className="mb-6">
        <div className="mb-4 flex items-center gap-3">
          <a
            href={`/title/${watchmodeId}`}
            className="rounded bg-zinc-800 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            &larr; Back to details
          </a>
          <h1 className="text-xl font-bold text-zinc-100">{data.title}</h1>
          <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500">
            {data.type === 'movie' ? 'Movie' : 'Series'}
          </span>
          {data.year && <span className="text-sm text-zinc-500">({data.year})</span>}
        </div>

        <VideoPlayer
          watchmodeId={watchmodeId}
          title={data.title}
          onWatch={handleWatch}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
        <CommentSection watchmodeId={watchmodeId} />
        <ReviewSection watchmodeId={watchmodeId} />
      </div>
    </div>
  )
}
