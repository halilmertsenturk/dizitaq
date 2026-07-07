import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/admin'
import { redirect } from 'next/navigation'

export default async function AdminReportsPage() {
  if (!isAdmin()) redirect('/admin/login')

  const reports = await prisma.report.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { email: true } },
      source: { select: { embedUrl: true, sourceName: true, isActive: true, id: true } },
    },
  })

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">User Reports</h1>
      {reports.length === 0 ? (
        <p className="text-zinc-500">No reports yet.</p>
      ) : (
        <div className="space-y-3">
          {reports.map(r => (
            <div key={r.id} className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded px-2 py-0.5 text-xs ${
                      r.reason === 'malicious' ? 'bg-red-900/50 text-red-400' :
                      r.reason === 'broken' ? 'bg-yellow-900/50 text-yellow-400' :
                      'bg-zinc-800 text-zinc-400'
                    }`}>{r.reason}</span>
                    <span className="text-xs text-zinc-500">{new Date(r.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-300">{r.source.sourceName}: {r.source.embedUrl}</p>
                  <p className="mt-1 text-xs text-zinc-500">Reported by: {r.user.email}</p>
                </div>
                <form action="/api/admin/reports" method="POST" className="flex gap-2">
                  <input type="hidden" name="sourceId" value={r.source.id} />
                  <input type="hidden" name="action" value="disable" />
                  <button type="submit" className="rounded bg-red-900/50 px-3 py-1.5 text-xs text-red-400 hover:bg-red-800 transition-colors">
                    Disable Source
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
