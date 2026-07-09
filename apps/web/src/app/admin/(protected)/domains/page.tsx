'use client'

import { useEffect, useState } from 'react'

export default function AdminDomainsPage() {
  const [domains, setDomains] = useState<string[]>([])
  const [newDomain, setNewDomain] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function loadDomains() {
    setLoading(true)
    const res = await fetch('/api/admin/domains')
    if (res.ok) {
      const data = await res.json()
      setDomains(data.domains ?? [])
    }
    setLoading(false)
  }

  useEffect(() => { loadDomains() }, [])

  async function addDomain(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    const res = await fetch('/api/admin/domains', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: newDomain }),
    })

    if (res.ok) {
      setSuccess('Domain added')
      setNewDomain('')
      loadDomains()
    } else {
      const data = await res.json()
      setError(data.error ?? 'Failed to add domain')
    }
  }

  async function removeDomain(domain: string) {
    await fetch(`/api/admin/domains?domain=${encodeURIComponent(domain)}`, { method: 'DELETE' })
    loadDomains()
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Embed Domain Whitelist</h1>

      <form onSubmit={addDomain} className="mb-8 flex gap-3">
        <input
          value={newDomain}
          onChange={e => setNewDomain(e.target.value)}
          className="flex-1 rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500"
          placeholder="example.com"
          required
        />
        <button
          type="submit"
          className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
        >
          Add Domain
        </button>
      </form>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
      {success && <p className="mb-4 text-sm text-emerald-400">{success}</p>}

      {loading ? (
        <p className="text-zinc-500">Loading...</p>
      ) : domains.length === 0 ? (
        <p className="text-zinc-500">No domains whitelisted yet. Add domains to allow embedding from them.</p>
      ) : (
        <div className="space-y-2">
          {domains.map(d => (
            <div key={d} className="flex items-center justify-between rounded border border-zinc-800 bg-zinc-900 p-3">
              <span className="text-sm text-zinc-200">{d}</span>
              <button
                onClick={() => removeDomain(d)}
                className="rounded bg-red-900/50 px-3 py-1.5 text-xs text-red-400 hover:bg-red-800 transition-colors"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
