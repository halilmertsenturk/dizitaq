import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/admin'
import { redirect } from 'next/navigation'

export default async function AdminDashboardPage() {
  if (!isAdmin()) redirect('/admin/login')

  const [totalTitles, totalSources, totalReports, totalUsers] = await Promise.all([
    prisma.cachedTitle.count(),
    prisma.videoSource.count(),
    prisma.report.count(),
    prisma.user.count(),
  ])

  const recentReports = await prisma.report.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { email: true } }, source: { select: { embedUrl: true, sourceName: true } } },
  })

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Titles" value={totalTitles} />
        <StatCard label="Embed Sources" value={totalSources} />
        <StatCard label="Reports" value={totalReports} />
        <StatCard label="Users" value={totalUsers} />
      </div>

      <h2 className="mb-4 text-lg font-semibold">Recent Reports</h2>
      <div className="space-y-2">
        {recentReports.length === 0 && <p className="text-zinc-500">No reports yet.</p>}
        {recentReports.map(r => (
          <div key={r.id} className="rounded border border-zinc-800 bg-zinc-900 p-3 text-sm">
            <span className="mr-2 rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">{r.reason}</span>
            <span className="text-zinc-400">from</span> {r.user.email}
            <span className="text-zinc-600"> on </span>
            <span className="text-zinc-300">{r.source.sourceName}</span>
            <span className="ml-2 text-xs text-zinc-600">{new Date(r.createdAt).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="text-2xl font-bold text-emerald-400">{value}</p>
    </div>
  )
}
