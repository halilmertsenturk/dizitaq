'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
interface ReviewData {
  id: string
  rating: number
  content: string
  user: string
  createdAt: string
}

interface ReviewSectionProps {
  watchmodeId: number
}

export function ReviewSection({ watchmodeId }: ReviewSectionProps) {
  const { data: session } = useSession()
  const [reviews, setReviews] = useState<ReviewData[]>([])
  const [averageRating, setAverageRating] = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)
  const [rating, setRating] = useState(10)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  async function loadReviews() {
    const res = await fetch(`/api/reviews?watchmodeId=${watchmodeId}`)
    if (res.ok) {
      const data = await res.json()
      setReviews(data.reviews ?? [])
      setAverageRating(data.averageRating ?? 0)
      setTotalReviews(data.totalReviews ?? 0)
    }
    setLoading(false)
  }

  useEffect(() => { loadReviews() }, [watchmodeId])

  async function submitReview(e: React.FormEvent) {
    e.preventDefault()
    if (!session) return
    setSubmitting(true)
    setMessage('')

    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ watchmodeId, rating, content }),
    })

    if (res.ok) {
      setMessage('Review saved!')
      setContent('')
      loadReviews()
    } else {
      const data = await res.json()
      setMessage(data.error ?? 'Failed to save review')
    }
    setSubmitting(false)
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <h2 className="mb-4 text-lg font-semibold text-zinc-200">
        Ratings & Reviews
        {totalReviews > 0 && (
          <span className="ml-2 text-sm text-zinc-500">
            ({averageRating.toFixed(1)} avg, {totalReviews} reviews)
          </span>
        )}
      </h2>

      {totalReviews > 0 && (
        <div className="mb-4 flex items-center gap-2">
          <div className="flex">
            {[1, 2, 3, 4, 5].map(star => (
              <span
                key={star}
                className={`text-lg ${star <= Math.round(averageRating / 2) ? 'text-yellow-400' : 'text-zinc-700'}`}
              >
                ★
              </span>
            ))}
          </div>
          <span className="text-sm text-zinc-400">{(averageRating / 2).toFixed(1)}/5</span>
        </div>
      )}

      {session && (
        <form onSubmit={submitReview} className="mb-6 space-y-3 rounded bg-zinc-800/50 p-3">
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Rating (1-10)</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className={`h-7 w-7 rounded text-xs font-medium transition-colors ${
                    n <= rating ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              className="w-full rounded border border-zinc-700 bg-zinc-800 p-2 text-sm text-zinc-100 outline-none focus:border-emerald-500"
              rows={3}
              placeholder="Write a review (optional, max 1000 chars)"
              maxLength={1000}
            />
          </div>
          {message && <p className="text-sm text-zinc-400">{message}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-emerald-600 px-4 py-1.5 text-sm text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Saving...' : 'Submit Review'}
          </button>
        </form>
      )}

      {!session && (
        <p className="mb-4 text-sm text-zinc-500">
          <a href="/auth/login" className="text-emerald-400 hover:underline">Sign in</a> to rate and review
        </p>
      )}

      {loading ? (
        <p className="text-sm text-zinc-500">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-zinc-500">No reviews yet.</p>
      ) : (
        <div className="space-y-3">
          {reviews.map(r => (
            <div key={r.id} className="border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="rounded bg-emerald-900/50 px-2 py-0.5 text-xs text-emerald-400">{r.rating}/10</span>
                <span className="text-sm text-zinc-400">{r.user}</span>
                <span className="text-xs text-zinc-600">{new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
              {r.content && <p className="mt-1 text-sm text-zinc-300">{r.content}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
