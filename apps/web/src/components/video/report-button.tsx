'use client'

import { useState } from 'react'

interface ReportButtonProps {
  sourceId: string
}

export function ReportButton({ sourceId }: ReportButtonProps) {
  const [sent, setSent] = useState(false)

  async function handleReport() {
    if (sent) return
    const reason = prompt('Why are you reporting this source?\n(broken / wrong / malicious / other)')
    if (!reason) return

    const res = await fetch('/api/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceId, reason }),
    })

    if (res.ok) {
      setSent(true)
      alert('Report sent. Thank you!')
    } else {
      const data = await res.json()
      alert(data.error ?? 'Failed to send report')
    }
  }

  return (
    <button
      onClick={handleReport}
      disabled={sent}
      className="rounded bg-zinc-800 px-2.5 py-1 text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 transition-colors"
    >
      {sent ? 'Reported' : 'Report broken link'}
    </button>
  )
}
