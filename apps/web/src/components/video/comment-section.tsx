'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

interface Comment {
  id: string
  content: string
  user: string
  createdAt: string
}

interface CommentSectionProps {
  watchmodeId: number
}

export function CommentSection({ watchmodeId }: CommentSectionProps) {
  const { data: session } = useSession()
  const [comments, setComments] = useState<Comment[]>([])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  async function loadComments() {
    const res = await fetch(`/api/comments?watchmodeId=${watchmodeId}&page=${page}&limit=20`)
    if (res.ok) {
      const data = await res.json()
      setComments(data.comments ?? [])
      setTotalPages(data.totalPages ?? 1)
    }
    setLoading(false)
  }

  useEffect(() => { loadComments() }, [watchmodeId, page])

  async function submitComment(e: React.FormEvent) {
    e.preventDefault()
    if (!session || !content.trim()) return
    setSubmitting(true)
    setMessage('')

    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ watchmodeId, content: content.trim() }),
    })

    if (res.ok) {
      setContent('')
      setPage(1)
      loadComments()
    } else {
      const data = await res.json()
      setMessage(data.error ?? 'Failed to post comment')
    }
    setSubmitting(false)
  }

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-zinc-200">Comments</h2>

      {session ? (
        <form onSubmit={submitComment} className="mb-6 space-y-3">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            className="w-full rounded border border-zinc-700 bg-zinc-800 p-3 text-sm text-zinc-100 outline-none focus:border-emerald-500"
            rows={3}
            placeholder="Write a comment..."
            maxLength={1000}
          />
          {message && <p className="text-sm text-zinc-400">{message}</p>}
          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className="rounded bg-emerald-600 px-4 py-1.5 text-sm text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
      ) : (
        <p className="mb-6 text-sm text-zinc-500">
          <a href="/auth/login" className="text-emerald-400 hover:underline">Sign in</a> to comment
        </p>
      )}

      {loading ? (
        <p className="text-sm text-zinc-500">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-zinc-500">No comments yet.</p>
      ) : (
        <div className="space-y-4">
          {comments.map(c => (
            <div key={c.id} className="rounded border border-zinc-800 bg-zinc-900 p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-zinc-300">{c.user}</span>
                <span className="text-xs text-zinc-600">{new Date(c.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-sm text-zinc-400 whitespace-pre-wrap">{c.content}</p>
            </div>
          ))}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded bg-zinc-800 px-3 py-1 text-xs text-zinc-400 hover:text-zinc-100 disabled:opacity-50 transition-colors"
              >
                Previous
              </button>
              <span className="text-xs text-zinc-600">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded bg-zinc-800 px-3 py-1 text-xs text-zinc-400 hover:text-zinc-100 disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
