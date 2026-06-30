'use client'

import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from '@/components/layout/theme-provider'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider defaultTheme="dark" storageKey="dizitaq-theme">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </ThemeProvider>
    </SessionProvider>
  )
}
