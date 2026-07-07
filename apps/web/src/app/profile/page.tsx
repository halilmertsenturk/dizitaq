'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Play, Clock, Star, Heart, MessageSquare, Film, Tv } from 'lucide-react'

interface HistoryEntry {
  id: string
  title: { watchmodeId: number; title: string; poster: string | null; type: string }
  episode: { epNum: number; title: string } | null
  timestamp: number
  completed: boolean
  watchedAt: string
}

interface FavoriteEntry {
  id: string
  title: { watchmodeId: number; title: string; poster: string | null; type: string; year: number | null; rating: number | null }
  createdAt: string
}

interface ReviewEntry {
  id: string
  rating: number
  content: string | null
  title: { title: string; watchmodeId: number }
  createdAt: string
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('history')
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [favorites, setFavorites] = useState<FavoriteEntry[]>([])
  const [reviews, setReviews] = useState<ReviewEntry[]>([])

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login')
  }, [status, router])

  useEffect(() => {
    if (!session) return

    fetch('/api/watch-history')
      .then(res => res.ok ? res.json() : [])
      .then(setHistory)
      .catch(() => {})

    fetch('/api/favorites')
      .then(res => res.ok ? res.json() : [])
      .then(setFavorites)
      .catch(() => {})
  }, [session])

  if (status === 'loading') {
    return <div className="mx-auto max-w-4xl p-8 text-center text-zinc-500">Loading...</div>
  }

  if (!session) return null

  const tabs = [
    { key: 'history', label: 'Watch History', icon: Clock },
    { key: 'favorites', label: 'Favorites', icon: Heart },
    { key: 'reviews', label: 'My Ratings', icon: Star },
  ]

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100">My Profile</h1>
        <p className="text-zinc-500">{session.user?.email}</p>
      </div>

      <div className="mb-6 flex gap-1 rounded-lg bg-zinc-900 p-1">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === t.key
                ? 'bg-emerald-600 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'history' && (
        <div className="space-y-2">
          {history.length === 0 ? (
            <p className="text-zinc-500 text-center py-8">No watch history yet. Start watching!</p>
          ) : (
            history.map(h => (
              <Link
                key={h.id}
                href={`/watch/${h.title.watchmodeId}`}
                className="flex items-center gap-4 rounded-lg border border-zinc-800 bg-zinc-900 p-3 hover:bg-zinc-800 transition-colors"
              >
                <div className="h-16 w-12 shrink-0 overflow-hidden rounded bg-zinc-800">
                  {h.title.poster ? (
                    <img src={h.title.poster} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-zinc-700">
                      <Film className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-200 truncate">{h.title.title}</p>
                  {h.episode && (
                    <p className="text-xs text-zinc-500">S{String(h.episode.epNum).padStart(2, '0')} - {h.episode.title}</p>
                  )}
                  <p className="text-xs text-zinc-600">{new Date(h.watchedAt).toLocaleDateString()}</p>
                </div>
                <Play className="h-4 w-4 text-emerald-400 shrink-0" />
              </Link>
            ))
          )}
        </div>
      )}

      {activeTab === 'favorites' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {favorites.length === 0 ? (
            <p className="text-zinc-500 text-center py-8 col-span-full">No favorites yet.</p>
          ) : (
            favorites.map(f => (
              <Link
                key={f.id}
                href={`/watch/${f.title.watchmodeId}`}
                className="group relative aspect-[2/3] overflow-hidden rounded-lg bg-zinc-900"
              >
                {f.title.poster ? (
                  <img src={f.title.poster} alt={f.title.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-zinc-800">
                    <span className="text-3xl font-bold text-zinc-700">{f.title.title.charAt(0)}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                  <Play className="h-5 w-5 text-emerald-400 mb-1" />
                  <p className="text-xs text-zinc-300 truncate">{f.title.title}</p>
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="space-y-3">
          {reviews.length === 0 ? (
            <p className="text-zinc-500 text-center py-8">No ratings yet.</p>
          ) : (
            reviews.map(r => (
              <div key={r.id} className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="rounded bg-emerald-900/50 px-2 py-0.5 text-xs text-emerald-400">{r.rating}/10</span>
                  <span className="text-sm font-medium text-zinc-300">{r.title.title}</span>
                  <span className="text-xs text-zinc-600">{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
                {r.content && <p className="text-sm text-zinc-400">{r.content}</p>}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
