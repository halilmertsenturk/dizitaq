'use client'

import { use } from 'react'
import { TitleDetail } from '@/components/title/title-detail'
import { useTitleDetails } from '@/hooks/use-titles'
import { useWatchlist } from '@/hooks/use-watchlist'

export default function TitlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const watchmodeId = parseInt(id)
  const { data, loading, error } = useTitleDetails(id)
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist()

  const handleToggleWatchlist = () => {
    if (isInWatchlist(watchmodeId)) {
      removeFromWatchlist(watchmodeId)
    } else {
      addToWatchlist(watchmodeId)
    }
  }

  return (
    <TitleDetail
      data={data}
      loading={loading}
      error={error}
      isInWatchlist={isInWatchlist(watchmodeId)}
      onToggleWatchlist={handleToggleWatchlist}
    />
  )
}
