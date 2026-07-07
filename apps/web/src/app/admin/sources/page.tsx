'use client'

import { useEffect, useState } from 'react'

interface Source {
  id: string
  watchmodeId: number | null
  episodeId: string | null
  embedUrl: string
  sourceName: string
  quality: string | null
  language: string
  isActive: boolean
  reportsCount: number
}

export default function AdminSourcesPage() {
  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const [watchmodeId, setWatchmodeId] = useState('')
  const [embedUrl, setEmbedUrl] = useState('')
  const [sourceName, setSourceName] = useState('')
  const [quality, setQuality] = useState('')
  const [language, setLanguage] = useState('en')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function loadSources() {
    setLoading(true)
    const res = await fetch('/api/admin/sources')
    if (res.ok) setSources(await res.json())
    setLoading(false)
  }

  useEffect(() => { loadSources() }, [])

  async function addSource(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    const body: Record<string, unknown> = { embedUrl, sourceName, language }
    const wmId = parseInt(watchmodeId, 10)
    if (!isNaN(wmId)) body.watchmodeId = wmId
    if (quality) body.quality = quality

    const res = await fetch('/api/admin/sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      setSuccess('Source added successfully')
      setEmbedUrl('')
      setSourceName('')
      setQuality('')
      setWatchmodeId('')
      setShowForm(false)
      loadSources()
    } else {
      const data = await res.json()
      setError(data.error ?? 'Failed to add source')
    }
  }

  async function deleteSource(id: string) {
    if (!confirm('Delete this source?')) return
    await fetch(`/api/admin/sources?id=${id}`, { method: 'DELETE' })
    loadSources()
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Embed Sources</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
        >
          {showForm ? 'Cancel' : 'Add Source'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={addSource} className="mb-8 space-y-3 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Watchmode ID (for movies)</label>
              <input
                type="number"
                value={watchmodeId}
                onChange={e => setWatchmodeId(e.target.value)}
                className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500"
                placeholder="e.g. 12345"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Source Name</label>
              <input
                value={sourceName}
                onChange={e => setSourceName(e.target.value)}
                className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500"
                placeholder="e.g. VidCloud"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs text-zinc-500">Embed URL (HTTPS required)</label>
              <input
                value={embedUrl}
                onChange={e => setEmbedUrl(e.target.value)}
                className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500"
                placeholder="https://example.com/embed/123"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Quality</label>
              <input
                value={quality}
                onChange={e => setQuality(e.target.value)}
                className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500"
                placeholder="e.g. 1080p"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Language</label>
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500"
              >
                <option value="en">English</option>
                <option value="tr">Turkish</option>
                <option value="multi">Multi</option>
              </select>
            </div>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          {success && <p className="text-sm text-emerald-400">{success}</p>}
          <button
            type="submit"
            className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
          >
            Add Source
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-zinc-500">Loading...</p>
      ) : sources.length === 0 ? (
        <p className="text-zinc-500">No sources yet. Add your first embed source above.</p>
      ) : (
        <div className="space-y-2">
          {sources.map(s => (
            <div key={s.id} className="flex items-center justify-between rounded border border-zinc-800 bg-zinc-900 p-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">{s.sourceName}</span>
                  {s.quality && <span className="text-xs text-zinc-500">{s.quality}</span>}
                  <span className="text-xs uppercase text-zinc-500">{s.language}</span>
                  <span className={`h-2 w-2 rounded-full ${s.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  {s.reportsCount > 0 && (
                    <span className="rounded bg-red-900/50 px-2 py-0.5 text-xs text-red-400">{s.reportsCount} reports</span>
                  )}
                </div>
                <p className="mt-1 truncate text-sm text-zinc-300">{s.embedUrl}</p>
                <p className="text-xs text-zinc-600">
                  {s.watchmodeId ? `Movie #${s.watchmodeId}` : ''}
                  {s.episodeId ? `Episode ${s.episodeId}` : ''}
                </p>
              </div>
              <button
                onClick={() => deleteSource(s.id)}
                className="ml-4 rounded bg-red-900/50 px-3 py-1.5 text-xs text-red-400 hover:bg-red-800 transition-colors"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
