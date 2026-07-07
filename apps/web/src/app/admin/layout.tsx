import { isAdmin } from '@/lib/admin'
import { redirect } from 'next/navigation'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!isAdmin()) {
    redirect('/admin/login')
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <nav className="border-b border-zinc-800 bg-zinc-900 px-6 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-6">
            <a href="/admin/dashboard" className="text-lg font-bold text-emerald-400">
              Dizitaq Admin
            </a>
            <div className="flex gap-4 text-sm">
              <a href="/admin/dashboard" className="text-zinc-400 hover:text-zinc-100 transition-colors">
                Dashboard
              </a>
              <a href="/admin/sources" className="text-zinc-400 hover:text-zinc-100 transition-colors">
                Sources
              </a>
              <a href="/admin/domains" className="text-zinc-400 hover:text-zinc-100 transition-colors">
                Domains
              </a>
              <a href="/admin/reports" className="text-zinc-400 hover:text-zinc-100 transition-colors">
                Reports
              </a>
            </div>
          </div>
          <form action="/api/admin/login" method="POST">
            <input type="hidden" name="_action" value="logout" />
            <button type="submit" className="rounded bg-zinc-800 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-100 transition-colors">
              Logout
            </button>
          </form>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl p-6">
        {children}
      </main>
    </div>
  )
}
