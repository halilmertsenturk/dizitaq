'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Search, Film, List, LogOut, User, Menu } from 'lucide-react'
import { useState } from 'react'

export function Navbar() {
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <Film className="h-6 w-6 text-primary" />
          <span className="bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">
            Dizitaq
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/search"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Search className="h-4 w-4" />
            Search
          </Link>

          {session ? (
            <>
              <Link
                href="/watchlist"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <List className="h-4 w-4" />
                Watchlist
              </Link>
              <Link
                href="/profile"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <User className="h-4 w-4" />
                Profile
              </Link>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{session.user?.name}</span>
                <Button variant="ghost" size="sm" onClick={() => signOut()}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <Link href="/auth/login">
              <Button variant="default" size="sm">
                <User className="h-4 w-4 mr-1" />
                Sign In
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-background p-4 space-y-3">
          <Link
            href="/search"
            className="flex items-center gap-2 py-2 text-sm"
            onClick={() => setMobileOpen(false)}
          >
            <Search className="h-4 w-4" /> Search
          </Link>
          {session ? (
            <>
              <Link
                href="/watchlist"
                className="flex items-center gap-2 py-2 text-sm"
                onClick={() => setMobileOpen(false)}
              >
                <List className="h-4 w-4" /> Watchlist
              </Link>
              <Link
                href="/profile"
                className="flex items-center gap-2 py-2 text-sm"
                onClick={() => setMobileOpen(false)}
              >
                <User className="h-4 w-4" /> Profile
              </Link>
              <button
                onClick={() => { signOut(); setMobileOpen(false) }}
                className="flex items-center gap-2 py-2 text-sm text-muted-foreground"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </>
          ) : (
            <Link href="/auth/login" onClick={() => setMobileOpen(false)}>
              <Button variant="default" size="sm" className="w-full">
                <User className="h-4 w-4 mr-1" /> Sign In
              </Button>
            </Link>
          )}
        </div>
      )}
    </nav>
  )
}
